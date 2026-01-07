from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import csv
import io
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
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Hac & Umre API - Supabase",
    docs_url=None,  # Disable Swagger UI in production
    redoc_url=None,  # Disable ReDoc in production
    openapi_url=None  # SEC-010 FIX: Disable OpenAPI schema endpoint
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

# Add security headers middleware
app.middleware("http")(add_security_headers)

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

app.add_middleware(TimeoutMiddleware)

# CORS - Secure configuration (SEC-002 FIX)
_cors_env = os.getenv("CORS_ORIGINS", "")
if not _cors_env or _cors_env.strip() == "*":
    # In production, CORS_ORIGINS must be explicitly set
    import warnings
    warnings.warn("CORS_ORIGINS not set or is wildcard. Using restrictive default.", RuntimeWarning)
    ALLOWED_ORIGINS = []  # No origins allowed by default
else:
    ALLOWED_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True if ALLOWED_ORIGINS else False,  # Only allow credentials with explicit origins
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],  # SEC-005: CSRF header
    expose_headers=["X-Total-Count"],
    max_age=600,  # Cache preflight for 10 minutes
)

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
    """Admin yetkisi gerektirir"""
    if user.get("user_role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return user

def require_operator(user: dict = Depends(get_current_user)) -> dict:
    """Operator yetkisi gerektirir"""
    if user.get("user_role") not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Tur şirketi yetkisi gerekli")
    return user

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

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    user_role: str = Field(default="user")
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TourCreate(BaseModel):
    title: str
    operator: str
    price: float
    currency: str = Field(default="TRY", pattern="^(TRY|USD|EUR)$")  # TRY, USD, EUR
    start_date: str
    end_date: str
    duration: str
    hotel: str
    services: List[str]
    visa: str
    transport: str
    guide: str
    itinerary: List[str]
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
@app.put("/api/admin/tours/{tour_id}/approve")
async def approve_tour(tour_id: int, user: dict = Depends(require_admin)):
    """Admin turu onaylar (RPC)"""
    try:
        # Use Supabase RPC function
        response = supabase.rpc('approve_tour', {
            'tour_id_param': tour_id,
            'admin_id': user['id'],
            'approval_reason_param': 'Approved by admin'
        }).execute()
        
        return response.data
    except Exception as e:
        log_security_event("TOUR_APPROVE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur onaylanırken bir hata oluştu")

@app.put("/api/admin/tours/{tour_id}/reject")
async def reject_tour(tour_id: int, reason: str, user: dict = Depends(require_admin)):
    """Admin turu reddeder (RPC)"""
    try:
        # Use Supabase RPC function
        response = supabase.rpc('reject_tour', {
            'tour_id_param': tour_id,
            'admin_id': user['id'],
            'rejection_reason_param': reason
        }).execute()
        
        return response.data
    except Exception as e:
        log_security_event("TOUR_REJECT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur reddedilirken bir hata oluştu")

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
    """Operator devlet onaylı izin belgesi yükler"""
    try:
        # Dosya tipi kontrolü
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Sadece PDF veya resim dosyaları yüklenebilir")
        
        # Dosya boyutu kontrolü (5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Dosya boyutu 5MB'dan küçük olmalıdır")
        
        # Supabase Storage'a yükle
        file_path = f"{user['id']}/license_{user['id']}.{file.filename.split('.')[-1]}"
        
        storage_response = supabase.storage.from_('license-documents').upload(
            file_path,
            contents,
            {
                'content-type': file.content_type,
                'upsert': True  # Var olan dosyayı güncelle
            }
        )
        
        # Public URL al
        public_url = supabase.storage.from_('license-documents').get_public_url(file_path)
        
        # Users tablosunu güncelle
        supabase.table("users").update({
            "license_document_url": public_url,
            "license_number": license_number,
            "license_verified": False  # Admin onayı bekleyecek
        }).eq("id", user["id"]).execute()
        
        return {
            "message": "İzin belgesi başarıyla yüklendi",
            "license_url": public_url,
            "status": "pending_verification"
        }
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
async def verify_license(operator_id: str, verified: bool, license_number: str = "", user: dict = Depends(require_admin)):
    """Admin operator license'ını onaylar veya reddeder"""
    try:
        response = supabase.rpc('verify_operator_license', {
            'operator_id_param': operator_id,
            'admin_id': user['id'],
            'verified': verified,
            'license_number_param': license_number if license_number else None
        }).execute()
        
        return response.data
    except Exception as e:
        log_security_event("LICENSE_VERIFY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Lisans doğrulanırken bir hata oluştu")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
