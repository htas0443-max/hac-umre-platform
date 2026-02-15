"""
Operator Routes — Operator tours, stats, license, reviews
"""

from fastapi import APIRouter, Request, Depends, UploadFile, File
from dependencies import (
    supabase, limiter, log_security_event,
    get_current_user, require_operator,
    TourCreate, TourUpdate,
    HTTPException, Optional,
)

router = APIRouter(prefix="/api/operator", tags=["operator"])


@router.get("/tours")
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

        count_query = supabase.table("tours").select("id", count="exact").eq("operator_id", user["id"])
        if status:
            count_query = count_query.eq("status", status)
        count_response = count_query.execute()

        return {"tours": response.data, "total": count_response.count, "skip": skip, "limit": limit}
    except Exception as e:
        log_security_event("OPERATOR_TOURS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Turlar yüklenirken bir hata oluştu")


@router.post("/tours")
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
        tour_data["status"] = "pending"

        response = supabase.table("tours").insert(tour_data).execute()

        return {"message": "Tur başarıyla oluşturuldu ve onay bekliyor", "tour_id": response.data[0]["id"]}
    except Exception as e:
        log_security_event("OPERATOR_TOUR_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur oluşturulurken bir hata oluştu")


@router.put("/tours/{tour_id}")
async def update_operator_tour(tour_id: int, tour_update: TourUpdate, user: dict = Depends(require_operator)):
    """Operatör kendi turunu günceller - IDOR Protected"""
    try:
        existing = supabase.table("tours").select("operator_id").eq("id", tour_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")
        if existing.data[0]["operator_id"] != user["id"]:
            log_security_event("IDOR_ATTEMPT", {
                "user_id": user["id"], "target_tour_id": tour_id, "action": "update"
            }, "CRITICAL")
            raise HTTPException(status_code=403, detail="Bu turu düzenleme yetkiniz yok")

        update_data = {k: v for k, v in tour_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek alan yok")

        update_data["status"] = "pending"
        response = supabase.table("tours").update(update_data).eq("id", tour_id).eq("operator_id", user["id"]).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı veya yetkiniz yok")

        return {"message": "Tur başarıyla güncellendi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Güncelleme hatası")


@router.get("/stats")
async def get_operator_stats(user: dict = Depends(require_operator)):
    """Operatörün tur istatistiklerini getirir (RPC)"""
    try:
        response = supabase.rpc('get_operator_stats', {'operator_user_id': user['id']}).execute()
        stats = response.data
        if stats:
            stats['company_name'] = user.get('company_name')
        return stats
    except Exception as e:
        log_security_event("OPERATOR_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="İstatistikler alınırken bir hata oluştu")


# ===== OPERATOR LICENSE =====

@router.post("/license/upload")
async def upload_license(file: UploadFile = File(...), license_number: str = "", user: dict = Depends(require_operator)):
    """Operator devlet onaylı izin belgesi yükler - Enhanced Security"""
    from security import validate_file_upload

    try:
        contents = await file.read()
        validate_file_upload(
            filename=file.filename, content_type=file.content_type,
            file_size=len(contents), file_content=contents, max_size=5 * 1024 * 1024
        )

        bucket_name = 'license-documents-private'
        file_path = f"{user['id']}/license_{user['id']}.{file.filename.split('.')[-1]}"

        try:
            supabase.storage.from_(bucket_name).upload(
                file_path, contents, {'content-type': file.content_type, 'upsert': True}
            )
        except Exception as storage_error:
            log_security_event("PRIVATE_BUCKET_FALLBACK", {"error": str(storage_error), "user_id": user['id']}, "WARN")
            bucket_name = 'license-documents'
            supabase.storage.from_(bucket_name).upload(
                file_path, contents, {'content-type': file.content_type, 'upsert': True}
            )

        if bucket_name == 'license-documents-private':
            signed_url_response = supabase.storage.from_(bucket_name).create_signed_url(file_path, expires_in=3600)
            document_url = signed_url_response.get('signedURL', '')
        else:
            document_url = supabase.storage.from_(bucket_name).get_public_url(file_path)

        supabase.table("users").update({
            "license_document_url": document_url,
            "license_document_path": file_path,
            "license_bucket": bucket_name,
            "license_number": license_number,
            "license_verified": False
        }).eq("id", user["id"]).execute()

        log_security_event("LICENSE_UPLOAD_SUCCESS", {"user_id": user["id"], "bucket": bucket_name, "file_size": len(contents)})

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


@router.get("/license/status")
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


# ===== OPERATOR REVIEWS =====

@router.get("/reviews")
async def get_operator_own_reviews(user: dict = Depends(get_current_user)):
    """Operatör: Kendi firmasına ait yorumları görür"""
    try:
        if user.get("role") not in ["operator", "admin"]:
            raise HTTPException(status_code=403, detail="Bu işlem için operatör yetkisi gerekli")

        user_response = supabase.table("users").select("company_name").eq("id", user["id"]).execute()
        if not user_response.data or not user_response.data[0].get("company_name"):
            raise HTTPException(status_code=400, detail="Firma adı tanımlı değil")

        operator_name = user_response.data[0]["company_name"]

        response = supabase.table("operator_reviews").select(
            "id, rating, title, comment, status, created_at, helpful_count"
        ).eq("operator_name", operator_name).order("created_at", desc=True).execute()

        reviews = response.data
        approved_reviews = [r for r in reviews if r["status"] == "approved"]
        ratings = [r["rating"] for r in approved_reviews]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        status_counts = {
            "approved": len([r for r in reviews if r["status"] == "approved"]),
            "pending": len([r for r in reviews if r["status"] == "pending"]),
            "rejected": len([r for r in reviews if r["status"] == "rejected"]),
        }

        return {
            "operator_name": operator_name,
            "reviews": reviews, "total": len(reviews),
            "average_rating": avg_rating, "status_counts": status_counts
        }
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("OPERATOR_REVIEWS_FETCH_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")
