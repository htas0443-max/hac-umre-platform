"""
Auth Routes — Register, Login, Logout, Refresh, Sync, Me
"""

from fastapi import APIRouter, Request, Response, Depends
from dependencies import (
    supabase, limiter, security,
    get_current_user, get_optional_user,
    validate_input, validate_password_strength,
    check_brute_force, record_failed_login, record_successful_login,
    log_security_event, verify_turnstile_token,
    UserRegister, UserLogin, SessionSync,
    SUPABASE_URL, SUPABASE_ANON_KEY,
    HTTPException, Optional, datetime,
)
from supabase import create_client

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
@limiter.limit("5/hour")
async def register(request: Request, user_data: UserRegister):
    """Yeni kullanıcı kaydı (Supabase Auth) - Secure"""
    try:
        validate_password_strength(user_data.password)
        email = validate_input(user_data.email, "email")

        allowed_roles = ["user"]
        if user_data.user_role not in allowed_roles:
            log_security_event("ROLE_INJECTION_ATTEMPT", {
                "email": email, "attempted_role": user_data.user_role,
                "ip": request.client.host
            }, "CRITICAL")
            user_data.user_role = "user"

        if user_data.company_name:
            log_security_event("OPERATOR_REGISTRATION_WRONG_ENDPOINT", {
                "email": email, "ip": request.client.host
            }, "WARN")
            user_data.company_name = None

        company_name = None

        log_security_event("USER_REGISTRATION", {
            "email": email, "role": "user", "ip": request.client.host
        })

        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {"user_role": "user", "company_name": None}
        })

        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Kayıt başarısız")

        sign_in_response = supabase.auth.sign_in_with_password({
            "email": email, "password": user_data.password
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
        log_security_event("REGISTRATION_FAILED", {"email": user_data.email, "error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Kayıt sırasında bir hata oluştu")


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, response: Response):
    """Kullanıcı girişi (Supabase Auth) - Brute Force Protected + HttpOnly Cookie"""
    client_ip = request.client.host

    try:
        check_brute_force(client_ip)

        if not await verify_turnstile_token(credentials.turnstile_token or "", client_ip):
            log_security_event("TURNSTILE_REJECTED", {"email": credentials.email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=403, detail="Bot doğrulaması başarısız. Lütfen tekrar deneyin.")

        email = validate_input(credentials.email, "email")

        auth_response = supabase.auth.sign_in_with_password({
            "email": email, "password": credentials.password
        })

        if not auth_response.user:
            record_failed_login(client_ip)
            log_security_event("LOGIN_FAILED", {"email": email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

        record_successful_login(client_ip)
        log_security_event("LOGIN_SUCCESS", {"email": email, "ip": client_ip})

        profile = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()

        user_data = {}
        if profile.data and len(profile.data) > 0:
            user_data = profile.data[0]
        else:
            user_data = {"user_role": "user", "company_name": None}

        if user_data.get('status') == 'suspended':
            log_security_event("SUSPENDED_LOGIN_ATTEMPT", {"email": email, "ip": client_ip}, "WARN")
            raise HTTPException(status_code=403, detail="Hesabınız askıya alınmıştır. Destek ile iletişime geçin.")

        from security import create_csrf_token_for_session
        csrf_token = create_csrf_token_for_session(auth_response.user.id)

        access_token = auth_response.session.access_token if auth_response.session else None

        if access_token:
            response.set_cookie(
                key="access_token", value=access_token,
                httponly=True, secure=True, samesite="strict",
                max_age=3600 * 24, path="/", domain=None
            )
            if auth_response.session.refresh_token:
                response.set_cookie(
                    key="refresh_token", value=auth_response.session.refresh_token,
                    httponly=True, secure=True, samesite="strict",
                    max_age=3600 * 24 * 7, path="/api/auth", domain=None
                )

        return {
            "message": "Giriş başarılı",
            "token": access_token,
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


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Mevcut kullanıcı bilgilerini getirir"""
    return {
        "email": user["email"],
        "role": user.get("user_role", "user"),
        "company_name": user.get("company_name"),
        "created_at": user.get("created_at")
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Kullanıcı çıkışı - HttpOnly cookie'leri temizler"""
    try:
        response.delete_cookie(key="access_token", path="/", domain=None, secure=True, httponly=True, samesite="strict")
        response.delete_cookie(key="refresh_token", path="/api/auth", domain=None, secure=True, httponly=True, samesite="strict")
        log_security_event("LOGOUT_SUCCESS", {"ip": request.client.host})
        return {"message": "Çıkış başarılı"}
    except Exception as e:
        log_security_event("LOGOUT_ERROR", {"error": str(e)}, "ERROR")
        return {"message": "Çıkış yapıldı"}


@router.post("/refresh")
async def refresh_session(request: Request, response: Response):
    """Sessiz Token Yenileme (Silent Refresh) - HttpOnly Cookie kullanarak"""
    try:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token bulunamadı")

        try:
            auth_response = supabase.auth.refresh_session(refresh_token)
        except Exception:
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            raise HTTPException(status_code=401, detail="Oturum süresi doldu")

        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Oturum yenilenemedi")

        new_access_token = auth_response.session.access_token
        new_refresh_token = auth_response.session.refresh_token

        response.set_cookie(
            key="access_token", value=new_access_token,
            httponly=True, secure=True, samesite="strict",
            max_age=3600 * 24, path="/"
        )
        if new_refresh_token:
            response.set_cookie(
                key="refresh_token", value=new_refresh_token,
                httponly=True, secure=True, samesite="strict",
                max_age=3600 * 24 * 7, path="/api/auth"
            )

        user = auth_response.user
        profile = supabase.table("users").select("*").eq("id", user.id).execute()
        user_role = "user"
        company_name = None
        if profile.data:
            user_data = profile.data[0]
            user_role = user_data.get("user_role", "user")
            company_name = user_data.get("company_name")

        return {
            "token": new_access_token,
            "user": {"id": user.id, "email": user.email, "role": user_role, "company_name": company_name}
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REFRESH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=401, detail="Oturum yenileme hatası")


@router.post("/sync")
async def sync_session(session: SessionSync, response: Response, request: Request):
    """Sync client-side session (e.g. OAuth) to HttpOnly cookies"""
    try:
        user_supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_supabase.auth.set_session(session.access_token, session.refresh_token or session.access_token)
        user_response = user_supabase.auth.get_user()

        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        response.set_cookie(
            key="access_token", value=session.access_token,
            httponly=True, secure=True, samesite="strict",
            max_age=3600 * 24, path="/"
        )
        if session.refresh_token:
            response.set_cookie(
                key="refresh_token", value=session.refresh_token,
                httponly=True, secure=True, samesite="strict",
                max_age=3600 * 24 * 7, path="/api/auth"
            )

        return {"message": "Session synced"}
    except Exception as e:
        log_security_event("SYNC_ERROR", {"error": str(e)}, "WARN")
        raise HTTPException(status_code=401, detail="Session sync failed")
