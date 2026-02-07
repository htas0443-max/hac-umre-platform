"""
Production Logging & Sentry Monitoring — Backend

Her API çağrısını loglar (user_id, endpoint, status code, duration).
Hata durumunda stack trace + Sentry'ye raporlar.

Kurulum: pip install sentry-sdk[fastapi]
"""
import logging
import time
import os
import traceback
from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# ============================================
# 1. STRUCTURED LOGGING SETUP
# ============================================

LOG_FORMAT = "[%(asctime)s] %(levelname)s %(name)s | %(message)s"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format=LOG_FORMAT,
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("hac-umre-api")


# ============================================
# 2. SENTRY INITIALIZATION
# ============================================

def init_sentry():
    """
    Backend Sentry kurulumu.
    SENTRY_DSN env variable olmalı.
    """
    sentry_dsn = os.getenv("SENTRY_DSN", "")
    if not sentry_dsn:
        logger.warning("SENTRY_DSN bulunamadı — monitoring devre dışı")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=os.getenv("ENVIRONMENT", "development"),
            traces_sample_rate=0.3,      # %30 performance tracing
            profiles_sample_rate=0.1,   # %10 profiling

            # Hassas verileri filtrele
            before_send=_filter_sensitive_data,

            integrations=[
                FastApiIntegration(),
                StarletteIntegration(),
            ],
        )
        logger.info("✅ Sentry monitoring aktif")
    except ImportError:
        logger.warning("sentry-sdk yüklü değil — 'pip install sentry-sdk[fastapi]' çalıştırın")
    except Exception as e:
        logger.error(f"Sentry init hatası: {e}")


def _filter_sensitive_data(event, hint):
    """Sentry'ye göndermeden önce hassas verileri temizle"""
    if event.get("request", {}).get("data"):
        data = event["request"]["data"]
        if isinstance(data, dict):
            sensitive_keys = {"password", "token", "secret", "key",
                              "authorization", "cookie", "refresh_token",
                              "access_token", "service_role"}
            for k in list(data.keys()):
                if any(s in k.lower() for s in sensitive_keys):
                    data[k] = "[REDACTED]"

    # Header'lardan Authorization temizle
    if event.get("request", {}).get("headers"):
        headers = event["request"]["headers"]
        if isinstance(headers, dict):
            for key in ["authorization", "cookie", "x-csrf-token"]:
                if key in headers:
                    headers[key] = "[REDACTED]"

    return event


# ============================================
# 3. REQUEST LOGGING MIDDLEWARE
# ============================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Her API isteğini loglar:
    - Method, path, status code, duration
    - User ID (varsa)
    - Error durumunda stack trace

    Örnek çıktı:
    [2026-02-08 00:00:00] INFO | POST /api/tours 201 45ms user=abc-123
    [2026-02-08 00:00:00] ERROR | POST /api/tours 500 120ms user=abc-123 | ValueError: ...
    """

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        method = request.method
        path = request.url.path
        user_id = "anon"

        # Skip health check ve static dosyalar
        if path in ("/health", "/favicon.ico", "/docs", "/openapi.json"):
            return await call_next(request)

        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start) * 1000)
            status = response.status_code

            # User ID'yi response header'dan veya request state'den al
            try:
                if hasattr(request.state, "user_id"):
                    user_id = request.state.user_id
            except Exception:
                pass

            # Loglama seviyesi status code'a göre
            log_msg = f"{method} {path} {status} {duration_ms}ms user={user_id}"

            if status >= 500:
                logger.error(log_msg)
            elif status >= 400:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)

            return response

        except Exception as exc:
            duration_ms = int((time.time() - start) * 1000)
            tb = traceback.format_exc()
            logger.error(
                f"{method} {path} 500 {duration_ms}ms user={user_id} | "
                f"{type(exc).__name__}: {exc}\n{tb}"
            )

            # Sentry'ye gönder
            try:
                import sentry_sdk
                sentry_sdk.set_tag("endpoint", path)
                sentry_sdk.set_tag("method", method)
                sentry_sdk.set_user({"id": user_id})
                sentry_sdk.capture_exception(exc)
            except ImportError:
                pass

            raise


# ============================================
# 4. USER ID INJECTION HELPER
# ============================================

def set_request_user(request: Request, user_id: str):
    """
    Request state'e user_id ekler.
    get_current_user dependency'si içinde çağrılmalı.
    """
    request.state.user_id = user_id
