"""
Hac & Umre Platformu API — Main Application Entry Point
All route handlers are in routes/ modules. This file handles:
  - FastAPI app creation
  - Middleware (CORS, WAF, timeout, security headers, request logging)
  - Exception handlers
  - Router registration
  - Background task lifecycle
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

from security import (
    limiter,
    add_security_headers,
    log_security_event,
    _rate_limit_exceeded_handler,
)
from signing import verify_request_signature
from logging_config import init_sentry, RequestLoggingMiddleware, logger

# Initialize Sentry monitoring (production error tracking)
init_sentry()


# =========================================================================
# LIFESPAN — Background task lifecycle (modern replacement for on_event)
# =========================================================================
from routes.monitoring_routes import (
    _process_email_queue,
    _execute_scheduled_actions,
    _uptime_scheduler,
)


async def _combined_scheduler():
    """Combined background scheduler: email queue + scheduled actions (every 30s)"""
    while True:
        try:
            await asyncio.sleep(30)
            await _process_email_queue()
            await _execute_scheduled_actions()
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app):
    """Modern lifespan handler — replaces deprecated on_event('startup'/'shutdown')"""
    combined_task = asyncio.create_task(_combined_scheduler())
    uptime_task = asyncio.create_task(_uptime_scheduler())
    yield
    combined_task.cancel()
    uptime_task.cancel()


# Initialize FastAPI app
app = FastAPI(title="Hac & Umre Platformu API", lifespan=lifespan)

# -------------------------------------------------------------------------
# ✅ 5️⃣ RATE LIMIT (BRUTE FORCE)
# -------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# ✅ REQUEST LOGGING (her API çağrısını loglar)
if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.add_middleware(RequestLoggingMiddleware)

# ⚠️ Development modda security headers ve signing middleware devre dışı
if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.middleware("http")(add_security_headers)
    app.middleware("http")(verify_request_signature)

# -------------------------------------------------------------------------
# ✅ 4️⃣ CORS WHITELIST
# -------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,https://hacveumreturlari.net"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)

# ===== SEC-006: GENERIC ERROR HANDLER (Information Leakage Prevention) =====

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler to prevent information leakage"""
    log_security_event("UNHANDLED_EXCEPTION", {
        "path": str(request.url.path),
        "method": request.method,
        "error_type": type(exc).__name__,
        "error": str(exc)[:200]
    }, "ERROR")
    return JSONResponse(
        status_code=500,
        content={"detail": "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with safe messages"""
    log_security_event("VALIDATION_ERROR", {
        "path": str(request.url.path),
        "errors": str(exc.errors())[:200]
    }, "WARN")
    return JSONResponse(
        status_code=422,
        content={"detail": "Geçersiz istek formatı. Lütfen girdiğiniz bilgileri kontrol edin."}
    )

# ===== REQUEST TIMEOUT MIDDLEWARE (DoS Protection) =====
from starlette.middleware.base import BaseHTTPMiddleware

class TimeoutMiddleware(BaseHTTPMiddleware):
    """Prevent long-running requests (DoS protection)"""

    async def dispatch(self, request: Request, call_next):
        if "/api/chat" in str(request.url) or "/api/compare" in str(request.url):
            timeout = 60
        else:
            timeout = 30

        try:
            return await asyncio.wait_for(call_next(request), timeout=timeout)
        except asyncio.TimeoutError:
            log_security_event("REQUEST_TIMEOUT", {
                "path": str(request.url.path),
                "method": request.method
            }, "WARN")
            return JSONResponse(
                status_code=504,
                content={"detail": "İstek zaman aşımına uğradı. Lütfen tekrar deneyin."}
            )

if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.add_middleware(TimeoutMiddleware)

# -------------------------------------------------------------------------
# ✅ 6️⃣ APPLICATION WAF (Bot Protection)
# -------------------------------------------------------------------------
@app.middleware("http")
async def waf_middleware(request: Request, call_next):
    """Simple application-layer WAF to block common exploit paths"""
    path = request.url.path.lower()
    blocked_paths = [
        "/wp-admin", "/phpmyadmin", "/.env", "/.git",
        "/console", "/admin/login.php"
    ]

    for blocked in blocked_paths:
        if blocked in path:
            client_ip = request.client.host if request.client else "unknown"
            log_security_event("WAF_BLOCK", {"path": path, "ip": client_ip}, "WARN")
            return JSONResponse(status_code=403, content={"detail": "Access Denied"})

    return await call_next(request)


# =========================================================================
# REGISTER ROUTE MODULES
# =========================================================================
from routes import (
    auth_router,
    tour_router,
    operator_router,
    ai_router,
    user_router,
    admin_router,
    monitoring_router,
)

app.include_router(auth_router)
app.include_router(tour_router)
app.include_router(operator_router)
app.include_router(ai_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(monitoring_router)


# =========================================================================
# BACKGROUND TASKS — moved to lifespan context manager above
# =========================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
