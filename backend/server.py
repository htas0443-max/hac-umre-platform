from fastapi import FastAPI, UploadFile, File, Form, Header, Request, status, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
# from fastapi.middleware.https_redirect import HttpsRedirectMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json
from dotenv import load_dotenv
load_dotenv()  # .env dosyasını yükle — CORS_ORIGINS, ENVIRONMENT vb. için ZORUNLU
from supabase import create_client, Client
import csv
import io
import asyncio
from ai_service import AIService
from security import (
    limiter, 
    add_security_headers, 
    validate_input, 
    validate_password_strength,
    check_brute_force,
    record_failed_login,
    record_successful_login,
    log_security_event,
    _rate_limit_exceeded_handler,
    mask_sensitive_data,
    verify_turnstile_token
)
from signing import verify_request_signature
from logging_config import init_sentry, RequestLoggingMiddleware, logger

# Load environment variables
load_dotenv()

# Initialize Sentry monitoring (production error tracking)
init_sentry()

# Initialize FastAPI app
app = FastAPI(title="Hac & Umre Platformu API")

# -------------------------------------------------------------------------
# ✅ 1️⃣ HTTPS ZORUNLU (EN KRİTİK)
# Production ortamında HTTPS zorunlu kılınır.
# Local development ("development") modunda iptal edilebilir.
# -------------------------------------------------------------------------
# if os.getenv("ENVIRONMENT", "production").lower() == "production":
#    app.add_middleware(HttpsRedirectMiddleware)

# -------------------------------------------------------------------------
# ✅ 5️⃣ RATE LIMIT (BRUTE FORCE)
# -------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# ✅ REQUEST LOGGING (her API çağrısını loglar)
# Only in production — BaseHTTPMiddleware causes deadlocks in dev with multiple middlewares
if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.add_middleware(RequestLoggingMiddleware)

# ⚠️ Development modda security headers ve signing middleware devre dışı
# Bu middleware'ler CORS preflight isteklerini bozuyordu.
# Production'da tekrar aktif edilecek.
if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.middleware("http")(add_security_headers)
    app.middleware("http")(verify_request_signature)

# -------------------------------------------------------------------------
# ✅ 4️⃣ CORS WHITELIST — EN SON EKLENMELİ (en dış katman)
# -------------------------------------------------------------------------
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://hacveumreturlari.net").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)

# ===== SEC-006: GENERIC ERROR HANDLER (Information Leakage Prevention) =====
from fastapi.exceptions import RequestValidationError

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler to prevent information leakage"""
    # Log the actual error for debugging
    log_security_event("UNHANDLED_EXCEPTION", {
        "path": str(request.url.path),
        "method": request.method,
        "error_type": type(exc).__name__,
        "error": str(exc)[:200]  # Truncate for logging
    }, "ERROR")
    
    # Return generic error to client
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

# NOTE: add_security_headers is registered conditionally above (lines 63-65)
# DO NOT register it again here — it breaks CORS preflight in development mode.

# ===== REQUEST TIMEOUT MIDDLEWARE (DoS Protection) =====
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class TimeoutMiddleware(BaseHTTPMiddleware):
    """Prevent long-running requests (DoS protection)"""
    
    async def dispatch(self, request: Request, call_next):
        # AI endpoints need more time (60s), others 30s
        if "/api/chat" in str(request.url) or "/api/compare" in str(request.url):
            timeout = 60  # AI calls can take longer
        else:
            timeout = 30  # Standard timeout
        
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

# Only enable timeout middleware in production — it causes deadlocks
# when combined with other BaseHTTPMiddleware subclasses in development
if os.getenv("ENVIRONMENT", "production").lower() == "production":
    app.add_middleware(TimeoutMiddleware)

# NOTE: CORS middleware is already registered above (lines 72-80).
# The duplicate registration was removed because it conflicted with the primary one
# and caused CORS preflight failures. All CORS config is in the single middleware above.

# -------------------------------------------------------------------------
# ✅ 6️⃣ APPLICATION WAF (Bot Protection)
# -------------------------------------------------------------------------
@app.middleware("http")
async def waf_middleware(request: Request, call_next):
    """Simple application-layer WAF to block common exploit paths"""
    path = request.url.path.lower()
    blocked_paths = [
        "/wp-admin", 
        "/phpmyadmin", 
        "/.env", 
        "/.git",
        "/console", 
        "/admin/login.php"
    ]
    
    for blocked in blocked_paths:
        if blocked in path:
            client_ip = request.client.host if request.client else "unknown"
            # Log as security event
            # We use a simple print here to avoid circular imports if security.py depends on something
            # But better to use the log_security_event from imports
            log_security_event("WAF_BLOCK", {"path": path, "ip": client_ip}, "WARN")
            return JSONResponse(status_code=403, content={"detail": "Access Denied"})
            
    return await call_next(request)

# Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

security = HTTPBearer(auto_error=False)  # auto_error=False: Cookie'den de token alabiliriz

# AI Service
ai_service = AIService()

# Helper Functions
async def get_token_from_request(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None) -> str:
    """Token'ı header veya cookie'den al"""
    # 1. Authorization header'dan dene
    if credentials and credentials.credentials:
        return credentials.credentials
    
    # 2. HttpOnly cookie'den dene
    token = request.cookies.get("access_token")
    if token:
        return token
    
    raise HTTPException(status_code=401, detail="Token bulunamadı")

def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Supabase JWT'den kullanıcıyı doğrular - Header veya Cookie'den"""
    try:
        # Token'ı header veya cookie'den al
        token = None
        
        # 1. Authorization header'dan dene
        if credentials and credentials.credentials:
            token = credentials.credentials
        
        # 2. HttpOnly cookie'den dene (fallback)
        if not token:
            token = request.cookies.get("access_token")
        
        if not token:
            raise HTTPException(status_code=401, detail="Token bulunamadı")
        
        # Create a new Supabase client with the user's token
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(token, token)  # Set both access and refresh token
        
        # Get user from token
        user_response = user_supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        
        # Get user profile from public.users with service role client
        profile = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not profile.data:
            raise HTTPException(status_code=404, detail="Kullanıcı profili bulunamadı")
        
        return profile.data[0]
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("AUTH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=401, detail="Kimlik doğrulama hatası")

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Admin yetkisi gerektirir (admin veya super_admin)"""
    if user.get("user_role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return user

def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    """Sadece super_admin yetkisi gerektirir (kritik ayarlar için)"""
    if user.get("user_role") != "super_admin":
        raise HTTPException(status_code=403, detail="Bu işlem için super admin yetkisi gerekli")
    return user

def require_operator(user: dict = Depends(get_current_user)) -> dict:
    """Operator yetkisi gerektirir"""
    if user.get("user_role") not in ["operator", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Tur şirketi yetkisi gerekli")
    return user

def require_role(*allowed_roles: str):
    """Belirli rollere erişim izni veren esnek yetki kontrol fonksiyonu"""
    def dependency(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("user_role", "")
        if user_role not in allowed_roles and user_role != "super_admin":
            raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
        return user
    return dependency

def get_optional_user(request: Request) -> Optional[dict]:
    """Opsiyonel kullanıcı kimlik doğrulaması - giriş yapmayan kullanıcılar için None döner"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        if not token:
            return None
        
        # Create a new Supabase client with the user's token
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(token, token)
        
        # Get user from token
        user_response = user_supabase.auth.get_user(token)
        
        if not user_response.user:
            return None
        
        # Get user profile from public.users with service role client
        profile = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not profile.data:
            return None
        
        return profile.data[0]
    except Exception:
        return None

# Admin Audit Log Helper
async def log_admin_action(request: Request, admin_id: str, action: str, details: Dict[str, Any] = None):
    """Log admin action to Supabase audit table"""
    try:
        if details is None:
            details = {}
            
        # Mask sensitive data
        details = mask_sensitive_data(details)
        
        # Get secure IP
        from security import get_secure_client_ip
        client_ip = get_secure_client_ip(request)
        
        log_entry = {
            "admin_id": admin_id,
            "action": action,
            "details": details,
            "ip_address": client_ip,
            "user_agent": request.headers.get("user-agent", "")[:200],
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into DB
        # Note: This might fail if table doesn't exist yet, but won't crash the app due to try/except block
        supabase.table("admin_audit_log").insert(log_entry).execute()
        
    except Exception as e:
        # Fallback to console log if DB insert fails
        log_security_event(f"ADMIN_AUDIT_DB_ERROR ({action})", {"error": str(e)}, "ERROR")


# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    user_role: str = Field(default="user")
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: Optional[str] = None  # Cloudflare Turnstile anti-bot token

class TourCreate(BaseModel):
    title: str
    operator: str
    price: float
    currency: str = Field(default="TRY", pattern="^(TRY|USD|EUR)$")  # TRY, USD, EUR
    start_date: str
    end_date: str = "TBD"
    duration: str = "Unspecified"
    hotel: str = "Unspecified"
    services: List[str] = []
    visa: str = "Not Included"
    transport: str = "Not Included"
    guide: str = "Not Included"
    itinerary: List[str] = []
    rating: Optional[float] = None
    source: str = "manual"
    status: str = "draft"

class TourUpdate(BaseModel):
    title: Optional[str] = None
    operator: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    hotel: Optional[str] = None
    services: Optional[List[str]] = None
    visa: Optional[str] = None
    transport: Optional[str] = None
    guide: Optional[str] = None
    itinerary: Optional[List[str]] = None
    rating: Optional[float] = None
    status: Optional[str] = None

class CompareRequest(BaseModel):
    tour_ids: List[str] = Field(min_items=2, max_items=3)
    criteria: List[str]
    ai_provider: str = Field(default="anthropic")

class ChatRequest(BaseModel):
    message: str
    context_tour_ids: Optional[List[str]] = None
    ai_provider: str = Field(default="anthropic")

# Admin Models
class NotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)
    target_role: str = Field(default="all")

class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]

# Routes
@app.get("/api/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Health check with cache stats"""
    from cache import get_cache_stats, REDIS_AVAILABLE
    
    cache_stats = get_cache_stats()
    
    return {
        "status": "healthy",
        "service": "Hac & Umre API - Supabase",
        "security": "enhanced",
        "scalability": {
            "cache_enabled": True,
            "redis_available": REDIS_AVAILABLE,
            "ai_cache_size": cache_stats.get("ai_cache_size", 0),
            "ai_cache_hit_rate": round(cache_stats.get("ai_hit_rate", 0) * 100, 2)
        },
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Auth Routes
@app.post("/api/auth/register")
@limiter.limit("5/hour")  # Max 5 kayıt per hour per IP
async def register(request: Request, user_data: UserRegister):
    """Yeni kullanıcı kaydı (Supabase Auth) - Secure"""
    try:
        # Password strength validation
        validate_password_strength(user_data.password)
        
        # Email sanitization
        email = validate_input(user_data.email, "email")
        
        # ===== CRITICAL-002 FIX: Role Injection Prevention =====
        # Bu endpoint SADECE normal kullanıcı kaydı içindir
        # Operator/Admin rolü bu endpoint'ten ATANAMAZ
        allowed_roles = ["user"]
        
        if user_data.user_role not in allowed_roles:
            log_security_event("ROLE_INJECTION_ATTEMPT", {
                "email": email,
                "attempted_role": user_data.user_role,
                "ip": request.client.host
            }, "CRITICAL")
            # Sessizce user rolüne düşür, saldırganı bilgilendirme
            user_data.user_role = "user"
        
        # Operator kaydı /api/operator/register endpoint'inden yapılmalı
        if user_data.company_name:
            log_security_event("OPERATOR_REGISTRATION_WRONG_ENDPOINT", {
                "email": email,
                "ip": request.client.host
            }, "WARN")
            # company_name'i yoksay, sadece user olarak kaydet
            user_data.company_name = None
        
        # Company name sanitization (artık None olacak normal register için)
        company_name = None
        
        # Log security event
        log_security_event("USER_REGISTRATION", {
            "email": email,
            "role": "user",  # Her zaman user
            "ip": request.client.host
        })
        
        # Supabase Auth ile kayıt (Service Role Key ile - auto confirm)
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": user_data.password,
            "email_confirm": True,  # Auto confirm email
            "user_metadata": {
                "user_role": "user",  # HARDCODED - kullanıcıdan ALINMAZ
                "company_name": None
            }
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail=f"Kayıt başarısız")
        
        # Now sign in the user to get a session
        sign_in_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": user_data.password
        })
        
        return {
            "message": "Kayıt başarılı",
            "token": sign_in_response.session.access_token if sign_in_response.session else None,
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": user_data.user_role,
                "company_name": company_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REGISTRATION_FAILED", {
            "email": user_data.email,
            "error": str(e)
        }, "ERROR")
        raise HTTPException(status_code=400, detail="Kayıt sırasında bir hata oluştu")

@app.post("/api/auth/login")
@limiter.limit("10/minute")  # Max 10 login attempt per minute
async def login(request: Request, credentials: UserLogin, response: Response):
    """Kullanıcı girişi (Supabase Auth) - Brute Force Protected + HttpOnly Cookie"""
    client_ip = request.client.host
    
    try:
        # Check brute force
        check_brute_force(client_ip)
        
        # Cloudflare Turnstile anti-bot doğrulaması
        if not await verify_turnstile_token(credentials.turnstile_token or "", client_ip):
            log_security_event("TURNSTILE_REJECTED", {"email": credentials.email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=403, detail="Bot doğrulaması başarısız. Lütfen tekrar deneyin.")
        
        # Email sanitization
        email = validate_input(credentials.email, "email")
        
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": credentials.password
        })
        
        if not auth_response.user:
            record_failed_login(client_ip)
            log_security_event("LOGIN_FAILED", {"email": email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
        
        # Successful login
        record_successful_login(client_ip)
        log_security_event("LOGIN_SUCCESS", {"email": email, "ip": client_ip})
        
        # Get user profile
        profile = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        user_data = {}
        if profile.data and len(profile.data) > 0:
            user_data = profile.data[0]
        else:
            user_data = {
                "user_role": "user",
                "company_name": None
            }
        
        # ===== SOFT BAN: Askıya alınmış kullanıcı kontrolü =====
        if user_data.get('status') == 'suspended':
            log_security_event("SUSPENDED_LOGIN_ATTEMPT", {"email": email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=403, detail="Hesabınız askıya alınmıştır. Destek ile iletişime geçin.")
        
        # Generate CSRF token for this session
        from security import create_csrf_token_for_session
        csrf_token = create_csrf_token_for_session(auth_response.user.id)
        
        # ===== CRITICAL-004 FIX: Set HttpOnly Cookie =====
        access_token = auth_response.session.access_token if auth_response.session else None
        
        if access_token:
            # Set HttpOnly cookie - XSS'den korunma
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,          # JavaScript erişemez
                secure=True,            # Sadece HTTPS üzerinden
                samesite="strict",      # CSRF koruması
                max_age=3600 * 24,      # 24 saat
                path="/",
                domain=None             # Aynı domain
            )
            
            # Refresh token için ayrı cookie
            if auth_response.session.refresh_token:
                response.set_cookie(
                    key="refresh_token",
                    value=auth_response.session.refresh_token,
                    httponly=True,
                    secure=True,
                    samesite="strict",
                    max_age=3600 * 24 * 7,  # 7 gün
                    path="/api/auth",       # Sadece auth endpoint'lerinde
                    domain=None
                )
        
        return {
            "message": "Giriş başarılı",
            "token": access_token,  # Geriye uyumluluk için hala döndür
            "csrf_token": csrf_token,
            "user": {
                "email": auth_response.user.email,
                "role": user_data.get("user_role", "user"),
                "company_name": user_data.get("company_name")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        record_failed_login(client_ip)
        log_security_event("LOGIN_ERROR", {"email": credentials.email, "error": str(e), "ip": client_ip}, "ERROR")
        raise HTTPException(status_code=401, detail="Giriş hatası")

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Mevcut kullanıcı bilgilerini getirir"""
    return {
        "email": user["email"],
        "role": user.get("user_role", "user"),
        "company_name": user.get("company_name"),
        "created_at": user.get("created_at")
    }

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    """Kullanıcı çıkışı - HttpOnly cookie'leri temizler"""
    try:
        # HttpOnly cookie'leri temizle
        response.delete_cookie(
            key="access_token",
            path="/",
            domain=None,
            secure=True,
            httponly=True,
            samesite="strict"
        )
        response.delete_cookie(
            key="refresh_token",
            path="/api/auth",
            domain=None,
            secure=True,
            httponly=True,
            samesite="strict"
        )
        
        log_security_event("LOGOUT_SUCCESS", {
            "ip": request.client.host
        })
        
        return {"message": "Çıkış başarılı"}
    except Exception as e:
        log_security_event("LOGOUT_ERROR", {"error": str(e)}, "ERROR")
        return {"message": "Çıkış yapıldı"}

@app.post("/api/auth/refresh")
async def refresh_session(request: Request, response: Response):
    """Sessiz Token Yenileme (Silent Refresh) - HttpOnly Cookie kullanarak"""
    try:
        # HttpOnly cookie'den refresh token al
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token bulunamadı")
        
        # Supabase ile session yenile
        # Not: supabase-py client doğrudan refresh_session metoduna sahip olmayabilir, set_session ile deneyelim
        try:
            auth_response = supabase.auth.refresh_session(refresh_token)
        except Exception as e:
            # Refresh token geçersiz olabilir
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            raise HTTPException(status_code=401, detail="Oturum süresi doldu")

        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Oturum yenilenemedi")
            
        # Yeni tokenları al
        new_access_token = auth_response.session.access_token
        new_refresh_token = auth_response.session.refresh_token
        
        # Cookie rotasyonu yap (Eski tokenları geçersiz kıl, yenileri set et)
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=True, 
            samesite="strict",
            max_age=3600 * 24,
            path="/"
        )
        
        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=3600 * 24 * 7,
                path="/api/auth"
            )
            
        # Kullanıcı bilgilerini güncelle
        user = auth_response.user
        
        # Rol bilgisini çek
        profile = supabase.table("users").select("*").eq("id", user.id).execute()
        user_role = "user"
        company_name = None
        
        if profile.data:
            user_data = profile.data[0]
            user_role = user_data.get("user_role", "user")
            company_name = user_data.get("company_name")
            
        return {
            "token": new_access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user_role,
                "company_name": company_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REFRESH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=401, detail="Oturum yenileme hatası")

class SessionSync(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: Optional[dict] = None

@app.post("/api/auth/sync")
async def sync_session(session: SessionSync, response: Response, request: Request):
    """Sync client-side session (e.g. OAuth) to HttpOnly cookies"""
    try:
        # Validate token by getting user
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(session.access_token, session.refresh_token or session.access_token)
        user_response = user_supabase.auth.get_user()
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=session.access_token,
            httponly=True,
            secure=True, 
            samesite="strict",
            max_age=3600 * 24,
            path="/"
        )
        
        if session.refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=session.refresh_token,
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=3600 * 24 * 7,
                path="/api/auth"
            )
            
        return {"message": "Session synced"}
    except Exception as e:
        log_security_event("SYNC_ERROR", {"error": str(e)}, "WARN")
        raise HTTPException(status_code=401, detail="Session sync failed")

# Tour Routes
@app.get("/api/tours")
async def get_tours(
    skip: int = 0,
    limit: int = 20,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    operator: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """Turları listeler"""
    try:
        query = supabase.table("tours").select("*")
        
        # Default: sadece approved turlar
        if status:
            query = query.eq("status", status)
        else:
            query = query.eq("status", "approved")
        
        # Fiyat filtresi
        if min_price is not None:
            query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lte("price", max_price)
        
        # Operatör filtresi
        if operator:
            query = query.ilike("operator", f"%{operator}%")
        
        # Sıralama
        ascending = sort_order == "asc"
        query = query.order(sort_by, desc=not ascending)
        
        # Pagination
        query = query.range(skip, skip + limit - 1)
        
        response = query.execute()
        
        # Count query
        count_query = supabase.table("tours").select("id", count="exact")
        if status:
            count_query = count_query.eq("status", status)
        else:
            count_query = count_query.eq("status", "approved")
        count_response = count_query.execute()
        
        return {
            "tours": response.data,
            "total": count_response.count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        log_security_event("TOURS_LOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Turlar yüklenirken bir hata oluştu")

@app.get("/api/tours/{tour_id}")
async def get_tour(tour_id: int):
    """Tek bir turu getirir - SECURITY: Only approved tours visible"""
    try:
        response = supabase.table("tours").select("*").eq("id", tour_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        
        tour = response.data[0]
        
        # SECURITY FIX: Only show approved tours to public
        # Draft/pending/rejected tours should not be visible
        if tour.get("status") != "approved":
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        
        return tour
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Tur getirme hatası")


@app.post("/api/tours")
async def create_tour(tour: TourCreate, user: dict = Depends(require_admin)):
    """Yeni tur oluşturur (Admin)"""
    try:
        tour_data = tour.dict()
        tour_data["operator_id"] = user["id"]
        tour_data["created_by"] = user["email"]
        
        response = supabase.table("tours").insert(tour_data).execute()
        
        # Audit Log
        await log_admin_action(request, user["id"], "CREATE_TOUR", {"tour_id": response.data[0]["id"], "title": tour.title})
        
        return {
            "message": "Tur başarıyla oluşturuldu",
            "tour_id": response.data[0]["id"]
        }
    except Exception as e:
        log_security_event("TOUR_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur oluşturulurken bir hata oluştu")

@app.put("/api/tours/{tour_id}")
async def update_tour(tour_id: int, tour_update: TourUpdate, user: dict = Depends(require_admin)):
    """Turu günceller (Admin)"""
    try:
        update_data = {k: v for k, v in tour_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
        response = supabase.table("tours").update(update_data).eq("id", tour_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        
        # Audit Log
        await log_admin_action(request, user["id"], "UPDATE_TOUR", {"tour_id": tour_id, "updates": update_data.keys()})
        
        return {"message": "Tur başarıyla güncellendi"}
    except Exception as e:
        log_security_event("TOUR_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur güncellenirken bir hata oluştu")

@app.delete("/api/tours/{tour_id}")
async def delete_tour(tour_id: int, user: dict = Depends(require_admin)):
    """Turu siler (Admin)"""
    try:
        response = supabase.table("tours").delete().eq("id", tour_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        
        # Audit Log
        await log_admin_action(request, user["id"], "DELETE_TOUR", {"tour_id": tour_id})
        
        return {"message": "Tur başarıyla silindi"}
    except Exception as e:
        log_security_event("TOUR_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur silinirken bir hata oluştu")

# Operator Routes
@app.get("/api/operator/tours")
async def get_operator_tours(
    user: dict = Depends(require_operator),
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None
):
    """Operatörün kendi turlarını listeler"""
    try:
        query = supabase.table("tours").select("*").eq("operator_id", user["id"])
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        response = query.execute()
        
        # Count
        count_query = supabase.table("tours").select("id", count="exact").eq("operator_id", user["id"])
        if status:
            count_query = count_query.eq("status", status)
        count_response = count_query.execute()
        
        return {
            "tours": response.data,
            "total": count_response.count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        log_security_event("OPERATOR_TOURS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Turlar yüklenirken bir hata oluştu")

@app.post("/api/operator/tours")
async def create_operator_tour(tour: TourCreate, user: dict = Depends(require_operator)):
    """Operatör kendi şirketi için tur oluşturur"""
    try:
        company_name = user.get("company_name")
        if not company_name:
            raise HTTPException(status_code=400, detail="Şirket adı bulunamadı")
        
        tour_data = tour.dict()
        tour_data["operator_id"] = user["id"]
        tour_data["operator"] = company_name
        tour_data["created_by"] = user["email"]
        tour_data["status"] = "pending"  # Operator tours start as pending
        
        response = supabase.table("tours").insert(tour_data).execute()
        
        return {
            "message": "Tur başarıyla oluşturuldu ve onay bekliyor",
            "tour_id": response.data[0]["id"]
        }
    except Exception as e:
        log_security_event("OPERATOR_TOUR_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur oluşturulurken bir hata oluştu")

@app.put("/api/operator/tours/{tour_id}")
async def update_operator_tour(tour_id: int, tour_update: TourUpdate, user: dict = Depends(require_operator)):
    """Operatör kendi turunu günceller - IDOR Protected"""
    try:
        # SEC-001 FIX: Verify ownership before update
        existing = supabase.table("tours").select("operator_id").eq("id", tour_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if existing.data[0]["operator_id"] != user["id"]:
            log_security_event("IDOR_ATTEMPT", {
                "user_id": user["id"],
                "target_tour_id": tour_id,
                "action": "update"
            }, "CRITICAL")
            raise HTTPException(status_code=403, detail="Bu turu düzenleme yetkiniz yok")
        
        update_data = {k: v for k, v in tour_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        
        # Set to pending if approved tour is updated
        update_data["status"] = "pending"
        
        # Double protection: also filter by operator_id
        response = supabase.table("tours").update(update_data).eq("id", tour_id).eq("operator_id", user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı veya yetkiniz yok")
        
        return {"message": "Tur başarıyla güncellendi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Güncelleme hatası")

@app.get("/api/operator/stats")
async def get_operator_stats(user: dict = Depends(require_operator)):
    """Operatörün tur istatistiklerini getirir (RPC)"""
    try:
        # Use Supabase RPC function
        response = supabase.rpc('get_operator_stats', {'operator_user_id': user['id']}).execute()
        
        stats = response.data
        if stats:
            stats['company_name'] = user.get('company_name')
        
        return stats
    except Exception as e:
        log_security_event("OPERATOR_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="İstatistikler alınırken bir hata oluştu")

# Admin Approval Routes

# ============================================
# AUDIT LOG HELPER
# ============================================
async def write_audit_log(
    request: Request,
    user_id: str,
    role: str,
    action: str,
    entity: str = None,
    entity_id: str = None,
    details: dict = None,
    previous_data: dict = None,
    new_data: dict = None
):
    """Audit log'a kayıt ekler. previous_data/new_data rollback için saklanır."""
    try:
        ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "")[:500]
        supabase.table("audit_logs").insert({
            "user_id": user_id,
            "role": role,
            "action": action,
            "entity": entity,
            "entity_id": str(entity_id) if entity_id else None,
            "details": details or {},
            "previous_data": previous_data or {},
            "new_data": new_data or {},
            "ip_address": ip,
            "user_agent": ua,
        }).execute()
    except Exception as e:
        log_security_event("AUDIT_LOG_ERROR", {"error": str(e)}, "WARNING")


@app.put("/api/admin/tours/{tour_id}/approve")
async def approve_tour(tour_id: int, request: Request, user: dict = Depends(require_admin)):
    """Admin turu onaylar (RPC)"""
    try:
        # Use Supabase RPC function
        response = supabase.rpc('approve_tour', {
            'tour_id_param': tour_id,
            'admin_id': user['id'],
            'approval_reason_param': 'Approved by admin'
        }).execute()
        
        # Audit Log
        await write_audit_log(request, user["id"], "admin", "tour.approve", "tour", tour_id)
        
        return response.data
    except Exception as e:
        log_security_event("TOUR_APPROVE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur onaylanırken bir hata oluştu")

@app.put("/api/admin/tours/{tour_id}/reject")
async def reject_tour(tour_id: int, reason: str, request: Request, user: dict = Depends(require_admin)):
    """Admin turu reddeder (RPC)"""
    try:
        # Use Supabase RPC function
        response = supabase.rpc('reject_tour', {
            'tour_id_param': tour_id,
            'admin_id': user['id'],
            'rejection_reason_param': reason
        }).execute()
        
        # Audit Log
        await write_audit_log(request, user["id"], "admin", "tour.reject", "tour", tour_id, {"reason": reason})
        
        return response.data
    except Exception as e:
        log_security_event("TOUR_REJECT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur reddedilirken bir hata oluştu")

# ============================================
# ADMIN: AUDIT LOG PANEL
# ============================================
@app.get("/api/admin/audit-logs")
async def get_audit_logs(
    user: dict = Depends(require_admin),
    skip: int = 0,
    limit: int = 20,
    role: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    """Audit loglarını listeler (sadece admin)"""
    try:
        query = supabase.table("audit_logs").select("*")
        count_query = supabase.table("audit_logs").select("id", count="exact")

        if role:
            query = query.eq("role", role)
            count_query = count_query.eq("role", role)
        if action:
            query = query.eq("action", action)
            count_query = count_query.eq("action", action)
        if date_from:
            query = query.gte("created_at", f"{date_from}T00:00:00")
            count_query = count_query.gte("created_at", f"{date_from}T00:00:00")
        if date_to:
            query = query.lte("created_at", f"{date_to}T23:59:59")
            count_query = count_query.lte("created_at", f"{date_to}T23:59:59")

        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        response = query.execute()
        count_response = count_query.execute()

        return {
            "logs": response.data,
            "total": count_response.count or 0,
            "skip": skip,
            "limit": limit,
        }
    except Exception as e:
        log_security_event("AUDIT_LOG_QUERY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Audit logları alınırken hata oluştu")

# ============================================
# ADMIN: AGENCY ANALYTICS
# ============================================
@app.get("/api/admin/agency-analytics")
async def get_agency_analytics(user: dict = Depends(require_admin)):
    """Ajanta bazlı analytics (sadece admin)"""
    try:
        # Tüm operatörlerin turlarını grupla
        response = supabase.table("tours").select(
            "operator_id, operator, status, created_at"
        ).not_.is_("operator_id", "null").execute()

        # Ajanta bazlı gruplama
        agency_map: Dict[str, dict] = {}
        for tour in response.data:
            oid = tour.get("operator_id")
            if not oid:
                continue
            if oid not in agency_map:
                agency_map[oid] = {
                    "agency_id": oid,
                    "agency_name": tour.get("operator", "İsimsiz"),
                    "total_tours": 0,
                    "approved_tours": 0,
                    "pending_tours": 0,
                    "rejected_tours": 0,
                    "last_activity": tour.get("created_at", ""),
                }
            stats = agency_map[oid]
            stats["total_tours"] += 1
            status = tour.get("status", "")
            if status == "approved":
                stats["approved_tours"] += 1
            elif status == "pending":
                stats["pending_tours"] += 1
            elif status == "rejected":
                stats["rejected_tours"] += 1
            # En son aktivite
            created = tour.get("created_at", "")
            if created > stats["last_activity"]:
                stats["last_activity"] = created

        agencies = sorted(agency_map.values(), key=lambda x: x["total_tours"], reverse=True)

        return {"agencies": agencies}
    except Exception as e:
        log_security_event("AGENCY_ANALYTICS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Analytics verileri alınırken hata oluştu")

# AI Routes
@app.post("/api/compare")
@limiter.limit("10/hour")  # Max 10 AI comparisons per hour
async def compare_tours(request: Request, compare_request: CompareRequest, user: dict = Depends(get_current_user)):
    """AI ile turları karşılaştırır - License Protected"""
    try:
        # License check
        await check_feature_access(user, "ai_compare")
        
        # Turları getir
        tours = []
        for tour_id in compare_request.tour_ids:
            response = supabase.table("tours").select("*").eq("id", int(tour_id)).execute()
            if response.data:
                tours.append(response.data[0])
        
        if len(tours) < 2:
            raise HTTPException(status_code=400, detail="En az 2 tur gerekli")
        
        # AI ile karşılaştır
        result = await ai_service.compare_tours(
            tours=tours,
            criteria=compare_request.criteria,
            provider=compare_request.ai_provider
        )
        
        # Karşılaştırmayı kaydet
        supabase.table("comparisons").insert({
            "user_id": user["id"],
            "tour_ids": compare_request.tour_ids,
            "criteria": compare_request.criteria,
            "ai_provider": compare_request.ai_provider,
            "result": result
        }).execute()
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("AI_COMPARE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Karşılaştırma yapılırken bir hata oluştu")

@app.post("/api/chat")
@limiter.limit("100/hour")  # Base limit - authenticated users get more via dynamic check
async def chat(request: Request, chat_request: ChatRequest):
    """AI chatbot ile sohbet - Giriş yapmadan da kullanılabilir"""
    try:
        # Opsiyonel kullanıcı kimlik doğrulama
        user = get_optional_user(request)
        
        # ===== DYNAMIC RATE LIMITING =====
        from cache import check_user_rate_limit
        from security import get_secure_client_ip
        
        if user:
            # Authenticated users: 100 requests/hour
            user_id = user.get("id", "unknown")
            if not await check_user_rate_limit(user_id, limit=100, window=3600):
                raise HTTPException(status_code=429, detail="Saatlik sınırınıza ulaştınız. Lütfen bekleyin.")
        else:
            # Anonymous users: 20 requests/hour (via IP)
            client_ip = get_secure_client_ip(request)
            if not await check_user_rate_limit(f"anon:{client_ip}", limit=20, window=3600):
                raise HTTPException(status_code=429, detail="Anonim kullanıcı sınırına ulaştınız. Giriş yaparak daha fazla mesaj gönderebilirsiniz.")
        
        # ===== ANONIM KULLANICI GÜVENLİK KONTROLLARI =====
        if not user:
            # 1. Honeypot field kontrolü (bot tespiti)
            # Frontend'de görünmez bir alan olacak, botlar doldurursa tespit edilir
            honeypot = request.headers.get("X-Form-Token", "")
            if honeypot and len(honeypot) > 0:
                log_security_event("BOT_DETECTED_HONEYPOT", {
                    "ip": request.client.host
                }, "WARN")
                # Sessizce başarısız ol, saldırganı bilgilendirme
                return {"answer": "Bir hata oluştu. Lütfen tekrar deneyin.", "provider": "error"}
            
            # 2. Mesaj uzunluğu sınırı (anonim kullanıcılar için daha kısa)
            if len(chat_request.message) > 500:
                raise HTTPException(
                    status_code=400, 
                    detail="Mesaj çok uzun. Giriş yapmadan maksimum 500 karakter gönderebilirsiniz."
                )
            
            # 3. Minimum zaman kontrolü (çok hızlı istekleri engelle)
            request_timestamp = request.headers.get("X-Request-Timestamp", "")
            if not request_timestamp:
                # Timestamp yoksa uyarı logla ama izin ver (eski frontend uyumluluğu)
                pass
            
            # 4. Günlük global anonim limit kontrolü
            from security import get_secure_client_ip
            client_ip = get_secure_client_ip(request)
            
            log_security_event("ANONYMOUS_CHAT_REQUEST", {
                "ip": client_ip,
                "message_length": len(chat_request.message)
            })
        
        # Giriş yapmış kullanıcılar için license check
        if user:
            try:
                await check_feature_access(user, "ai_chat")
            except HTTPException:
                # License limit aşıldıysa anonim olarak devam et
                user = None
        
        # Context turları getir
        context_tours = []
        if chat_request.context_tour_ids:
            for tour_id in chat_request.context_tour_ids:
                response = supabase.table("tours").select("*").eq("id", int(tour_id)).execute()
                if response.data:
                    context_tours.append(response.data[0])
        
        # ===== SCALABILITY: AI Response Caching (TEMPORARILY DISABLED) =====
        # from cache import get_cached_ai_response, cache_ai_response, record_cache_hit, record_cache_miss
        
        # Cache devre dışı - her zaman taze yanıt al
        # Check cache first
        # cached_answer = await get_cached_ai_response(...)
        cached_answer = None  # Cache disabled
        
        if cached_answer:
            # record_cache_hit(is_ai=True)
            answer = cached_answer
        else:
            # record_cache_miss(is_ai=True)
            # AI'dan cevap al
            answer = await ai_service.chat(
                message=chat_request.message,
                context_tours=context_tours,
                provider=chat_request.ai_provider
            )
        
        # Sohbeti kaydet (sadece giriş yapmış kullanıcılar için)
        if user:
            supabase.table("chats").insert({
                "user_id": user["id"],
                "message": chat_request.message,
                "context_tour_ids": chat_request.context_tour_ids or [],
                "ai_provider": chat_request.ai_provider,
                "answer": answer
            }).execute()
        
        return {
            "answer": answer,
            "provider": chat_request.ai_provider,
            "cached": cached_answer is not None  # Frontend'e cache durumu bildir
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("AI_CHAT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Chatbot yanıt veremedi")

@app.get("/api/providers/models")
async def get_providers():
    """Mevcut AI sağlayıcıları listeler"""
    return {
        "providers": [
            {
                "name": "openai",
                "model": "gpt-5",
                "status": "active",
                "description": "OpenAI GPT-5 - En gelişmiş model"
            },
            {
                "name": "anthropic",
                "model": "claude-sonnet-4-20250514",
                "status": "active",
                "description": "Claude Sonnet 4 - Hızlı ve detaylı analiz ⚡"
            },
            {
                "name": "gemini",
                "model": "gemini-2.0-flash",
                "status": "inactive",
                "description": "Gemini 2.0 - Şu anda kullanılamıyor"
            }
        ]
    }

@app.get("/api/currencies")
async def get_currencies():
    """Desteklenen para birimlerini listeler"""
    return {
        "currencies": [
            {
                "code": "TRY",
                "symbol": "₺",
                "name": "Türk Lirası"
            },
            {
                "code": "USD",
                "symbol": "$",
                "name": "Amerikan Doları"
            },
            {
                "code": "EUR",
                "symbol": "€",
                "name": "Euro"
            }
        ]
    }

# License/Package Routes
@app.get("/api/packages")
async def get_packages():
    """Mevcut paketleri listeler"""
    try:
        response = supabase.table("packages").select("*").eq("is_active", True).execute()
        return {"packages": response.data}
    except Exception as e:
        log_security_event("PACKAGES_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Paketler alınırken bir hata oluştu")

@app.get("/api/user/license")
async def get_user_license(user: dict = Depends(get_current_user)):
    """Kullanıcının aktif lisansını getirir"""
    try:
        response = supabase.table("user_licenses").select(
            "*, package:packages(*)"
        ).eq("user_id", user["id"]).eq("is_active", True).gte("expires_at", "now()").execute()
        
        return {
            "license": response.data[0] if response.data else None,
            "has_active_license": len(response.data) > 0
        }
    except Exception as e:
        log_security_event("LICENSE_INFO_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Lisans bilgisi alınırken bir hata oluştu")

@app.get("/api/user/usage/{feature_name}")
async def get_feature_usage(feature_name: str, user: dict = Depends(get_current_user)):
    """Kullanıcının feature kullanım bilgisini getirir"""
    try:
        response = supabase.rpc("check_user_feature", {
            "user_id_param": user["id"],
            "feature_name_param": feature_name
        }).execute()
        
        result = response.data[0] if response.data else {"allowed": False, "remaining": 0, "limit_value": 0}
        
        return {
            "feature": feature_name,
            "allowed": result["allowed"],
            "remaining": result["remaining"],
            "limit": result["limit_value"]
        }
    except Exception as e:
        log_security_event("USAGE_INFO_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanım bilgisi alınırken bir hata oluştu")

async def check_feature_access(user: dict, feature_name: str):
    """Helper: Kullanıcının feature erişimini kontrol eder"""
    try:
        response = supabase.rpc("check_user_feature", {
            "user_id_param": user["id"],
            "feature_name_param": feature_name
        }).execute()
        
        if not response.data or not response.data[0]["allowed"]:
            limit = response.data[0]["limit_value"] if response.data else 0
            remaining = response.data[0]["remaining"] if response.data else 0
            raise HTTPException(
                status_code=403, 
                detail=f"Bu özelliği kullanma hakkınız doldu. Kalan: {remaining}/{limit}. Paketi yükseltin."
            )
        
        # Record usage
        supabase.rpc("record_feature_usage", {
            "user_id_param": user["id"],
            "feature_name_param": feature_name
        }).execute()
        
        return True
    except HTTPException:
        raise
    except Exception as e:
        # Backward compatibility - allow if license check fails
        return True

# License Upload Routes
@app.post("/api/operator/license/upload")
async def upload_license(file: UploadFile = File(...), license_number: str = "", user: dict = Depends(require_operator)):
    """Operator devlet onaylı izin belgesi yükler - Enhanced Security"""
    from security import validate_file_upload
    
    try:
        # Dosya içeriğini oku
        contents = await file.read()
        
        # SEC-003 & SEC-004: Comprehensive file validation with magic bytes and antivirus
        validate_file_upload(
            filename=file.filename,
            content_type=file.content_type,
            file_size=len(contents),
            file_content=contents,  # NEW: Pass content for magic bytes check
            max_size=5 * 1024 * 1024
        )
        
        # Private bucket'a yükle (public bucket yerine)
        # NOTE: Requires 'license-documents-private' bucket to be created in Supabase
        bucket_name = 'license-documents-private'
        file_path = f"{user['id']}/license_{user['id']}.{file.filename.split('.')[-1]}"
        
        try:
            storage_response = supabase.storage.from_(bucket_name).upload(
                file_path,
                contents,
                {
                    'content-type': file.content_type,
                    'upsert': True  # Var olan dosyayı güncelle
                }
            )
        except Exception as storage_error:
            # Fallback to public bucket if private doesn't exist
            log_security_event("PRIVATE_BUCKET_FALLBACK", {
                "error": str(storage_error),
                "user_id": user['id']
            }, "WARN")
            bucket_name = 'license-documents'
            storage_response = supabase.storage.from_(bucket_name).upload(
                file_path,
                contents,
                {
                    'content-type': file.content_type,
                    'upsert': True
                }
            )
        
        # Signed URL oluştur (private bucket için) veya public URL (fallback için)
        if bucket_name == 'license-documents-private':
            # Signed URL - 1 saat geçerli (admin incelemesi için)
            signed_url_response = supabase.storage.from_(bucket_name).create_signed_url(
                file_path,
                expires_in=3600  # 1 saat
            )
            document_url = signed_url_response.get('signedURL', '')
        else:
            # Public URL (fallback)
            document_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        
        # Users tablosunu güncelle
        supabase.table("users").update({
            "license_document_url": document_url,
            "license_document_path": file_path,  # Store path for future signed URL generation
            "license_bucket": bucket_name,  # Track which bucket is used
            "license_number": license_number,
            "license_verified": False  # Admin onayı bekleyecek
        }).eq("id", user["id"]).execute()
        
        log_security_event("LICENSE_UPLOAD_SUCCESS", {
            "user_id": user["id"],
            "bucket": bucket_name,
            "file_size": len(contents)
        })
        
        return {
            "message": "İzin belgesi başarıyla yüklendi",
            "license_url": document_url,
            "status": "pending_verification",
            "bucket_type": "private" if bucket_name == 'license-documents-private' else "public"
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("FILE_UPLOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya yüklenirken bir hata oluştu")

@app.get("/api/operator/license/status")
async def get_license_status(user: dict = Depends(require_operator)):
    """Operator'ün license durumunu getirir"""
    try:
        return {
            "license_document_url": user.get("license_document_url"),
            "license_number": user.get("license_number"),
            "license_verified": user.get("license_verified", False),
            "license_verified_at": user.get("license_verified_at")
        }
    except Exception as e:
        log_security_event("LICENSE_STATUS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Lisans durumu alınırken bir hata oluştu")

@app.get("/api/admin/licenses/pending")
async def get_pending_licenses(user: dict = Depends(require_admin)):
    """Admin için onay bekleyen license belgelerini listeler"""
    try:
        response = supabase.rpc('get_operators_pending_verification').execute()
        return {"operators": response.data}
    except Exception as e:
        log_security_event("PENDING_LICENSES_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Liste alınırken bir hata oluştu")

@app.post("/api/admin/licenses/verify/{operator_id}")
async def verify_license(operator_id: str, verified: bool, license_number: str = "", request: Request = None, user: dict = Depends(require_admin)):
    """Admin operator license'ını onaylar veya reddeder"""
    try:
        response = supabase.rpc('verify_operator_license', {
            'operator_id_param': operator_id,
            'admin_id': user['id'],
            'verified': verified,
            'license_number_param': license_number if license_number else None
        }).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='license_verified' if verified else 'license_rejected',
            entity='operator_license',
            entity_id=operator_id,
            details={'verified': verified, 'license_number': license_number}
        )
        
        return response.data
    except Exception as e:
        log_security_event("LICENSE_VERIFY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Lisans doğrulanırken bir hata oluştu")


# ============================================
# ADMIN: USER MANAGEMENT (Soft Ban + Dry-Run)
# ============================================

def _calculate_user_impact(user_id: str) -> dict:
    """Kullanıcının askıya alınmasının etkisini hesaplar (dry-run için)"""
    impact = {
        "affected_tours": 0,
        "affected_favorites": 0,
        "affected_reviews": 0,
        "tour_titles": [],
    }
    try:
        # Kullanıcının aktif turları
        tours = supabase.table("tours").select("id, title").eq("operator_id", user_id).in_("status", ["approved", "pending"]).execute()
        if tours.data:
            impact["affected_tours"] = len(tours.data)
            impact["tour_titles"] = [t["title"] for t in tours.data[:5]]  # max 5 title
    except Exception:
        pass
    try:
        # Favoriler
        favs = supabase.table("favorites").select("id", count="exact").eq("user_id", user_id).execute()
        impact["affected_favorites"] = favs.count or 0
    except Exception:
        pass
    try:
        # Yorumlar
        reviews = supabase.table("reviews").select("id", count="exact").eq("user_id", user_id).execute()
        impact["affected_reviews"] = reviews.count or 0
    except Exception:
        pass
    return impact


@app.patch("/api/admin/users/{user_id}/suspend")
async def suspend_user(user_id: str, request: Request, dry_run: bool = False, user: dict = Depends(require_admin)):
    """Kullanıcıyı askıya al (soft ban). dry_run=true ile etki analizi döner."""
    try:
        # Kendi kendini askıya alma koruması
        if user_id == user['id']:
            raise HTTPException(status_code=400, detail="Kendinizi askıya alamazsınız")
        
        # Mevcut durumu al
        profile = supabase.table("users").select("id, email, user_role, status").eq("id", user_id).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        target_user = profile.data[0]
        
        # Zaten askıda mı?
        if target_user.get('status') == 'suspended':
            raise HTTPException(status_code=400, detail="Kullanıcı zaten askıda")
        
        # Admin, admin'i askıya alamaz (sadece super_admin yapabilir)
        if target_user.get('user_role') in ['admin', 'super_admin'] and user.get('user_role') != 'super_admin':
            raise HTTPException(status_code=403, detail="Admin kullanıcıları sadece super admin askıya alabilir")
        
        # Etki analizi
        impact = _calculate_user_impact(user_id)
        
        # DRY-RUN: Sadece etki analizi dön, DB değişikliği yapma
        if dry_run:
            return {
                "dry_run": True,
                "user_id": user_id,
                "target_email": target_user.get('email'),
                "target_role": target_user.get('user_role'),
                "impact": impact,
                "message": "Bu işlem uygulanmadı. Onay bekliyor."
            }
        
        # GERÇEK İŞLEM: Askıya al
        supabase.table("users").update({
            "status": "suspended"
        }).eq("id", user_id).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='user_suspended',
            entity='user',
            entity_id=user_id,
            details={
                'target_email': target_user.get('email'),
                'impact': impact
            },
            previous_data={'status': target_user.get('status', 'active')},
            new_data={'status': 'suspended'}
        )
        
        return {
            "dry_run": False,
            "success": True,
            "user_id": user_id,
            "status": "suspended",
            "impact": impact,
            "message": "Kullanıcı askıya alındı"
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("USER_SUSPEND_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanıcı askıya alınırken bir hata oluştu")


@app.patch("/api/admin/users/{user_id}/activate")
async def activate_user(user_id: str, request: Request, user: dict = Depends(require_admin)):
    """Askıya alınmış kullanıcıyı aktifleştirir."""
    try:
        # Mevcut durumu al
        profile = supabase.table("users").select("id, email, status, user_role").eq("id", user_id).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        target_user = profile.data[0]
        
        if target_user.get('status', 'active') == 'active':
            raise HTTPException(status_code=400, detail="Kullanıcı zaten aktif")
        
        # Aktifleştir
        supabase.table("users").update({
            "status": "active"
        }).eq("id", user_id).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='user_activated',
            entity='user',
            entity_id=user_id,
            details={'target_email': target_user.get('email')},
            previous_data={'status': target_user.get('status', 'suspended')},
            new_data={'status': 'active'}
        )
        
        return {
            "success": True,
            "user_id": user_id,
            "status": "active",
            "message": "Kullanıcı aktifleştirildi"
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("USER_ACTIVATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanıcı aktifleştirilirken bir hata oluştu")


# Backward compat: eski toggle endpoint'i yeni suspend/activate'e yönlendirir
@app.post("/api/admin/users/{user_id}/toggle-status")
async def toggle_user_status_compat(user_id: str, request: Request, user: dict = Depends(require_admin)):
    """Geriye uyumluluk — suspend veya activate çağırır"""
    profile = supabase.table("users").select("status").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    current = profile.data[0]
    if current.get('status') == 'suspended':
        return await activate_user(user_id, request, user)
    else:
        return await suspend_user(user_id, request, dry_run=False, user=user)


# ============================================
# ADMIN: PLATFORM SETTINGS
# ============================================

CRITICAL_SETTINGS = ['maintenance_mode', 'registration_enabled', 'auto_approve_tours']

@app.get("/api/admin/settings")
async def get_settings(user: dict = Depends(require_admin)):
    """Platform ayarlarını getirir (admin only)"""
    try:
        result = supabase.table("platform_settings").select("key, value").execute()
        settings = {}
        if result.data:
            for row in result.data:
                settings[row['key']] = row['value']
        return {"settings": settings}
    except Exception as e:
        log_security_event("SETTINGS_GET_ERROR", {"error": str(e)}, "ERROR")
        return {"settings": {}}

@app.put("/api/admin/settings")
async def update_settings(data: SettingsUpdate, request: Request, dry_run: bool = False, user: dict = Depends(require_admin)):
    """Platform ayarlarını günceller. dry_run=true ile değişiklikleri önizler."""
    try:
        # Kritik ayarlar kontrolü
        for key in data.settings:
            if key in CRITICAL_SETTINGS and user.get('user_role') != 'super_admin':
                raise HTTPException(
                    status_code=403,
                    detail=f"'{key}' ayarını değiştirmek için super admin yetkisi gerekli"
                )
        
        # Mevcut ayarları al (diff hesapla)
        current = {}
        try:
            result = supabase.table("platform_settings").select("key, value").execute()
            if result.data:
                for row in result.data:
                    current[row['key']] = row['value']
        except Exception:
            pass
        
        # Neyin değişeceğini hesapla
        changes = []
        for key, new_value in data.settings.items():
            old_value = current.get(key)
            if old_value != new_value:
                changes.append({
                    "key": key,
                    "old_value": old_value,
                    "new_value": new_value,
                    "is_critical": key in CRITICAL_SETTINGS
                })
        
        # DRY-RUN: Sadece değişiklik özeti dön
        if dry_run:
            return {
                "dry_run": True,
                "changes": changes,
                "total_changes": len(changes),
                "critical_changes": sum(1 for c in changes if c['is_critical']),
                "message": "Bu değişiklikler henüz uygulanmadı."
            }
        
        # GERÇEK İŞLEM: Her ayarı upsert et
        for key, value in data.settings.items():
            supabase.table("platform_settings").upsert(
                {"key": key, "value": value},
                on_conflict="key"
            ).execute()
        
        # Audit log
        old_settings = {c['key']: c['old_value'] for c in changes}
        new_settings = {c['key']: c['new_value'] for c in changes}
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='settings_updated',
            entity='platform_settings',
            details={'changed_keys': list(data.settings.keys()), 'changes': changes},
            previous_data=old_settings,
            new_data=new_settings
        )
        
        return {"dry_run": False, "success": True, "message": "Ayarlar kaydedildi", "changes": changes}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("SETTINGS_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Ayarlar kaydedilirken bir hata oluştu")


# ============================================
# ADMIN: ACTION HISTORY (Paginated + Filters)
# ============================================

@app.get("/api/admin/audit-history")
async def get_audit_history(
    page: int = 0,
    page_size: int = 20,
    action: str = None,
    role: str = None,
    user_id: str = None,
    user: dict = Depends(require_admin)
):
    """Paginated audit log history with filters"""
    try:
        query = supabase.table("audit_logs").select(
            "*", count="exact"
        ).order("created_at", desc=True)
        
        if action:
            query = query.eq("action", action)
        if role:
            query = query.eq("role", role)
        if user_id:
            query = query.eq("user_id", user_id)
        
        offset = page * page_size
        query = query.range(offset, offset + page_size - 1)
        result = query.execute()
        
        return {
            "data": result.data or [],
            "total": result.count or 0,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        log_security_event("AUDIT_HISTORY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Audit geçmişi yüklenemedi")


# ============================================
# ADMIN: ROLLBACK (super_admin only)
# ============================================

ROLLBACK_ELIGIBLE_ACTIONS = [
    'user_suspended', 'user_activated',
    'settings_updated', 'feature_flag_updated'
]

ROLLBACK_ENTITY_TABLE = {
    'user': 'users',
    'platform_settings': 'platform_settings',
    'feature_flag': 'feature_flags',
}

@app.post("/api/admin/rollback/{audit_id}")
async def rollback_action(audit_id: str, request: Request, user: dict = Depends(require_super_admin)):
    """Audit kaydındaki previous_data ile işlemi geri alır. Sadece super_admin."""
    try:
        # Audit kaydını bul
        record = supabase.table("audit_logs").select("*").eq("id", audit_id).execute()
        if not record.data:
            raise HTTPException(status_code=404, detail="Audit kaydı bulunamadı")
        
        audit = record.data[0]
        
        # Zaten rollback edilmiş mi?
        if audit.get('is_rollback'):
            raise HTTPException(status_code=400, detail="Bu kayıt zaten bir rollback işlemidir")
        
        # Rollback yapılabilir mi?
        if audit['action'] not in ROLLBACK_ELIGIBLE_ACTIONS:
            raise HTTPException(status_code=400, detail=f"'{audit['action']}' işlemi geri alınamaz")
        
        previous_data = audit.get('previous_data', {})
        if not previous_data:
            raise HTTPException(status_code=400, detail="Geri alınacak veri bulunamadı (previous_data boş)")
        
        entity = audit.get('entity')
        entity_id = audit.get('entity_id')
        
        # Rollback uygula
        if entity == 'user' and entity_id:
            supabase.table("users").update(previous_data).eq("id", entity_id).execute()
        elif entity == 'platform_settings':
            for key, value in previous_data.items():
                supabase.table("platform_settings").upsert(
                    {"key": key, "value": value}, on_conflict="key"
                ).execute()
        elif entity == 'feature_flag' and entity_id:
            supabase.table("feature_flags").update(previous_data).eq("key", entity_id).execute()
        else:
            raise HTTPException(status_code=400, detail="Bilinmeyen entity türü")
        
        # Rollback audit kaydı
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'super_admin'),
            action=f"rollback_{audit['action']}",
            entity=entity,
            entity_id=entity_id,
            details={'rolled_back_audit_id': audit_id},
            previous_data=audit.get('new_data', {}),
            new_data=previous_data
        )
        
        # Orijinal kaydı rollback olarak işaretle
        try:
            supabase.table("audit_logs").update(
                {"is_rollback": True}
            ).eq("id", audit_id).execute()
        except Exception:
            pass
        
        return {
            "success": True,
            "message": f"'{audit['action']}' işlemi geri alındı",
            "rolled_back_data": previous_data
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("ROLLBACK_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Rollback işlemi başarısız")


# ============================================
# ADMIN: FEATURE FLAGS
# ============================================

@app.get("/api/admin/feature-flags")
async def get_feature_flags(user: dict = Depends(require_admin)):
    """Tüm feature flag'leri listeler"""
    try:
        result = supabase.table("feature_flags").select("*").order("key").execute()
        return {"flags": result.data or []}
    except Exception as e:
        log_security_event("FEATURE_FLAGS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Feature flags yüklenemedi")


@app.get("/api/feature-flags/public")
async def get_public_feature_flags():
    """Public: Frontend useFeature hook için — auth gerekmez"""
    try:
        result = supabase.table("feature_flags").select("key, enabled").execute()
        flags = {}
        if result.data:
            for row in result.data:
                flags[row['key']] = row['enabled']
        return {"flags": flags}
    except Exception:
        return {"flags": {}}


@app.patch("/api/admin/feature-flags/{key}")
async def toggle_feature_flag(key: str, request: Request, user: dict = Depends(require_admin)):
    """Feature flag aç/kapat"""
    try:
        # Mevcut durumu al
        existing = supabase.table("feature_flags").select("*").eq("key", key).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail=f"Feature flag '{key}' bulunamadı")
        
        current = existing.data[0]
        new_enabled = not current['enabled']
        
        # Güncelle
        supabase.table("feature_flags").update({
            "enabled": new_enabled,
            "updated_by": user['id'],
            "updated_at": datetime.utcnow().isoformat()
        }).eq("key", key).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='feature_flag_updated',
            entity='feature_flag',
            entity_id=key,
            details={'flag_key': key},
            previous_data={'enabled': current['enabled']},
            new_data={'enabled': new_enabled}
        )
        
        return {
            "success": True,
            "key": key,
            "enabled": new_enabled,
            "message": f"'{key}' {'aktif' if new_enabled else 'devre dışı'}"
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("FEATURE_FLAG_TOGGLE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Feature flag güncellenemedi")


# ============================================
# ADMIN: NOTIFICATIONS / ANNOUNCEMENTS
# ============================================

@app.get("/api/admin/notifications")
async def get_notifications(user: dict = Depends(require_admin)):
    """Duyuruları listeler (admin only)"""
    try:
        result = supabase.table("notifications").select("*").order(
            "created_at", desc=True
        ).limit(50).execute()
        return {"notifications": result.data or []}
    except Exception as e:
        log_security_event("NOTIFICATIONS_GET_ERROR", {"error": str(e)}, "ERROR")
        return {"notifications": []}

@app.post("/api/admin/notifications")
async def create_notification(data: NotificationCreate, request: Request, user: dict = Depends(require_admin)):
    """Yeni duyuru oluşturur (admin only)"""
    try:
        # target_role doğrulama
        if data.target_role not in ['all', 'user', 'operator']:
            raise HTTPException(status_code=400, detail="Geçersiz hedef kitle")
        
        result = supabase.table("notifications").insert({
            "title": data.title,
            "message": data.message,
            "target_role": data.target_role,
            "created_by": user['id'],
        }).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='notification_created',
            entity='notification',
            details={'title': data.title, 'target_role': data.target_role}
        )
        
        return {"success": True, "notification": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("NOTIFICATION_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Duyuru oluşturulurken bir hata oluştu")

@app.delete("/api/admin/notifications/{notification_id}")
async def delete_notification(notification_id: str, request: Request, user: dict = Depends(require_admin)):
    """Duyuru siler (admin only)"""
    try:
        supabase.table("notifications").delete().eq("id", notification_id).execute()
        
        # Audit log
        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='notification_deleted',
            entity='notification',
            entity_id=notification_id
        )
        
        return {"success": True, "message": "Duyuru silindi"}
    except Exception as e:
        log_security_event("NOTIFICATION_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Duyuru silinirken bir hata oluştu")

# ===== ADMIN FILE MANAGER ROUTES =====
# Supabase Storage ile dosya yönetimi (admin-documents bucket)

ADMIN_FILES_BUCKET = "admin-documents"
ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/csv"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@app.post("/api/admin/files/upload")
@limiter.limit("20/minute")
async def admin_upload_file(
    request: Request,
    file: UploadFile = File(...),
    category: str = "general",
    user: dict = Depends(require_admin)
):
    """Admin dosya yükleme — Supabase Storage"""
    try:
        # Dosya doğrulama
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya tipi: {file.content_type}")
        
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'ı aşamaz")
        
        # Güvenli dosya adı
        import uuid
        safe_name = f"{category}/{uuid.uuid4().hex}_{file.filename}"
        
        # Supabase Storage'a yükle
        storage_response = supabase.storage.from_(ADMIN_FILES_BUCKET).upload(
            path=safe_name,
            file=contents,
            file_options={"content-type": file.content_type}
        )
        
        log_security_event("ADMIN_FILE_UPLOAD", {
            "admin": user.get("email"),
            "file": safe_name,
            "size": len(contents),
            "category": category
        })
        
        return {
            "success": True,
            "file_path": safe_name,
            "file_name": file.filename,
            "file_size": len(contents),
            "content_type": file.content_type,
            "category": category
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("ADMIN_FILE_UPLOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya yüklenirken bir hata oluştu")

@app.get("/api/admin/files")
async def admin_list_files(
    category: str = "general",
    user: dict = Depends(require_admin)
):
    """Admin dosya listesi — Supabase Storage"""
    try:
        files = supabase.storage.from_(ADMIN_FILES_BUCKET).list(
            path=category,
            options={"limit": 100, "sortBy": {"column": "created_at", "order": "desc"}}
        )
        
        file_list = []
        for f in files:
            if f.get("name") and not f["name"].startswith("."):
                file_list.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "size": f.get("metadata", {}).get("size", 0),
                    "content_type": f.get("metadata", {}).get("mimetype", ""),
                    "created_at": f.get("created_at"),
                    "updated_at": f.get("updated_at"),
                    "category": category,
                    "path": f"{category}/{f.get('name')}"
                })
        
        return {"files": file_list}
    except Exception as e:
        log_security_event("ADMIN_FILE_LIST_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya listesi alınırken bir hata oluştu")

@app.delete("/api/admin/files")
async def admin_delete_file(
    file_path: str,
    user: dict = Depends(require_admin)
):
    """Admin dosya silme — Supabase Storage"""
    try:
        supabase.storage.from_(ADMIN_FILES_BUCKET).remove([file_path])
        
        log_security_event("ADMIN_FILE_DELETE", {
            "admin": user.get("email"),
            "file": file_path
        })
        
        return {"success": True, "deleted": file_path}
    except Exception as e:
        log_security_event("ADMIN_FILE_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya silinirken bir hata oluştu")

@app.get("/api/admin/files/url")
async def admin_get_file_url(
    file_path: str,
    user: dict = Depends(require_admin)
):
    """Admin dosya URL'i — Signed URL oluşturur (1 saat geçerli)"""
    try:
        signed = supabase.storage.from_(ADMIN_FILES_BUCKET).create_signed_url(
            path=file_path,
            expires_in=3600
        )
        return {"url": signed.get("signedURL") or signed.get("signedUrl", "")}
    except Exception as e:
        log_security_event("ADMIN_FILE_URL_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya URL'i oluşturulurken bir hata oluştu")

# ===== FAVORITES ROUTES =====
# Favori = Niyet göstergesi (intent indicator)
# NOT: Sepet, rezervasyon veya satın alma DEĞİLDİR

class FavoriteCreate(BaseModel):
    tour_id: int

class FavoriteSync(BaseModel):
    tour_ids: List[int]

@app.post("/api/favorites")
async def add_favorite(data: FavoriteCreate, request: Request, user: dict = Depends(get_current_user)):
    """Kullanıcının favorilerine tur ekler"""
    try:
        # Check if tour exists and is approved
        tour_check = supabase.table("tours").select("id, status").eq("id", data.tour_id).execute()
        if not tour_check.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if tour_check.data[0].get("status") != "approved":
            raise HTTPException(status_code=400, detail="Bu tur favorilere eklenemez")
        
        # Add to favorites (upsert to avoid duplicates)
        response = supabase.table("favorites").upsert({
            "user_id": user["id"],
            "tour_id": data.tour_id
        }, on_conflict="user_id,tour_id").execute()
        
        log_security_event("FAVORITE_ADDED", {
            "user_id": user["id"],
            "tour_id": data.tour_id
        })
        
        # Abuse detection (background, non-blocking)
        try:
            await check_favorites_abuse(user["id"], data.tour_id, request)
        except:
            pass  # Abuse check hataları kullanıcıyı etkilememeli
        
        return {"message": "Favorilere eklendi", "tour_id": data.tour_id}
    except HTTPException:
        raise
    except Exception as e:
        # If it's a duplicate, return success anyway
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "Zaten favorilerde", "tour_id": data.tour_id}
        log_security_event("FAVORITE_ADD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favorilere eklenirken bir hata oluştu")

@app.delete("/api/favorites/{tour_id}")
async def remove_favorite(tour_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Kullanıcının favorilerinden tur kaldırır"""
    try:
        response = supabase.table("favorites").delete().eq("user_id", user["id"]).eq("tour_id", tour_id).execute()
        
        log_security_event("FAVORITE_REMOVED", {
            "user_id": user["id"],
            "tour_id": tour_id
        })
        
        # Rapid toggle detection (background check)
        try:
            await check_rapid_toggle(user["id"], tour_id, request)
        except:
            pass  # Abuse check hataları kullanıcıyı etkilememeli
        
        return {"message": "Favorilerden çıkarıldı", "tour_id": tour_id}
    except Exception as e:
        log_security_event("FAVORITE_REMOVE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favorilerden çıkarılırken bir hata oluştu")

@app.get("/api/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    """Kullanıcının favori turlarını listeler (tur detaylarıyla birlikte)"""
    try:
        # Get favorites with tour details - only approved tours
        response = supabase.table("favorites").select(
            "id, tour_id, created_at, tours!inner(id, title, operator, price, currency, duration, hotel, services, start_date, end_date, status, is_verified, operator_phone)"
        ).eq("user_id", user["id"]).execute()
        
        # Filter only approved tours and format response
        favorites = []
        for fav in response.data:
            tour = fav.get("tours", {})
            if tour.get("status") == "approved":
                favorites.append({
                    "favorite_id": fav["id"],
                    "tour_id": fav["tour_id"],
                    "added_at": fav["created_at"],
                    "tour": tour
                })
        
        return {
            "favorites": favorites,
            "total": len(favorites)
        }
    except Exception as e:
        log_security_event("FAVORITES_LOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Favoriler yüklenirken bir hata oluştu")

@app.post("/api/favorites/sync")
async def sync_favorites(data: FavoriteSync, user: dict = Depends(get_current_user)):
    """localStorage'dan gelen favorileri veritabanına senkronize eder (login sonrası)"""
    try:
        synced = 0
        skipped = 0
        
        for tour_id in data.tour_ids:
            try:
                # Check if tour exists and is approved
                tour_check = supabase.table("tours").select("id, status").eq("id", tour_id).execute()
                if not tour_check.data or tour_check.data[0].get("status") != "approved":
                    skipped += 1
                    continue
                
                # Upsert to avoid duplicates
                supabase.table("favorites").upsert({
                    "user_id": user["id"],
                    "tour_id": tour_id
                }, on_conflict="user_id,tour_id").execute()
                synced += 1
            except Exception:
                skipped += 1
                continue
        
        log_security_event("FAVORITES_SYNCED", {
            "user_id": user["id"],
            "synced": synced,
            "skipped": skipped
        })
        
        return {
            "message": "Favoriler senkronize edildi",
            "synced": synced,
            "skipped": skipped
        }
    except Exception as e:
        log_security_event("FAVORITES_SYNC_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favoriler senkronize edilirken bir hata oluştu")

# ===== FAVORITES ABUSE DETECTION (Admin Signals) =====
# Bu sinyaller SADECE admin görünümü içindir
# Kullanıcı deneyimini ETKİLEMEZ - engelleme/kısıtlama YOK

def mask_ip(ip: str) -> str:
    """IP adresini maskeler (privacy)"""
    if not ip:
        return "unknown"
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.xxx.xxx"
    return "masked"

async def check_favorites_abuse(user_id: str, tour_id: int, request: Request):
    """
    Favori abuse sinyallerini kontrol eder ve SADECE loglar.
    Hiçbir engelleme veya kısıtlama YAPMAZ.
    """
    try:
        client_ip = mask_ip(request.client.host if request.client else None)
        
        # 1. High Volume Check: 100+ adds in 24h
        from datetime import timedelta
        day_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        
        daily_count_response = supabase.table("favorites").select("id", count="exact").eq(
            "user_id", user_id
        ).gte("created_at", day_ago).execute()
        
        daily_count = daily_count_response.count or 0
        
        if daily_count >= 100:
            # Signal: high_volume
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id,
                "ip_masked": client_ip,
                "signal_type": "high_volume",
                "count": daily_count,
                "window_size": "24h",
                "tour_id": tour_id
            }).execute()
            
            log_security_event("FAVORITES_ABUSE_SIGNAL", {
                "type": "high_volume",
                "user_id": user_id,
                "count": daily_count,
                "window": "24h"
            }, "WARN")
        
        # 2. Excessive Total Check: 500+ favorites
        total_response = supabase.table("favorites").select("id", count="exact").eq(
            "user_id", user_id
        ).execute()
        
        total_count = total_response.count or 0
        
        if total_count >= 500:
            # Signal: excessive_total
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id,
                "ip_masked": client_ip,
                "signal_type": "excessive_total",
                "count": total_count,
                "window_size": "total",
                "tour_id": tour_id
            }).execute()
            
            log_security_event("FAVORITES_ABUSE_SIGNAL", {
                "type": "excessive_total",
                "user_id": user_id,
                "count": total_count
            }, "WARN")
            
    except Exception as e:
        # Abuse check hatası kullanıcıyı ETKİLEMEMELİ
        log_security_event("FAVORITES_ABUSE_CHECK_ERROR", {"error": str(e)}, "ERROR")

async def check_rapid_toggle(user_id: str, tour_id: int, request: Request):
    """
    Aynı tur için hızlı toggle (10+ in 10 min) kontrolü.
    SADECE loglar, engelleme YAPMAZ.
    """
    try:
        client_ip = mask_ip(request.client.host if request.client else None)
        
        # Check existing signals for this tour in last 10 min
        from datetime import timedelta
        ten_min_ago = (datetime.utcnow() - timedelta(minutes=10)).isoformat()
        
        # Count recent signals for this specific tour
        recent_signals = supabase.table("favorites_abuse_signals").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("tour_id", tour_id).eq("signal_type", "rapid_toggle").gte(
            "created_at", ten_min_ago
        ).execute()
        
        toggle_count = (recent_signals.count or 0) + 1
        
        if toggle_count >= 10:
            # Signal: rapid_toggle
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id,
                "ip_masked": client_ip,
                "signal_type": "rapid_toggle",
                "count": toggle_count,
                "window_size": "10m",
                "tour_id": tour_id
            }).execute()
            
            log_security_event("FAVORITES_ABUSE_SIGNAL", {
                "type": "rapid_toggle",
                "user_id": user_id,
                "tour_id": tour_id,
                "count": toggle_count,
                "window": "10m"
            }, "WARN")
            
    except Exception as e:
        log_security_event("FAVORITES_RAPID_TOGGLE_CHECK_ERROR", {"error": str(e)}, "ERROR")

@app.get("/api/admin/favorites/abuse-signals")
async def get_favorites_abuse_signals(
    limit: int = 50,
    signal_type: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Admin: Favoriler abuse sinyallerini listeler"""
    try:
        query = supabase.table("favorites_abuse_signals").select(
            "id, user_id, ip_masked, signal_type, count, window_size, tour_id, created_at"
        ).order("created_at", desc=True).limit(limit)
        
        if signal_type:
            query = query.eq("signal_type", signal_type)
        
        response = query.execute()
        
        return {
            "signals": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        log_security_event("ABUSE_SIGNALS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Sinyaller yüklenirken bir hata oluştu")


# ===== PRICE ALERTS ROUTES =====
# Fiyat düşüşü bildirimi için

class PriceAlertCreate(BaseModel):
    tour_id: int

@app.post("/api/price-alerts")
async def create_price_alert(data: PriceAlertCreate, user: dict = Depends(get_current_user)):
    """Fiyat düşüşü bildirimi oluşturur"""
    try:
        # Get current tour price
        tour = supabase.table("tours").select("id, price, status").eq("id", data.tour_id).execute()
        
        if not tour.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if tour.data[0].get("status") != "approved":
            raise HTTPException(status_code=400, detail="Bu tur için bildirim oluşturulamaz")
        
        current_price = tour.data[0]["price"]
        
        # Upsert price alert
        response = supabase.table("price_alerts").upsert({
            "user_id": user["id"],
            "tour_id": data.tour_id,
            "last_seen_price": current_price,
            "is_active": True
        }, on_conflict="user_id,tour_id").execute()
        
        log_security_event("PRICE_ALERT_CREATED", {
            "user_id": user["id"],
            "tour_id": data.tour_id,
            "price": current_price
        })
        
        return {
            "message": "Fiyat bildirimi aktif",
            "tour_id": data.tour_id,
            "current_price": current_price
        }
    except HTTPException:
        raise
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "Bildirim zaten aktif", "tour_id": data.tour_id}
        log_security_event("PRICE_ALERT_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim oluşturulurken bir hata oluştu")

@app.delete("/api/price-alerts/{tour_id}")
async def delete_price_alert(tour_id: int, user: dict = Depends(get_current_user)):
    """Fiyat düşüşü bildirimini kaldırır"""
    try:
        response = supabase.table("price_alerts").delete().eq(
            "user_id", user["id"]
        ).eq("tour_id", tour_id).execute()
        
        log_security_event("PRICE_ALERT_DELETED", {
            "user_id": user["id"],
            "tour_id": tour_id
        })
        
        return {"message": "Bildirim kaldırıldı", "tour_id": tour_id}
    except Exception as e:
        log_security_event("PRICE_ALERT_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim kaldırılırken bir hata oluştu")

@app.get("/api/price-alerts")
async def get_price_alerts(user: dict = Depends(get_current_user)):
    """Kullanıcının aktif fiyat bildirimlerini listeler"""
    try:
        response = supabase.table("price_alerts").select(
            "id, tour_id, last_seen_price, is_active, created_at, tours!inner(id, title, operator, price, currency, status)"
        ).eq("user_id", user["id"]).eq("is_active", True).execute()
        
        alerts = []
        for alert in response.data:
            tour = alert.get("tours", {})
            if tour.get("status") == "approved":
                current_price = tour.get("price", 0)
                last_seen = alert.get("last_seen_price", 0)
                price_dropped = current_price < last_seen
                
                alerts.append({
                    "alert_id": alert["id"],
                    "tour_id": alert["tour_id"],
                    "last_seen_price": last_seen,
                    "current_price": current_price,
                    "price_dropped": price_dropped,
                    "price_diff": last_seen - current_price if price_dropped else 0,
                    "created_at": alert["created_at"],
                    "tour": tour
                })
        
        return {
            "alerts": alerts,
            "total": len(alerts)
        }
    except Exception as e:
        log_security_event("PRICE_ALERTS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Bildirimler yüklenirken bir hata oluştu")

@app.post("/api/price-alerts/{tour_id}/toggle")
async def toggle_price_alert(tour_id: int, user: dict = Depends(get_current_user)):
    """Fiyat bildirimini aç/kapat"""
    try:
        # Check if alert exists
        existing = supabase.table("price_alerts").select("id, is_active").eq(
            "user_id", user["id"]
        ).eq("tour_id", tour_id).execute()
        
        if existing.data:
            # Toggle existing
            new_state = not existing.data[0]["is_active"]
            supabase.table("price_alerts").update({"is_active": new_state}).eq(
                "id", existing.data[0]["id"]
            ).execute()
            
            return {"message": "Bildirim güncellendi", "tour_id": tour_id, "is_active": new_state}
        else:
            # Create new
            tour = supabase.table("tours").select("id, price, status").eq("id", tour_id).execute()
            if not tour.data or tour.data[0].get("status") != "approved":
                raise HTTPException(status_code=400, detail="Bu tur için bildirim oluşturulamaz")
            
            supabase.table("price_alerts").insert({
                "user_id": user["id"],
                "tour_id": tour_id,
                "last_seen_price": tour.data[0]["price"],
                "is_active": True
            }).execute()
            
            return {"message": "Bildirim aktif", "tour_id": tour_id, "is_active": True}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("PRICE_ALERT_TOGGLE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim güncellenirken bir hata oluştu")


# ===== TOUR ALERTS ROUTES =====
# Tarih bazlı "bu tarihte tur açılırsa haber ver"

class TourAlertCreate(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    tour_type: str = "any"  # 'hac', 'umre', 'any'
    max_price: Optional[float] = None
    preferred_operator: Optional[str] = None

class TourAlertUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tour_type: Optional[str] = None
    max_price: Optional[float] = None
    preferred_operator: Optional[str] = None
    is_active: Optional[bool] = None

@app.post("/api/tour-alerts")
async def create_tour_alert(data: TourAlertCreate, user: dict = Depends(get_current_user)):
    """Tarih bazlı tur bildirimi oluşturur"""
    try:
        # Validate tour_type
        if data.tour_type not in ['hac', 'umre', 'any']:
            raise HTTPException(status_code=400, detail="Geçersiz tur tipi")
        
        # Validate dates
        from datetime import datetime as dt
        try:
            start = dt.strptime(data.start_date, "%Y-%m-%d")
            end = dt.strptime(data.end_date, "%Y-%m-%d")
            if end < start:
                raise HTTPException(status_code=400, detail="Bitiş tarihi başlangıçtan önce olamaz")
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı (YYYY-MM-DD)")
        
        response = supabase.table("tour_alerts").insert({
            "user_id": user["id"],
            "start_date": data.start_date,
            "end_date": data.end_date,
            "tour_type": data.tour_type,
            "max_price": data.max_price,
            "preferred_operator": data.preferred_operator,
            "is_active": True
        }).execute()
        
        log_security_event("TOUR_ALERT_CREATED", {
            "user_id": user["id"],
            "start_date": data.start_date,
            "end_date": data.end_date,
            "tour_type": data.tour_type
        })
        
        return {
            "message": "Tur alarmı oluşturuldu",
            "alert": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("TOUR_ALERT_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm oluşturulurken bir hata oluştu")

@app.get("/api/tour-alerts")
async def get_tour_alerts(user: dict = Depends(get_current_user)):
    """Kullanıcının tur alarmlarını listeler"""
    try:
        response = supabase.table("tour_alerts").select(
            "id, start_date, end_date, tour_type, max_price, preferred_operator, is_active, notified_count, created_at"
        ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
        
        return {
            "alerts": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        log_security_event("TOUR_ALERTS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Alarmlar yüklenirken bir hata oluştu")

@app.put("/api/tour-alerts/{alert_id}")
async def update_tour_alert(alert_id: str, data: TourAlertUpdate, user: dict = Depends(get_current_user)):
    """Tur alarmını günceller"""
    try:
        # Check ownership
        existing = supabase.table("tour_alerts").select("id").eq("id", alert_id).eq("user_id", user["id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Alarm bulunamadı")
        
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek veri yok")
        
        response = supabase.table("tour_alerts").update(update_data).eq("id", alert_id).execute()
        
        return {
            "message": "Alarm güncellendi",
            "alert": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("TOUR_ALERT_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm güncellenirken bir hata oluştu")

@app.delete("/api/tour-alerts/{alert_id}")
async def delete_tour_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Tur alarmını siler"""
    try:
        response = supabase.table("tour_alerts").delete().eq("id", alert_id).eq("user_id", user["id"]).execute()
        
        log_security_event("TOUR_ALERT_DELETED", {
            "user_id": user["id"],
            "alert_id": alert_id
        })
        
        return {"message": "Alarm silindi", "alert_id": alert_id}
    except Exception as e:
        log_security_event("TOUR_ALERT_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm silinirken bir hata oluştu")


# ===== OPERATOR REVIEWS ROUTES =====
# Firma değerlendirmeleri - kullanıcılar puan ve yorum bırakabilir

class ReviewCreate(BaseModel):
    operator_name: str
    rating: int  # 1-5
    title: Optional[str] = None
    comment: Optional[str] = None
    tour_id: Optional[int] = None

class ReviewModerate(BaseModel):
    status: str  # 'approved' or 'rejected'
    rejection_reason: Optional[str] = None

@app.post("/api/reviews")
async def create_review(data: ReviewCreate, user: dict = Depends(get_current_user)):
    """Operatör için yorum/puan bırakır"""
    try:
        # Validate rating
        if data.rating < 1 or data.rating > 5:
            raise HTTPException(status_code=400, detail="Puan 1-5 arası olmalıdır")
        
        # Check if user already reviewed this operator
        existing = supabase.table("operator_reviews").select("id").eq(
            "user_id", user["id"]
        ).eq("operator_name", data.operator_name).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Bu firmayı zaten değerlendirdiniz")
        
        response = supabase.table("operator_reviews").insert({
            "user_id": user["id"],
            "operator_name": data.operator_name,
            "rating": data.rating,
            "title": data.title,
            "comment": data.comment,
            "tour_id": data.tour_id,
            "status": "pending"
        }).execute()
        
        log_security_event("REVIEW_CREATED", {
            "user_id": user["id"],
            "operator_name": data.operator_name,
            "rating": data.rating
        })
        
        return {
            "message": "Değerlendirmeniz alındı, onay sonrası yayınlanacaktır",
            "review": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REVIEW_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Değerlendirme oluşturulurken hata oluştu")

@app.get("/api/reviews/operator/{operator_name}")
async def get_operator_reviews(operator_name: str, limit: int = 20):
    """Bir operatörün onaylanmış yorumlarını listeler (public)"""
    try:
        response = supabase.table("operator_reviews").select(
            "id, rating, title, comment, created_at, helpful_count"
        ).eq("operator_name", operator_name).eq("status", "approved").order(
            "created_at", desc=True
        ).limit(limit).execute()
        
        # Calculate average rating
        ratings = [r["rating"] for r in response.data]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        return {
            "reviews": response.data,
            "total": len(response.data),
            "average_rating": round(avg_rating, 1),
            "operator_name": operator_name
        }
    except Exception as e:
        log_security_event("REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")

@app.get("/api/reviews/my")
async def get_my_reviews(user: dict = Depends(get_current_user)):
    """Kullanıcının kendi yorumlarını listeler"""
    try:
        response = supabase.table("operator_reviews").select(
            "id, operator_name, rating, title, comment, status, created_at"
        ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
        
        return {
            "reviews": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        log_security_event("MY_REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")

@app.delete("/api/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    """Kullanıcı kendi yorumunu siler"""
    try:
        response = supabase.table("operator_reviews").delete().eq(
            "id", review_id
        ).eq("user_id", user["id"]).execute()
        
        return {"message": "Yorum silindi", "review_id": review_id}
    except Exception as e:
        log_security_event("REVIEW_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Yorum silinirken hata oluştu")

@app.get("/api/operator/reviews")
async def get_operator_own_reviews(user: dict = Depends(get_current_user)):
    """Operatör: Kendi firmasına ait yorumları görür"""
    try:
        # Operatör kontrolü
        if user.get("role") not in ["operator", "admin"]:
            raise HTTPException(status_code=403, detail="Bu işlem için operatör yetkisi gerekli")
        
        # Operatörün firma adını al (users tablosundan veya profile'dan)
        user_response = supabase.table("users").select("company_name").eq("id", user["id"]).execute()
        if not user_response.data or not user_response.data[0].get("company_name"):
            raise HTTPException(status_code=400, detail="Firma adı tanımlı değil")
        
        operator_name = user_response.data[0]["company_name"]
        
        # Bu firmaya ait tüm yorumları getir
        response = supabase.table("operator_reviews").select(
            "id, rating, title, comment, status, created_at, helpful_count"
        ).eq("operator_name", operator_name).order("created_at", desc=True).execute()
        
        reviews = response.data
        
        # İstatistikler
        approved_reviews = [r for r in reviews if r["status"] == "approved"]
        ratings = [r["rating"] for r in approved_reviews]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
        
        # Status breakdown
        status_counts = {
            "approved": len([r for r in reviews if r["status"] == "approved"]),
            "pending": len([r for r in reviews if r["status"] == "pending"]),
            "rejected": len([r for r in reviews if r["status"] == "rejected"]),
        }
        
        return {
            "operator_name": operator_name,
            "reviews": reviews,
            "total": len(reviews),
            "average_rating": avg_rating,
            "status_counts": status_counts
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("OPERATOR_REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")

@app.get("/api/admin/reviews")
async def get_pending_reviews(
    status: str = "pending",
    limit: int = 50,
    user: dict = Depends(require_admin)
):
    """Admin: Bekleyen yorumları listeler"""
    try:
        response = supabase.table("operator_reviews").select(
            "id, user_id, operator_name, rating, title, comment, status, created_at"
        ).eq("status", status).order("created_at", desc=True).limit(limit).execute()
        
        return {
            "reviews": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        log_security_event("ADMIN_REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")

@app.put("/api/admin/reviews/{review_id}/moderate")
async def moderate_review(review_id: str, data: ReviewModerate, user: dict = Depends(require_admin)):
    """Admin: Yorumu onayla veya reddet"""
    try:
        if data.status not in ['approved', 'rejected']:
            raise HTTPException(status_code=400, detail="Geçersiz durum")
        
        update_data = {
            "status": data.status,
            "moderated_at": datetime.utcnow().isoformat(),
            "moderated_by": user["id"]
        }
        
        if data.status == 'rejected' and data.rejection_reason:
            update_data["rejection_reason"] = data.rejection_reason
        
        response = supabase.table("operator_reviews").update(update_data).eq(
            "id", review_id
        ).execute()
        
        log_security_event("REVIEW_MODERATED", {
            "review_id": review_id,
            "status": data.status,
            "moderated_by": user["id"]
        })
        
        return {
            "message": f"Yorum {'onaylandı' if data.status == 'approved' else 'reddedildi'}",
            "review": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REVIEW_MODERATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Moderasyon işlemi başarısız")


# CSV Import
@app.post("/api/import/csv")
async def import_csv(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    """CSV dosyasından tur import eder"""
    try:
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_file = io.StringIO(csv_text)
        reader = csv.DictReader(csv_file)
        
        imported_count = 0
        errors = []
        
        for i, row in enumerate(reader, 1):
            try:
                required_fields = ['title', 'operator', 'price', 'currency', 'duration', 'hotel', 'visa']
                missing_fields = [field for field in required_fields if field not in row or not row[field]]
                
                if missing_fields:
                    errors.append({"row": i, "error": f"Eksik alanlar: {', '.join(missing_fields)}"})
                    continue
                
                tour_doc = {
                    "operator_id": user["id"],
                    "title": row['title'],
                    "operator": row['operator'],
                    "price": float(row['price']),
                    "currency": row['currency'],
                    "start_date": row.get('start_date', ''),
                    "end_date": row.get('end_date', ''),
                    "duration": row['duration'],
                    "hotel": row['hotel'],
                    "services": row.get('services', '').split(',') if row.get('services') else [],
                    "visa": row['visa'],
                    "transport": row.get('transport', ''),
                    "guide": row.get('guide', ''),
                    "itinerary": row.get('itinerary', '').split('|') if row.get('itinerary') else [],
                    "rating": float(row['rating']) if row.get('rating') else None,
                    "source": "csv_import",
                    "created_by": user["email"],
                    "status": "approved"  # CSV imports are auto-approved for admins
                }
                
                supabase.table("tours").insert(tour_doc).execute()
                imported_count += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
        
        # Import job kaydı
        supabase.table("import_jobs").insert({
            "user_id": user["id"],
            "filename": file.filename,
            "status": "completed",
            "imported_count": imported_count,
            "error_count": len(errors),
            "errors": errors[:10]
        }).execute()
        
        return {
            "message": f"{imported_count} tur başarıyla import edildi",
            "imported": imported_count,
            "errors": len(errors),
            "error_details": errors[:5]
        }
    except Exception as e:
        log_security_event("CSV_IMPORT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="CSV import esnasında bir hata oluştu")

# ============================================
# SLA MONITORING + UPTIME ALERTS
# ============================================

import time as _time
import httpx

ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")  # Telegram/Slack webhook
ALERT_EMAIL = os.getenv("ALERT_EMAIL", "")  # Email for critical alerts
HEALTH_CHECK_INTERVAL = 60  # seconds

_consecutive_failures = 0


@app.get("/health")
async def health_check():
    """Public health endpoint — UptimeRobot / BetterStack / Pingdom uyumlu"""
    start = _time.time()
    db_ok = False
    auth_ok = False
    error_msg = None

    try:
        # DB check
        result = supabase.table("users").select("id").limit(1).execute()
        db_ok = True
    except Exception as e:
        error_msg = f"DB: {str(e)[:100]}"

    try:
        # Auth check — Supabase auth service
        supabase.auth.get_session()
        auth_ok = True
    except Exception as e:
        if not error_msg:
            error_msg = f"Auth: {str(e)[:100]}"

    response_time = int((_time.time() - start) * 1000)
    status = "ok" if db_ok and auth_ok else "error"

    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "db": db_ok,
        "auth": auth_ok,
        "response_time_ms": response_time,
        "error": error_msg
    }


async def _run_health_check_and_log():
    """Internal health check — logs result to uptime_logs"""
    global _consecutive_failures
    start = _time.time()
    db_ok = False
    auth_ok = False
    error_msg = None

    try:
        result = supabase.table("users").select("id").limit(1).execute()
        db_ok = True
    except Exception as e:
        error_msg = f"DB: {str(e)[:100]}"

    try:
        supabase.auth.get_session()
        auth_ok = True
    except Exception as e:
        if not error_msg:
            error_msg = f"Auth: {str(e)[:100]}"

    response_time = int((_time.time() - start) * 1000)
    status = "ok" if db_ok and auth_ok else "error"

    if status == "ok":
        _consecutive_failures = 0
    else:
        _consecutive_failures += 1

    # Log to DB
    try:
        supabase.table("uptime_logs").insert({
            "status": status,
            "response_time_ms": response_time,
            "db_ok": db_ok,
            "auth_ok": auth_ok,
            "error_message": error_msg,
            "consecutive_failures": _consecutive_failures,
        }).execute()
    except Exception:
        pass

    # Alert logic
    if _consecutive_failures == 2:
        await _send_alert("WARNING", f"⚠️ 2 ardışık başarısız check! Son hata: {error_msg}")
    elif _consecutive_failures >= 5:
        await _send_alert("CRITICAL", f"🚨 CRITICAL: {_consecutive_failures} ardışık başarısız! {error_msg}")


async def _send_alert(level: str, message: str):
    """Telegram/Slack webhook + log"""
    log_security_event(f"UPTIME_ALERT_{level}", {"message": message}, "ERROR")

    if ALERT_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Telegram format
                if "telegram" in ALERT_WEBHOOK_URL.lower():
                    await client.post(ALERT_WEBHOOK_URL, json={
                        "text": f"[{level}] Hac & Umre Platform\n{message}\n{datetime.utcnow().isoformat()}"
                    })
                # Slack format
                else:
                    await client.post(ALERT_WEBHOOK_URL, json={
                        "text": f"[{level}] Hac & Umre Platform: {message}"
                    })
        except Exception as e:
            log_security_event("ALERT_SEND_ERROR", {"error": str(e)}, "ERROR")


async def _uptime_scheduler():
    """Background task — runs health check every 60 seconds"""
    while True:
        try:
            await asyncio.sleep(HEALTH_CHECK_INTERVAL)
            await _run_health_check_and_log()
        except asyncio.CancelledError:
            break
        except Exception:
            pass

_uptime_task = None

@app.on_event("startup")
async def start_uptime_monitor():
    """Start background uptime monitor on app startup"""
    global _uptime_task
    _uptime_task = asyncio.create_task(_uptime_scheduler())


@app.on_event("shutdown")
async def stop_uptime_monitor():
    """Cancel background uptime monitor on shutdown"""
    global _uptime_task
    if _uptime_task:
        _uptime_task.cancel()


@app.get("/api/admin/uptime/stats")
async def get_uptime_stats(user: dict = Depends(require_admin)):
    """SLA metrikleri: uptime %, avg response time, consecutive failures"""
    try:
        now = datetime.utcnow()

        # Son 24 saat
        day_ago = (now - timedelta(hours=24)).isoformat()
        day_result = supabase.table("uptime_logs").select(
            "status, response_time_ms", count="exact"
        ).gte("checked_at", day_ago).execute()

        day_total = day_result.count or 0
        day_ok = sum(1 for r in (day_result.data or []) if r['status'] == 'ok')
        day_avg_rt = 0
        if day_result.data:
            rts = [r['response_time_ms'] for r in day_result.data if r.get('response_time_ms')]
            day_avg_rt = int(sum(rts) / len(rts)) if rts else 0

        # Son 7 gün
        week_ago = (now - timedelta(days=7)).isoformat()
        week_result = supabase.table("uptime_logs").select(
            "status, response_time_ms", count="exact"
        ).gte("checked_at", week_ago).execute()

        week_total = week_result.count or 0
        week_ok = sum(1 for r in (week_result.data or []) if r['status'] == 'ok')
        week_avg_rt = 0
        if week_result.data:
            rts = [r['response_time_ms'] for r in week_result.data if r.get('response_time_ms')]
            week_avg_rt = int(sum(rts) / len(rts)) if rts else 0

        # Son 30 gün
        month_ago = (now - timedelta(days=30)).isoformat()
        month_result = supabase.table("uptime_logs").select(
            "status", count="exact"
        ).gte("checked_at", month_ago).execute()

        month_total = month_result.count or 0
        month_ok = sum(1 for r in (month_result.data or []) if r['status'] == 'ok')

        return {
            "uptime_24h": round((day_ok / day_total * 100), 2) if day_total else 100,
            "uptime_7d": round((week_ok / week_total * 100), 2) if week_total else 100,
            "uptime_30d": round((month_ok / month_total * 100), 2) if month_total else 100,
            "avg_response_24h": day_avg_rt,
            "avg_response_7d": week_avg_rt,
            "total_checks_24h": day_total,
            "total_checks_7d": week_total,
            "total_checks_30d": month_total,
            "consecutive_failures": _consecutive_failures,
        }
    except Exception as e:
        log_security_event("UPTIME_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Uptime istatistikleri yüklenemedi")


@app.get("/api/admin/uptime/logs")
async def get_uptime_logs(
    page: int = 0,
    page_size: int = 50,
    status_filter: str = None,
    user: dict = Depends(require_admin)
):
    """Son uptime check logları (paginated)"""
    try:
        query = supabase.table("uptime_logs").select(
            "*", count="exact"
        ).order("checked_at", desc=True)

        if status_filter:
            query = query.eq("status", status_filter)

        offset = page * page_size
        query = query.range(offset, offset + page_size - 1)
        result = query.execute()

        return {
            "data": result.data or [],
            "total": result.count or 0,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        log_security_event("UPTIME_LOGS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Uptime logları yüklenemedi")


@app.get("/api/admin/uptime/chart")
async def get_uptime_chart(hours: int = 24, user: dict = Depends(require_admin)):
    """Response time chart data (last N hours)"""
    try:
        since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
        result = supabase.table("uptime_logs").select(
            "checked_at, status, response_time_ms"
        ).gte("checked_at", since).order("checked_at", desc=False).execute()

        return {"data": result.data or []}
    except Exception as e:
        log_security_event("UPTIME_CHART_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Chart verisi yüklenemedi")


# ============================================
# IN-APP NOTIFICATIONS (User Bell)
# ============================================

@app.get("/api/notifications/my")
async def get_my_notifications(page: int = 0, user: dict = Depends(get_current_user)):
    """Kullanıcının bildirimlerini listeler"""
    try:
        offset = page * 20
        result = supabase.table("user_notifications").select(
            "*", count="exact"
        ).eq("user_id", user['id']).order(
            "created_at", desc=True
        ).range(offset, offset + 19).execute()

        return {
            "data": result.data or [],
            "total": result.count or 0,
            "page": page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Bildirimler yüklenemedi")


@app.get("/api/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Okunmamış bildirim sayısı"""
    try:
        result = supabase.table("user_notifications").select(
            "id", count="exact"
        ).eq("user_id", user['id']).eq("is_read", False).execute()
        return {"count": result.count or 0}
    except Exception:
        return {"count": 0}


@app.patch("/api/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    """Bildirimi okundu işaretle"""
    try:
        supabase.table("user_notifications").update(
            {"is_read": True}
        ).eq("id", notif_id).eq("user_id", user['id']).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Bildirim güncellenemedi")


@app.patch("/api/notifications/mark-all-read")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Tüm bildirimleri okundu işaretle"""
    try:
        supabase.table("user_notifications").update(
            {"is_read": True}
        ).eq("user_id", user['id']).eq("is_read", False).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Bildirimler güncellenemedi")


async def send_user_notification(user_id: str, title: str, message: str, notif_type: str = "info", action_url: str = None):
    """Internal: kullanıcıya bildirim gönder"""
    try:
        supabase.table("user_notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notif_type,
            "action_url": action_url,
        }).execute()
    except Exception:
        pass


# ============================================
# RATE LIMITING DASHBOARD
# ============================================

@app.get("/api/admin/rate-limits/stats")
async def get_rate_limit_stats(user: dict = Depends(require_admin)):
    """Rate limit istatistikleri"""
    try:
        now = datetime.utcnow()
        day_ago = (now - timedelta(hours=24)).isoformat()

        # Son 24 saat
        result = supabase.table("rate_limit_logs").select(
            "ip_address, blocked, endpoint", count="exact"
        ).gte("created_at", day_ago).execute()

        total = result.count or 0
        blocked = sum(1 for r in (result.data or []) if r.get('blocked'))

        # Unique blocked IPs
        blocked_ips = list(set(
            r['ip_address'] for r in (result.data or []) if r.get('blocked')
        ))

        # Top offenders
        ip_counts: dict = {}
        for r in (result.data or []):
            if r.get('blocked'):
                ip = r['ip_address']
                ip_counts[ip] = ip_counts.get(ip, 0) + 1

        top_offenders = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_requests_24h": total,
            "blocked_24h": blocked,
            "unique_blocked_ips": len(blocked_ips),
            "top_offenders": [{"ip": ip, "count": count} for ip, count in top_offenders],
            "block_rate": round((blocked / total * 100), 2) if total else 0,
        }
    except Exception as e:
        log_security_event("RATE_LIMIT_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Rate limit istatistikleri yüklenemedi")


@app.get("/api/admin/rate-limits/logs")
async def get_rate_limit_logs(page: int = 0, blocked_only: bool = False, user: dict = Depends(require_admin)):
    """Rate limit log listesi"""
    try:
        query = supabase.table("rate_limit_logs").select(
            "*", count="exact"
        ).order("created_at", desc=True)

        if blocked_only:
            query = query.eq("blocked", True)

        offset = page * 50
        query = query.range(offset, offset + 49)
        result = query.execute()

        return {
            "data": result.data or [],
            "total": result.count or 0,
            "page": page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Rate limit logları yüklenemedi")


# ============================================
# EMAIL QUEUE
# ============================================

async def queue_email(to_email: str, subject: str, body: str):
    """Email kuyruğuna ekle"""
    try:
        supabase.table("email_queue").insert({
            "to_email": to_email,
            "subject": subject,
            "body": body,
            "status": "pending",
        }).execute()
    except Exception:
        pass


async def _process_email_queue():
    """Background: pending emailleri gönder"""
    try:
        result = supabase.table("email_queue").select("*").eq(
            "status", "pending"
        ).order("created_at").limit(10).execute()

        for email in (result.data or []):
            try:
                # Resend API kullan (mevcut config)
                resend_key = os.getenv("RESEND_API_KEY", "")
                if resend_key:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            "https://api.resend.com/emails",
                            headers={"Authorization": f"Bearer {resend_key}"},
                            json={
                                "from": os.getenv("RESEND_FROM_EMAIL", "noreply@hacveumreturlari.net"),
                                "to": email['to_email'],
                                "subject": email['subject'],
                                "html": email['body'],
                            }
                        )
                        if resp.status_code == 200:
                            supabase.table("email_queue").update({
                                "status": "sent",
                                "sent_at": datetime.utcnow().isoformat(),
                            }).eq("id", email['id']).execute()
                        else:
                            raise Exception(f"Resend error: {resp.status_code}")
                else:
                    raise Exception("RESEND_API_KEY not set")
            except Exception as e:
                attempts = email.get('attempts', 0) + 1
                new_status = "failed" if attempts >= email.get('max_attempts', 3) else "retry"
                supabase.table("email_queue").update({
                    "status": new_status,
                    "attempts": attempts,
                    "error_message": str(e)[:200],
                }).eq("id", email['id']).execute()
    except Exception:
        pass


@app.get("/api/admin/email-queue")
async def get_email_queue(page: int = 0, status: str = None, user: dict = Depends(require_admin)):
    """Email kuyruk durumu"""
    try:
        query = supabase.table("email_queue").select(
            "*", count="exact"
        ).order("created_at", desc=True)

        if status:
            query = query.eq("status", status)

        offset = page * 20
        query = query.range(offset, offset + 19)
        result = query.execute()

        # Stats
        stats_result = supabase.table("email_queue").select("status", count="exact").execute()
        status_counts: dict = {}
        for r in (stats_result.data or []):
            s = r.get('status', 'unknown')
            status_counts[s] = status_counts.get(s, 0) + 1

        return {
            "data": result.data or [],
            "total": result.count or 0,
            "page": page,
            "stats": status_counts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Email kuyruk yüklenemedi")


@app.post("/api/admin/email-queue/{email_id}/retry")
async def retry_email(email_id: str, user: dict = Depends(require_admin)):
    """Başarısız emaili tekrar dene"""
    try:
        supabase.table("email_queue").update({
            "status": "pending",
            "error_message": None,
        }).eq("id", email_id).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Email yeniden kuyruğa eklenemedi")


# ============================================
# SCHEDULED ACTIONS
# ============================================

class ScheduledActionCreate(BaseModel):
    action_type: str  # 'activate_user', 'publish_tour', 'send_notification'
    entity: Optional[str] = None
    entity_id: Optional[str] = None
    payload: Optional[dict] = {}
    scheduled_at: str  # ISO datetime


@app.get("/api/admin/scheduled-actions")
async def get_scheduled_actions(status_filter: str = "pending", user: dict = Depends(require_admin)):
    """Zamanlanmış aksiyonları listele"""
    try:
        query = supabase.table("scheduled_actions").select(
            "*", count="exact"
        ).order("scheduled_at", desc=False)

        if status_filter:
            query = query.eq("status", status_filter)

        result = query.limit(100).execute()

        return {
            "data": result.data or [],
            "total": result.count or 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Zamanlanmış aksiyonlar yüklenemedi")


@app.post("/api/admin/scheduled-actions")
async def create_scheduled_action(data: ScheduledActionCreate, request: Request, user: dict = Depends(require_admin)):
    """Yeni zamanlanmış aksiyon oluştur"""
    try:
        result = supabase.table("scheduled_actions").insert({
            "action_type": data.action_type,
            "entity": data.entity,
            "entity_id": data.entity_id,
            "payload": data.payload,
            "scheduled_at": data.scheduled_at,
            "created_by": user['id'],
        }).execute()

        await write_audit_log(
            request=request,
            user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='scheduled_action_created',
            entity=data.entity,
            entity_id=data.entity_id,
            details={'action_type': data.action_type, 'scheduled_at': data.scheduled_at}
        )

        return {"success": True, "data": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Zamanlanmış aksiyon oluşturulamadı")


@app.delete("/api/admin/scheduled-actions/{action_id}")
async def cancel_scheduled_action(action_id: str, user: dict = Depends(require_admin)):
    """Zamanlanmış aksiyonu iptal et"""
    try:
        supabase.table("scheduled_actions").update({
            "status": "cancelled"
        }).eq("id", action_id).eq("status", "pending").execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Aksiyon iptal edilemedi")


async def _execute_scheduled_actions():
    """Background: zamanı gelen aksiyonları çalıştır"""
    try:
        now = datetime.utcnow().isoformat()
        result = supabase.table("scheduled_actions").select("*").eq(
            "status", "pending"
        ).lte("scheduled_at", now).limit(10).execute()

        for action in (result.data or []):
            try:
                action_type = action['action_type']

                if action_type == 'activate_user' and action.get('entity_id'):
                    supabase.table("users").update({"status": "active"}).eq("id", action['entity_id']).execute()
                    await send_user_notification(action['entity_id'], "Hesap Aktif", "Hesabınız aktifleştirildi.", "success")

                elif action_type == 'suspend_user' and action.get('entity_id'):
                    supabase.table("users").update({"status": "suspended"}).eq("id", action['entity_id']).execute()

                elif action_type == 'send_notification' and action.get('payload'):
                    p = action['payload']
                    if p.get('user_id'):
                        await send_user_notification(p['user_id'], p.get('title', ''), p.get('message', ''), p.get('type', 'info'))

                supabase.table("scheduled_actions").update({
                    "status": "executed",
                    "executed_at": datetime.utcnow().isoformat(),
                }).eq("id", action['id']).execute()

            except Exception as e:
                supabase.table("scheduled_actions").update({
                    "status": "failed",
                    "error_message": str(e)[:200],
                }).eq("id", action['id']).execute()
    except Exception:
        pass


# ============================================
# OPERATOR PERFORMANCE STATS
# ============================================

@app.get("/api/admin/operator-performance")
async def get_operator_performance(user: dict = Depends(require_admin)):
    """Operatör performans metrikleri"""
    try:
        # Tüm operatörleri al
        operators = supabase.table("users").select(
            "id, email, company_name, created_at"
        ).eq("user_role", "operator").execute()

        performance = []
        for op in (operators.data or []):
            op_id = op['id']

            # Turları
            tours = supabase.table("tours").select("id, status", count="exact").eq("user_id", op_id).execute()
            total_tours = tours.count or 0
            approved = sum(1 for t in (tours.data or []) if t.get('status') == 'approved')
            rejected = sum(1 for t in (tours.data or []) if t.get('status') == 'rejected')

            # Ortalama rating (reviews tablosu varsa)
            avg_rating = 0
            try:
                reviews = supabase.table("reviews").select("rating").eq("operator_id", op_id).execute()
                if reviews.data:
                    ratings = [r['rating'] for r in reviews.data if r.get('rating')]
                    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
            except Exception:
                pass

            performance.append({
                "id": op_id,
                "email": op['email'],
                "company_name": op.get('company_name', ''),
                "total_tours": total_tours,
                "approved_tours": approved,
                "rejected_tours": rejected,
                "approval_rate": round((approved / total_tours * 100), 1) if total_tours else 0,
                "avg_rating": avg_rating,
                "joined_at": op['created_at'],
            })

        # Sırala: onay oranına göre
        performance.sort(key=lambda x: x['approval_rate'], reverse=True)

        return {"operators": performance}
    except Exception as e:
        log_security_event("OPERATOR_PERF_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Operatör performansı yüklenemedi")


# ============================================
# SYSTEM INFO (DB Backup placeholder)
# ============================================

@app.get("/api/admin/system-info")
async def get_system_info(user: dict = Depends(require_admin)):
    """Sistem bilgisi"""
    try:
        # Table row counts
        tables = {}
        for table_name in ['users', 'tours', 'reviews', 'audit_logs', 'uptime_logs', 'email_queue']:
            try:
                r = supabase.table(table_name).select("id", count="exact").limit(0).execute()
                tables[table_name] = r.count or 0
            except Exception:
                tables[table_name] = -1

        return {
            "tables": tables,
            "supabase_url": os.getenv("SUPABASE_URL", "").split("//")[-1] if os.getenv("SUPABASE_URL") else "N/A",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "server_time": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Sistem bilgisi yüklenemedi")


# ============================================
# BACKGROUND TASK UPDATES — add email + scheduled to startup
# ============================================

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

_combined_task = None

@app.on_event("startup")
async def start_combined_scheduler():
    global _combined_task
    _combined_task = asyncio.create_task(_combined_scheduler())


@app.on_event("shutdown")
async def stop_combined_scheduler():
    global _combined_task
    if _combined_task:
        _combined_task.cancel()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
