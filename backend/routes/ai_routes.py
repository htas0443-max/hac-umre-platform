"""
AI Routes — Tour comparison, Chatbot, Provider listing
"""

from fastapi import APIRouter, Request, Depends
from dependencies import (
    supabase, limiter, ai_service, log_security_event,
    get_current_user, get_optional_user, check_feature_access,
    CompareRequest, ChatRequest,
    HTTPException, Optional,
)

router = APIRouter(prefix="/api", tags=["ai"])


@router.post("/compare")
@limiter.limit("10/hour")
async def compare_tours(request: Request, compare_request: CompareRequest, user: dict = Depends(get_current_user)):
    """AI ile turları karşılaştırır - License Protected"""
    try:
        await check_feature_access(user, "ai_compare")

        tours = []
        for tour_id in compare_request.tour_ids:
            response = supabase.table("tours").select("*").eq("id", int(tour_id)).execute()
            if response.data:
                tours.append(response.data[0])

        if len(tours) < 2:
            raise HTTPException(status_code=400, detail="En az 2 tur gerekli")

        result = await ai_service.compare_tours(
            tours=tours, criteria=compare_request.criteria, provider=compare_request.ai_provider
        )

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


@router.post("/chat")
@limiter.limit("100/hour")
async def chat(request: Request, chat_request: ChatRequest):
    """AI chatbot ile sohbet - Giriş yapmadan da kullanılabilir"""
    try:
        user = get_optional_user(request)

        # ===== DYNAMIC RATE LIMITING =====
        from cache import check_user_rate_limit
        from security import get_secure_client_ip, log_rate_limit_event

        if user:
            user_id = user.get("id", "unknown")
            if not await check_user_rate_limit(user_id, limit=100, window=3600):
                log_rate_limit_event(get_secure_client_ip(request), endpoint="/api/chat", blocked=True, reason="User hourly limit exceeded")
                raise HTTPException(status_code=429, detail="Saatlik sınırınıza ulaştınız. Lütfen bekleyin.")
        else:
            client_ip = get_secure_client_ip(request)
            if not await check_user_rate_limit(f"anon:{client_ip}", limit=20, window=3600):
                log_rate_limit_event(client_ip, endpoint="/api/chat", blocked=True, reason="Anonymous hourly limit exceeded")
                raise HTTPException(status_code=429, detail="Anonim kullanıcı sınırına ulaştınız. Giriş yaparak daha fazla mesaj gönderebilirsiniz.")

        # ===== ANONIM KULLANICI GÜVENLİK KONTROLLARI =====
        if not user:
            honeypot = request.headers.get("X-Form-Token", "")
            if honeypot and len(honeypot) > 0:
                log_security_event("BOT_DETECTED_HONEYPOT", {"ip": request.client.host}, "WARN")
                return {"answer": "Bir hata oluştu. Lütfen tekrar deneyin.", "provider": "error"}

            if len(chat_request.message) > 500:
                raise HTTPException(status_code=400, detail="Mesaj çok uzun. Giriş yapmadan maksimum 500 karakter gönderebilirsiniz.")

            client_ip = get_secure_client_ip(request)
            log_security_event("ANONYMOUS_CHAT_REQUEST", {"ip": client_ip, "message_length": len(chat_request.message)})

        if user:
            try:
                await check_feature_access(user, "ai_chat")
            except HTTPException:
                user = None

        context_tours = []
        if chat_request.context_tour_ids:
            for tour_id in chat_request.context_tour_ids:
                response = supabase.table("tours").select("*").eq("id", int(tour_id)).execute()
                if response.data:
                    context_tours.append(response.data[0])

        cached_answer = None  # Cache disabled

        if cached_answer:
            answer = cached_answer
        else:
            answer = await ai_service.chat(
                message=chat_request.message,
                context_tours=context_tours,
                provider=chat_request.ai_provider
            )

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
            "cached": cached_answer is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("AI_CHAT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Chatbot yanıt veremedi")


@router.get("/providers/models")
async def get_providers():
    """Mevcut AI sağlayıcıları listeler"""
    return {
        "providers": [
            {"name": "openai", "model": "gpt-5", "status": "active", "description": "OpenAI GPT-5 - En gelişmiş model"},
            {"name": "anthropic", "model": "claude-sonnet-4-20250514", "status": "active", "description": "Claude Sonnet 4 - Hızlı ve detaylı analiz ⚡"},
            {"name": "gemini", "model": "gemini-2.0-flash", "status": "inactive", "description": "Gemini 2.0 - Şu anda kullanılamıyor"}
        ]
    }


@router.get("/currencies")
async def get_currencies():
    """Desteklenen para birimlerini listeler"""
    return {
        "currencies": [
            {"code": "TRY", "symbol": "₺", "name": "Türk Lirası"},
            {"code": "USD", "symbol": "$", "name": "Amerikan Doları"},
            {"code": "EUR", "symbol": "€", "name": "Euro"}
        ]
    }


@router.get("/packages")
async def get_packages():
    """Mevcut paketleri listeler"""
    try:
        response = supabase.table("packages").select("*").eq("is_active", True).execute()
        return {"packages": response.data}
    except Exception as e:
        log_security_event("PACKAGES_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Paketler alınırken bir hata oluştu")


@router.get("/user/license")
async def get_user_license(user: dict = Depends(get_current_user)):
    """Kullanıcının aktif lisansını getirir"""
    try:
        response = supabase.table("user_licenses").select(
            "*, package:packages(*)"
        ).eq("user_id", user["id"]).eq("is_active", True).gte("expires_at", "now()").execute()

        return {"license": response.data[0] if response.data else None, "has_active_license": len(response.data) > 0}
    except Exception as e:
        log_security_event("LICENSE_INFO_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Lisans bilgisi alınırken bir hata oluştu")


@router.get("/user/usage/{feature_name}")
async def get_feature_usage(feature_name: str, user: dict = Depends(get_current_user)):
    """Kullanıcının feature kullanım bilgisini getirir"""
    try:
        response = supabase.rpc("check_user_feature", {
            "user_id_param": user["id"], "feature_name_param": feature_name
        }).execute()

        result = response.data[0] if response.data else {"allowed": False, "remaining": 0, "limit_value": 0}

        return {
            "feature": feature_name, "allowed": result["allowed"],
            "remaining": result["remaining"], "limit": result["limit_value"]
        }
    except Exception as e:
        log_security_event("USAGE_INFO_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanım bilgisi alınırken bir hata oluştu")
