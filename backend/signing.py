"""
API Request Signing Middleware
HMAC-SHA256 ile tüm API isteklerini doğrular.
Bot/script saldırılarını engeller.
"""
import hmac
import hashlib
import time
import os
from fastapi import Request, HTTPException
from cachetools import TTLCache

# Signing secret — .env'den okunur
API_SIGNING_SECRET = os.getenv("API_SIGNING_SECRET", "")

# Nonce replay koruması — 2 dakika TTL, max 50.000 nonce
_used_nonces: TTLCache = TTLCache(maxsize=50000, ttl=120)

# İmza doğrulaması gerektirmeyen endpoint'ler
EXEMPT_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/sync-session",
    "/api/auth/reset-password",
    "/api/auth/verify-otp",
    "/docs",
    "/openapi.json",
    "/health",
}

# İmza doğrulaması gerektirmeyen path prefix'leri
EXEMPT_PREFIXES = (
    "/api/tours",        # Public tur listeleme
    "/api/agencies",     # Public acente listeleme
)

TIMESTAMP_TOLERANCE = 60  # ± 60 saniye


def _is_exempt(path: str) -> bool:
    """Path imzadan muaf mı?"""
    if path in EXEMPT_PATHS:
        return True
    # GET istekleri için public endpoint'ler
    for prefix in EXEMPT_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


def compute_signature(method: str, path: str, timestamp: str, nonce: str, body_hash: str, secret: str) -> str:
    """HMAC-SHA256 imza hesapla."""
    message = f"{method}:{path}:{timestamp}:{nonce}:{body_hash}"
    return hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


async def verify_request_signature(request: Request, call_next):
    """
    API Request Signing Middleware.
    
    Her istekte X-Timestamp, X-Nonce, X-Signature header'larını doğrular.
    Eşleşmeyen veya süresi geçmiş istekleri reddeder.
    """
    path = request.url.path
    method = request.method

    # Muaf endpoint'ler (GET public & auth)
    if _is_exempt(path) and method == "GET":
        return await call_next(request)
    
    # Auth endpoint'leri tüm method'lar için muaf
    if path in EXEMPT_PATHS:
        return await call_next(request)

    # OPTIONS (CORS preflight) her zaman geçer
    if method == "OPTIONS":
        return await call_next(request)

    # Secret yoksa middleware devre dışı (development)
    if not API_SIGNING_SECRET:
        return await call_next(request)

    # Header'ları oku
    timestamp = request.headers.get("X-Timestamp", "")
    nonce = request.headers.get("X-Nonce", "")
    signature = request.headers.get("X-Signature", "")

    if not all([timestamp, nonce, signature]):
        raise HTTPException(
            status_code=401,
            detail="İstek imzası eksik (X-Timestamp, X-Nonce, X-Signature gerekli)"
        )

    # Timestamp kontrolü (±60 saniye)
    try:
        req_time = int(timestamp)
        now = int(time.time())
        if abs(now - req_time) > TIMESTAMP_TOLERANCE:
            raise HTTPException(
                status_code=401,
                detail="İstek süresi dolmuş (timestamp tolerans dışı)"
            )
    except ValueError:
        raise HTTPException(status_code=401, detail="Geçersiz timestamp")

    # Nonce replay koruması
    if nonce in _used_nonces:
        raise HTTPException(status_code=401, detail="Tekrarlanan istek (nonce replay)")
    _used_nonces[nonce] = True

    # Body hash hesapla
    body = await request.body()
    body_hash = hashlib.sha256(body).hexdigest() if body else hashlib.sha256(b"").hexdigest()

    # İmza hesapla ve karşılaştır
    expected = compute_signature(method, path, timestamp, nonce, body_hash, API_SIGNING_SECRET)

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Geçersiz istek imzası")

    return await call_next(request)
