"""
User Routes — Favorites, Price Alerts, Tour Alerts, Reviews, Notifications
"""

from fastapi import APIRouter, Request, Depends
from dependencies import (
    supabase, log_security_event,
    get_current_user, send_user_notification,
    FavoriteCreate, FavoriteSync,
    PriceAlertCreate,
    TourAlertCreate, TourAlertUpdate,
    ReviewCreate,
    HTTPException, Optional, datetime,
)

router = APIRouter(prefix="/api", tags=["user"])


# ===== FAVORITES =====

def mask_ip(ip: str) -> str:
    if not ip:
        return "unknown"
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.xxx.xxx"
    return "masked"


async def check_favorites_abuse(user_id: str, tour_id: int, request: Request):
    try:
        client_ip = mask_ip(request.client.host if request.client else None)
        from datetime import timedelta
        day_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        daily_count_response = supabase.table("favorites").select("id", count="exact").eq(
            "user_id", user_id
        ).gte("created_at", day_ago).execute()
        daily_count = daily_count_response.count or 0

        if daily_count >= 100:
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id, "ip_masked": client_ip,
                "signal_type": "high_volume", "count": daily_count,
                "window_size": "24h", "tour_id": tour_id
            }).execute()
            log_security_event("FAVORITES_ABUSE_SIGNAL", {"type": "high_volume", "user_id": user_id, "count": daily_count, "window": "24h"}, "WARN")

        total_response = supabase.table("favorites").select("id", count="exact").eq("user_id", user_id).execute()
        total_count = total_response.count or 0
        if total_count >= 500:
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id, "ip_masked": client_ip,
                "signal_type": "excessive_total", "count": total_count,
                "window_size": "total", "tour_id": tour_id
            }).execute()
            log_security_event("FAVORITES_ABUSE_SIGNAL", {"type": "excessive_total", "user_id": user_id, "count": total_count}, "WARN")
    except Exception as e:
        log_security_event("FAVORITES_ABUSE_CHECK_ERROR", {"error": str(e)}, "ERROR")


async def check_rapid_toggle(user_id: str, tour_id: int, request: Request):
    try:
        client_ip = mask_ip(request.client.host if request.client else None)
        from datetime import timedelta
        ten_min_ago = (datetime.utcnow() - timedelta(minutes=10)).isoformat()

        recent_signals = supabase.table("favorites_abuse_signals").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("tour_id", tour_id).eq("signal_type", "rapid_toggle").gte("created_at", ten_min_ago).execute()
        toggle_count = (recent_signals.count or 0) + 1

        if toggle_count >= 10:
            supabase.table("favorites_abuse_signals").insert({
                "user_id": user_id, "ip_masked": client_ip,
                "signal_type": "rapid_toggle", "count": toggle_count,
                "window_size": "10m", "tour_id": tour_id
            }).execute()
            log_security_event("FAVORITES_ABUSE_SIGNAL", {"type": "rapid_toggle", "user_id": user_id, "tour_id": tour_id, "count": toggle_count, "window": "10m"}, "WARN")
    except Exception as e:
        log_security_event("FAVORITES_RAPID_TOGGLE_CHECK_ERROR", {"error": str(e)}, "ERROR")


@router.post("/favorites")
async def add_favorite(data: FavoriteCreate, request: Request, user: dict = Depends(get_current_user)):
    """Kullanıcının favorilerine tur ekler"""
    try:
        tour_check = supabase.table("tours").select("id, status").eq("id", data.tour_id).execute()
        if not tour_check.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if tour_check.data[0].get("status") != "approved":
            raise HTTPException(status_code=400, detail="Bu tur favorilere eklenemez")

        supabase.table("favorites").upsert({
            "user_id": user["id"], "tour_id": data.tour_id
        }, on_conflict="user_id,tour_id").execute()

        log_security_event("FAVORITE_ADDED", {"user_id": user["id"], "tour_id": data.tour_id})

        try:
            await check_favorites_abuse(user["id"], data.tour_id, request)
        except:
            pass

        return {"message": "Favorilere eklendi", "tour_id": data.tour_id}
    except HTTPException:
        raise
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "Zaten favorilerde", "tour_id": data.tour_id}
        log_security_event("FAVORITE_ADD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favorilere eklenirken bir hata oluştu")


@router.delete("/favorites/{tour_id}")
async def remove_favorite(tour_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Kullanıcının favorilerinden tur kaldırır"""
    try:
        supabase.table("favorites").delete().eq("user_id", user["id"]).eq("tour_id", tour_id).execute()
        log_security_event("FAVORITE_REMOVED", {"user_id": user["id"], "tour_id": tour_id})
        try:
            await check_rapid_toggle(user["id"], tour_id, request)
        except:
            pass
        return {"message": "Favorilerden çıkarıldı", "tour_id": tour_id}
    except Exception as e:
        log_security_event("FAVORITE_REMOVE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favorilerden çıkarılırken bir hata oluştu")


@router.get("/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    """Kullanıcının favori turlarını listeler"""
    try:
        response = supabase.table("favorites").select(
            "id, tour_id, created_at, tours!inner(id, title, operator, price, currency, duration, hotel, services, start_date, end_date, status, is_verified, operator_phone)"
        ).eq("user_id", user["id"]).execute()

        favorites = []
        for fav in response.data:
            tour = fav.get("tours", {})
            if tour.get("status") == "approved":
                favorites.append({"favorite_id": fav["id"], "tour_id": fav["tour_id"], "added_at": fav["created_at"], "tour": tour})

        return {"favorites": favorites, "total": len(favorites)}
    except Exception as e:
        log_security_event("FAVORITES_LOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Favoriler yüklenirken bir hata oluştu")


@router.post("/favorites/sync")
async def sync_favorites(data: FavoriteSync, user: dict = Depends(get_current_user)):
    """localStorage'dan gelen favorileri veritabanına senkronize eder"""
    try:
        synced = 0
        skipped = 0
        for tour_id in data.tour_ids:
            try:
                tour_check = supabase.table("tours").select("id, status").eq("id", tour_id).execute()
                if not tour_check.data or tour_check.data[0].get("status") != "approved":
                    skipped += 1
                    continue
                supabase.table("favorites").upsert({"user_id": user["id"], "tour_id": tour_id}, on_conflict="user_id,tour_id").execute()
                synced += 1
            except Exception:
                skipped += 1
                continue

        log_security_event("FAVORITES_SYNCED", {"user_id": user["id"], "synced": synced, "skipped": skipped})
        return {"message": "Favoriler senkronize edildi", "synced": synced, "skipped": skipped}
    except Exception as e:
        log_security_event("FAVORITES_SYNC_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Favoriler senkronize edilirken bir hata oluştu")


# ===== PRICE ALERTS =====

@router.post("/price-alerts")
async def create_price_alert(data: PriceAlertCreate, user: dict = Depends(get_current_user)):
    try:
        tour = supabase.table("tours").select("id, price, status").eq("id", data.tour_id).execute()
        if not tour.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if tour.data[0].get("status") != "approved":
            raise HTTPException(status_code=400, detail="Bu tur için bildirim oluşturulamaz")

        current_price = tour.data[0]["price"]
        supabase.table("price_alerts").upsert({
            "user_id": user["id"], "tour_id": data.tour_id,
            "last_seen_price": current_price, "is_active": True
        }, on_conflict="user_id,tour_id").execute()

        return {"message": "Fiyat bildirimi aktif", "tour_id": data.tour_id, "current_price": current_price}
    except HTTPException:
        raise
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "Bildirim zaten aktif", "tour_id": data.tour_id}
        log_security_event("PRICE_ALERT_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim oluşturulurken bir hata oluştu")


@router.delete("/price-alerts/{tour_id}")
async def delete_price_alert(tour_id: int, user: dict = Depends(get_current_user)):
    try:
        supabase.table("price_alerts").delete().eq("user_id", user["id"]).eq("tour_id", tour_id).execute()
        return {"message": "Bildirim kaldırıldı", "tour_id": tour_id}
    except Exception as e:
        log_security_event("PRICE_ALERT_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim kaldırılırken bir hata oluştu")


@router.get("/price-alerts")
async def get_price_alerts(user: dict = Depends(get_current_user)):
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
                    "alert_id": alert["id"], "tour_id": alert["tour_id"],
                    "last_seen_price": last_seen, "current_price": current_price,
                    "price_dropped": price_dropped, "price_diff": last_seen - current_price if price_dropped else 0,
                    "created_at": alert["created_at"], "tour": tour
                })

        return {"alerts": alerts, "total": len(alerts)}
    except Exception as e:
        log_security_event("PRICE_ALERTS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Bildirimler yüklenirken bir hata oluştu")


@router.post("/price-alerts/{tour_id}/toggle")
async def toggle_price_alert(tour_id: int, user: dict = Depends(get_current_user)):
    try:
        existing = supabase.table("price_alerts").select("id, is_active").eq("user_id", user["id"]).eq("tour_id", tour_id).execute()
        if existing.data:
            new_state = not existing.data[0]["is_active"]
            supabase.table("price_alerts").update({"is_active": new_state}).eq("id", existing.data[0]["id"]).execute()
            return {"message": "Bildirim güncellendi", "tour_id": tour_id, "is_active": new_state}
        else:
            tour = supabase.table("tours").select("id, price, status").eq("id", tour_id).execute()
            if not tour.data or tour.data[0].get("status") != "approved":
                raise HTTPException(status_code=400, detail="Bu tur için bildirim oluşturulamaz")
            supabase.table("price_alerts").insert({
                "user_id": user["id"], "tour_id": tour_id,
                "last_seen_price": tour.data[0]["price"], "is_active": True
            }).execute()
            return {"message": "Bildirim aktif", "tour_id": tour_id, "is_active": True}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("PRICE_ALERT_TOGGLE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Bildirim güncellenirken bir hata oluştu")


# ===== TOUR ALERTS =====

@router.post("/tour-alerts")
async def create_tour_alert(data: TourAlertCreate, user: dict = Depends(get_current_user)):
    try:
        if data.tour_type not in ['hac', 'umre', 'any']:
            raise HTTPException(status_code=400, detail="Geçersiz tur tipi")
        from datetime import datetime as dt
        try:
            start = dt.strptime(data.start_date, "%Y-%m-%d")
            end = dt.strptime(data.end_date, "%Y-%m-%d")
            if end < start:
                raise HTTPException(status_code=400, detail="Bitiş tarihi başlangıçtan önce olamaz")
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı (YYYY-MM-DD)")

        response = supabase.table("tour_alerts").insert({
            "user_id": user["id"], "start_date": data.start_date,
            "end_date": data.end_date, "tour_type": data.tour_type,
            "max_price": data.max_price, "preferred_operator": data.preferred_operator,
            "is_active": True
        }).execute()

        return {"message": "Tur alarmı oluşturuldu", "alert": response.data[0] if response.data else None}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("TOUR_ALERT_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm oluşturulurken bir hata oluştu")


@router.get("/tour-alerts")
async def get_tour_alerts(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("tour_alerts").select(
            "id, start_date, end_date, tour_type, max_price, preferred_operator, is_active, notified_count, created_at"
        ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return {"alerts": response.data, "total": len(response.data)}
    except Exception as e:
        log_security_event("TOUR_ALERTS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Alarmlar yüklenirken bir hata oluştu")


@router.put("/tour-alerts/{alert_id}")
async def update_tour_alert(alert_id: str, data: TourAlertUpdate, user: dict = Depends(get_current_user)):
    try:
        existing = supabase.table("tour_alerts").select("id").eq("id", alert_id).eq("user_id", user["id"]).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Alarm bulunamadı")
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek veri yok")
        response = supabase.table("tour_alerts").update(update_data).eq("id", alert_id).execute()
        return {"message": "Alarm güncellendi", "alert": response.data[0] if response.data else None}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("TOUR_ALERT_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm güncellenirken bir hata oluştu")


@router.delete("/tour-alerts/{alert_id}")
async def delete_tour_alert(alert_id: str, user: dict = Depends(get_current_user)):
    try:
        supabase.table("tour_alerts").delete().eq("id", alert_id).eq("user_id", user["id"]).execute()
        return {"message": "Alarm silindi", "alert_id": alert_id}
    except Exception as e:
        log_security_event("TOUR_ALERT_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Alarm silinirken bir hata oluştu")


# ===== REVIEWS =====

@router.post("/reviews")
async def create_review(data: ReviewCreate, user: dict = Depends(get_current_user)):
    try:
        if data.rating < 1 or data.rating > 5:
            raise HTTPException(status_code=400, detail="Puan 1-5 arası olmalıdır")
        existing = supabase.table("operator_reviews").select("id").eq("user_id", user["id"]).eq("operator_name", data.operator_name).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Bu firmayı zaten değerlendirdiniz")

        response = supabase.table("operator_reviews").insert({
            "user_id": user["id"], "operator_name": data.operator_name,
            "rating": data.rating, "title": data.title,
            "comment": data.comment, "tour_id": data.tour_id, "status": "pending"
        }).execute()

        return {"message": "Değerlendirmeniz alındı, onay sonrası yayınlanacaktır", "review": response.data[0] if response.data else None}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REVIEW_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Değerlendirme oluşturulurken hata oluştu")


@router.get("/reviews/operator/{operator_name}")
async def get_operator_reviews(operator_name: str, limit: int = 20):
    try:
        response = supabase.table("operator_reviews").select(
            "id, rating, title, comment, created_at, helpful_count"
        ).eq("operator_name", operator_name).eq("status", "approved").order("created_at", desc=True).limit(limit).execute()

        ratings = [r["rating"] for r in response.data]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        return {"reviews": response.data, "total": len(response.data), "average_rating": round(avg_rating, 1), "operator_name": operator_name}
    except Exception as e:
        log_security_event("REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")


@router.get("/reviews/my")
async def get_my_reviews(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("operator_reviews").select(
            "id, operator_name, rating, title, comment, status, created_at"
        ).eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return {"reviews": response.data, "total": len(response.data)}
    except Exception as e:
        log_security_event("MY_REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    try:
        supabase.table("operator_reviews").delete().eq("id", review_id).eq("user_id", user["id"]).execute()
        return {"message": "Yorum silindi", "review_id": review_id}
    except Exception as e:
        log_security_event("REVIEW_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Yorum silinirken hata oluştu")


# ===== IN-APP NOTIFICATIONS =====

@router.get("/notifications/my")
async def get_my_notifications(page: int = 0, user: dict = Depends(get_current_user)):
    try:
        offset = page * 20
        result = supabase.table("user_notifications").select("*", count="exact").eq("user_id", user['id']).order("created_at", desc=True).range(offset, offset + 19).execute()
        return {"data": result.data or [], "total": result.count or 0, "page": page}
    except Exception:
        raise HTTPException(status_code=500, detail="Bildirimler yüklenemedi")


@router.get("/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("user_notifications").select("id", count="exact").eq("user_id", user['id']).eq("is_read", False).execute()
        return {"count": result.count or 0}
    except Exception:
        return {"count": 0}


@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    try:
        supabase.table("user_notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", user['id']).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Bildirim güncellenemedi")


@router.patch("/notifications/mark-all-read")
async def mark_all_read(user: dict = Depends(get_current_user)):
    try:
        supabase.table("user_notifications").update({"is_read": True}).eq("user_id", user['id']).eq("is_read", False).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Bildirimler güncellenemedi")
