"""
Shared dependencies for route modules.
Contains Supabase clients, auth helpers, Pydantic models, and utility functions.
"""

from fastapi import Request, Depends, HTTPException, Response, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json
import csv
import io
import asyncio

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client, Client
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
    mask_sensitive_data,
    verify_turnstile_token,
    get_secure_client_ip,
)

# ============================================
# SUPABASE CLIENTS
# ============================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

security = HTTPBearer(auto_error=False)

# AI Service
ai_service = AIService()

# ============================================
# AUTH HELPERS
# ============================================

async def get_token_from_request(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = None) -> str:
    """Token'ı header veya cookie'den al"""
    if credentials and credentials.credentials:
        return credentials.credentials
    token = request.cookies.get("access_token")
    if token:
        return token
    raise HTTPException(status_code=401, detail="Token bulunamadı")


def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Supabase JWT'den kullanıcıyı doğrular - Header veya Cookie'den"""
    try:
        token = None
        if credentials and credentials.credentials:
            token = credentials.credentials
        if not token:
            token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Token bulunamadı")

        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(token, token)
        user_response = user_supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(status_code=401, detail="Geçersiz token")

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
    """Sadece super_admin yetkisi gerektirir"""
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
    """Opsiyonel kullanıcı kimlik doğrulaması"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ")[1]
        if not token:
            return None
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(token, token)
        user_response = user_supabase.auth.get_user(token)
        if not user_response.user:
            return None
        profile = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        if not profile.data:
            return None
        return profile.data[0]
    except Exception:
        return None


# ============================================
# AUDIT LOG HELPERS
# ============================================

async def log_admin_action(request: Request, admin_id: str, action: str, details: Dict[str, Any] = None):
    """Log admin action to Supabase audit table (admin_audit_log)"""
    try:
        if details is None:
            details = {}
        details = mask_sensitive_data(details)
        client_ip = get_secure_client_ip(request)
        log_entry = {
            "admin_id": admin_id,
            "action": action,
            "details": details,
            "ip_address": client_ip,
            "user_agent": request.headers.get("user-agent", "")[:200],
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("admin_audit_log").insert(log_entry).execute()
    except Exception as e:
        log_security_event(f"ADMIN_AUDIT_DB_ERROR ({action})", {"error": str(e)}, "ERROR")


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
        supabase.rpc("record_feature_usage", {
            "user_id_param": user["id"],
            "feature_name_param": feature_name
        }).execute()
        return True
    except HTTPException:
        raise
    except Exception:
        return True


# ============================================
# PYDANTIC MODELS
# ============================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    user_role: str = Field(default="user")
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: Optional[str] = None

class TourCreate(BaseModel):
    title: str
    operator: str
    price: float
    currency: str = Field(default="TRY", pattern="^(TRY|USD|EUR)$")
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

class NotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)
    target_role: str = Field(default="all")

class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]

class FavoriteCreate(BaseModel):
    tour_id: int

class FavoriteSync(BaseModel):
    tour_ids: List[int]

class PriceAlertCreate(BaseModel):
    tour_id: int

class TourAlertCreate(BaseModel):
    start_date: str
    end_date: str
    tour_type: str = "any"
    max_price: Optional[float] = None
    preferred_operator: Optional[str] = None

class TourAlertUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tour_type: Optional[str] = None
    max_price: Optional[float] = None
    preferred_operator: Optional[str] = None
    is_active: Optional[bool] = None

class ReviewCreate(BaseModel):
    operator_name: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    tour_id: Optional[int] = None

class ReviewModerate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class SessionSync(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: Optional[dict] = None

class ScheduledActionCreate(BaseModel):
    action_type: str
    entity: Optional[str] = None
    entity_id: Optional[str] = None
    payload: Optional[dict] = {}
    scheduled_at: str
