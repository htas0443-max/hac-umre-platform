"""
Tour Routes — Public tour listing, CRUD, CSV import
"""

from fastapi import APIRouter, Request, Depends, UploadFile, File
from dependencies import (
    supabase, limiter, log_security_event,
    get_current_user, require_admin, log_admin_action, write_audit_log,
    TourCreate, TourUpdate,
    HTTPException, Optional, csv, io,
)

router = APIRouter(prefix="/api", tags=["tours"])


@router.get("/tours")
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

        if status:
            query = query.eq("status", status)
        else:
            query = query.eq("status", "approved")

        if min_price is not None:
            query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lte("price", max_price)
        if operator:
            query = query.ilike("operator", f"%{operator}%")

        ascending = sort_order == "asc"
        query = query.order(sort_by, desc=not ascending)
        query = query.range(skip, skip + limit - 1)

        response = query.execute()

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


@router.get("/tours/{tour_id}")
async def get_tour(tour_id: int):
    """Tek bir turu getirir - SECURITY: Only approved tours visible"""
    try:
        response = supabase.table("tours").select("*").eq("id", tour_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")

        tour = response.data[0]
        if tour.get("status") != "approved":
            raise HTTPException(status_code=404, detail="Tur bulunamadı")

        return tour
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Tur getirme hatası")


@router.post("/tours")
async def create_tour(tour: TourCreate, request: Request, user: dict = Depends(require_admin)):
    """Yeni tur oluşturur (Admin)"""
    try:
        tour_data = tour.dict()
        tour_data["operator_id"] = user["id"]
        tour_data["created_by"] = user["email"]

        response = supabase.table("tours").insert(tour_data).execute()

        await log_admin_action(request, user["id"], "CREATE_TOUR", {"tour_id": response.data[0]["id"], "title": tour.title})

        return {"message": "Tur başarıyla oluşturuldu", "tour_id": response.data[0]["id"]}
    except Exception as e:
        log_security_event("TOUR_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur oluşturulurken bir hata oluştu")


@router.put("/tours/{tour_id}")
async def update_tour(tour_id: int, tour_update: TourUpdate, request: Request, user: dict = Depends(require_admin)):
    """Turu günceller (Admin)"""
    try:
        update_data = {k: v for k, v in tour_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek alan yok")

        response = supabase.table("tours").update(update_data).eq("id", tour_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")

        await log_admin_action(request, user["id"], "UPDATE_TOUR", {"tour_id": tour_id, "updates": list(update_data.keys())})

        return {"message": "Tur başarıyla güncellendi"}
    except Exception as e:
        log_security_event("TOUR_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur güncellenirken bir hata oluştu")


@router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: int, request: Request, user: dict = Depends(require_admin)):
    """Turu siler (Admin)"""
    try:
        response = supabase.table("tours").delete().eq("id", tour_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Tur bulunamadı")

        await log_admin_action(request, user["id"], "DELETE_TOUR", {"tour_id": tour_id})

        return {"message": "Tur başarıyla silindi"}
    except Exception as e:
        log_security_event("TOUR_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur silinirken bir hata oluştu")


# CSV Import
@router.post("/import/csv")
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
                    "status": "approved"
                }

                supabase.table("tours").insert(tour_doc).execute()
                imported_count += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)})

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
