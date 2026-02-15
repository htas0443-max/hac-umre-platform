"""
Admin Routes — Tour approval, user management, settings, audit, feature flags,
notifications, file manager, licenses, agency analytics, rollback
"""

from fastapi import APIRouter, Request, Depends, UploadFile, File
from dependencies import (
    supabase, limiter, log_security_event,
    require_admin, require_super_admin,
    write_audit_log, log_admin_action,
    send_user_notification, queue_email,
    NotificationCreate, SettingsUpdate, ScheduledActionCreate,
    ReviewModerate,
    HTTPException, Optional, Dict, Any, datetime, timedelta,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============================================
# TOUR APPROVAL / REJECTION
# ============================================

@router.put("/tours/{tour_id}/approve")
async def approve_tour(tour_id: int, request: Request, user: dict = Depends(require_admin)):
    """Admin turu onaylar (RPC)"""
    try:
        response = supabase.rpc('approve_tour', {
            'tour_id_param': tour_id, 'admin_id': user['id'],
            'approval_reason_param': 'Approved by admin'
        }).execute()

        await write_audit_log(request, user["id"], "admin", "tour.approve", "tour", tour_id)

        try:
            tour_data = supabase.table("tours").select("user_id, title, operator").eq("id", tour_id).single().execute()
            if tour_data.data and tour_data.data.get('user_id'):
                op_id = tour_data.data['user_id']
                tour_title = tour_data.data.get('title', f'Tur #{tour_id}')
                await send_user_notification(op_id, "Tur Onaylandı ✅", f"\"{tour_title}\" turunuz onaylandı ve yayında!", "success", "/operator/tours")
                op_info = supabase.table("users").select("email").eq("id", op_id).single().execute()
                if op_info.data and op_info.data.get('email'):
                    await queue_email(
                        op_info.data['email'],
                        f"Turunuz Onaylandı: {tour_title}",
                        f"<h2>Turunuz Onaylandı ✅</h2><p><strong>{tour_title}</strong> turunuz admin tarafından onaylanmıştır ve artık platformda yayındadır.</p><p>Hac & Umre Platformu</p>"
                    )
        except Exception:
            pass

        return response.data
    except Exception as e:
        log_security_event("TOUR_APPROVE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur onaylanırken bir hata oluştu")


@router.put("/tours/{tour_id}/reject")
async def reject_tour(tour_id: int, reason: str, request: Request, user: dict = Depends(require_admin)):
    """Admin turu reddeder (RPC)"""
    try:
        response = supabase.rpc('reject_tour', {
            'tour_id_param': tour_id, 'admin_id': user['id'],
            'rejection_reason_param': reason
        }).execute()

        await write_audit_log(request, user["id"], "admin", "tour.reject", "tour", tour_id, {"reason": reason})

        try:
            tour_data = supabase.table("tours").select("user_id, title, operator").eq("id", tour_id).single().execute()
            if tour_data.data and tour_data.data.get('user_id'):
                op_id = tour_data.data['user_id']
                tour_title = tour_data.data.get('title', f'Tur #{tour_id}')
                await send_user_notification(op_id, "Tur Reddedildi ❌", f"\"{tour_title}\" turunuz reddedildi. Sebep: {reason}", "error", "/operator/tours")
                op_info = supabase.table("users").select("email").eq("id", op_id).single().execute()
                if op_info.data and op_info.data.get('email'):
                    await queue_email(
                        op_info.data['email'],
                        f"Turunuz Reddedildi: {tour_title}",
                        f"<h2>Turunuz Reddedildi ❌</h2><p><strong>{tour_title}</strong> turunuz reddedilmiştir.</p><p><strong>Sebep:</strong> {reason}</p><p>Düzenleyip tekrar gönderebilirsiniz.</p><p>Hac & Umre Platformu</p>"
                    )
        except Exception:
            pass

        return response.data
    except Exception as e:
        log_security_event("TOUR_REJECT_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Tur reddedilirken bir hata oluştu")


# ============================================
# AUDIT LOGS
# ============================================

@router.get("/audit-logs")
async def get_audit_logs(
    user: dict = Depends(require_admin),
    skip: int = 0, limit: int = 20,
    role: Optional[str] = None, action: Optional[str] = None,
    date_from: Optional[str] = None, date_to: Optional[str] = None,
):
    """Audit loglarını listeler"""
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

        return {"logs": response.data, "total": count_response.count or 0, "skip": skip, "limit": limit}
    except Exception as e:
        log_security_event("AUDIT_LOG_QUERY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Audit logları alınırken hata oluştu")


@router.get("/audit-history")
async def get_audit_history(
    page: int = 0, page_size: int = 20,
    action: str = None, role: str = None, user_id: str = None,
    user: dict = Depends(require_admin)
):
    """Paginated audit log history with filters"""
    try:
        query = supabase.table("audit_logs").select("*", count="exact").order("created_at", desc=True)
        if action:
            query = query.eq("action", action)
        if role:
            query = query.eq("role", role)
        if user_id:
            query = query.eq("user_id", user_id)

        offset = page * page_size
        query = query.range(offset, offset + page_size - 1)
        result = query.execute()

        return {"data": result.data or [], "total": result.count or 0, "page": page, "page_size": page_size}
    except Exception as e:
        log_security_event("AUDIT_HISTORY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Audit geçmişi yüklenemedi")


# ============================================
# AGENCY ANALYTICS
# ============================================

@router.get("/agency-analytics")
async def get_agency_analytics(user: dict = Depends(require_admin)):
    """Ajanta bazlı analytics"""
    try:
        response = supabase.table("tours").select(
            "operator_id, operator, status, created_at"
        ).not_.is_("operator_id", "null").execute()

        agency_map: Dict[str, dict] = {}
        for tour in response.data:
            oid = tour.get("operator_id")
            if not oid:
                continue
            if oid not in agency_map:
                agency_map[oid] = {
                    "agency_id": oid, "agency_name": tour.get("operator", "İsimsiz"),
                    "total_tours": 0, "approved_tours": 0, "pending_tours": 0,
                    "rejected_tours": 0, "last_activity": tour.get("created_at", ""),
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
            created = tour.get("created_at", "")
            if created > stats["last_activity"]:
                stats["last_activity"] = created

        agencies = sorted(agency_map.values(), key=lambda x: x["total_tours"], reverse=True)
        return {"agencies": agencies}
    except Exception as e:
        log_security_event("AGENCY_ANALYTICS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Analytics verileri alınırken hata oluştu")


# ============================================
# LICENSES
# ============================================

@router.get("/licenses/pending")
async def get_pending_licenses(user: dict = Depends(require_admin)):
    """Onay bekleyen license belgelerini listeler"""
    try:
        response = supabase.rpc('get_operators_pending_verification').execute()
        return {"operators": response.data}
    except Exception as e:
        log_security_event("PENDING_LICENSES_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Liste alınırken bir hata oluştu")


@router.post("/licenses/verify/{operator_id}")
async def verify_license(operator_id: str, verified: bool, license_number: str = "", request: Request = None, user: dict = Depends(require_admin)):
    """Admin operator license'ını onaylar/reddeder"""
    try:
        response = supabase.rpc('verify_operator_license', {
            'operator_id_param': operator_id, 'admin_id': user['id'],
            'verified': verified, 'license_number_param': license_number if license_number else None
        }).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'),
            action='license_verified' if verified else 'license_rejected',
            entity='operator_license', entity_id=operator_id,
            details={'verified': verified, 'license_number': license_number}
        )

        return response.data
    except Exception as e:
        log_security_event("LICENSE_VERIFY_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=400, detail="Lisans doğrulanırken bir hata oluştu")


# ============================================
# USER MANAGEMENT
# ============================================

def _calculate_user_impact(user_id: str) -> dict:
    impact = {"affected_tours": 0, "affected_favorites": 0, "affected_reviews": 0, "tour_titles": []}
    try:
        tours = supabase.table("tours").select("id, title").eq("operator_id", user_id).in_("status", ["approved", "pending"]).execute()
        if tours.data:
            impact["affected_tours"] = len(tours.data)
            impact["tour_titles"] = [t["title"] for t in tours.data[:5]]
    except Exception:
        pass
    try:
        favs = supabase.table("favorites").select("id", count="exact").eq("user_id", user_id).execute()
        impact["affected_favorites"] = favs.count or 0
    except Exception:
        pass
    try:
        reviews = supabase.table("reviews").select("id", count="exact").eq("user_id", user_id).execute()
        impact["affected_reviews"] = reviews.count or 0
    except Exception:
        pass
    return impact


@router.patch("/users/{user_id}/suspend")
async def suspend_user(user_id: str, request: Request, dry_run: bool = False, user: dict = Depends(require_admin)):
    """Kullanıcıyı askıya al (soft ban). dry_run=true ile etki analizi döner."""
    try:
        if user_id == user['id']:
            raise HTTPException(status_code=400, detail="Kendinizi askıya alamazsınız")

        profile = supabase.table("users").select("id, email, user_role, status").eq("id", user_id).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

        target_user = profile.data[0]
        if target_user.get('status') == 'suspended':
            raise HTTPException(status_code=400, detail="Kullanıcı zaten askıda")
        if target_user.get('user_role') in ['admin', 'super_admin'] and user.get('user_role') != 'super_admin':
            raise HTTPException(status_code=403, detail="Admin kullanıcıları sadece super admin askıya alabilir")

        impact = _calculate_user_impact(user_id)

        if dry_run:
            return {
                "dry_run": True, "user_id": user_id,
                "target_email": target_user.get('email'),
                "target_role": target_user.get('user_role'),
                "impact": impact, "message": "Bu işlem uygulanmadı. Onay bekliyor."
            }

        supabase.table("users").update({"status": "suspended"}).eq("id", user_id).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='user_suspended',
            entity='user', entity_id=user_id,
            details={'target_email': target_user.get('email'), 'impact': impact},
            previous_data={'status': target_user.get('status', 'active')},
            new_data={'status': 'suspended'}
        )

        return {"dry_run": False, "success": True, "user_id": user_id, "status": "suspended", "impact": impact, "message": "Kullanıcı askıya alındı"}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("USER_SUSPEND_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanıcı askıya alınırken bir hata oluştu")


@router.patch("/users/{user_id}/activate")
async def activate_user(user_id: str, request: Request, user: dict = Depends(require_admin)):
    """Askıya alınmış kullanıcıyı aktifleştirir."""
    try:
        profile = supabase.table("users").select("id, email, status, user_role").eq("id", user_id).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

        target_user = profile.data[0]
        if target_user.get('status', 'active') == 'active':
            raise HTTPException(status_code=400, detail="Kullanıcı zaten aktif")

        supabase.table("users").update({"status": "active"}).eq("id", user_id).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='user_activated',
            entity='user', entity_id=user_id,
            details={'target_email': target_user.get('email')},
            previous_data={'status': target_user.get('status', 'suspended')},
            new_data={'status': 'active'}
        )

        return {"success": True, "user_id": user_id, "status": "active", "message": "Kullanıcı aktifleştirildi"}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("USER_ACTIVATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Kullanıcı aktifleştirilirken bir hata oluştu")


@router.post("/users/{user_id}/toggle-status")
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
# PLATFORM SETTINGS
# ============================================

CRITICAL_SETTINGS = ['maintenance_mode', 'registration_enabled', 'auto_approve_tours']

@router.get("/settings")
async def get_settings(user: dict = Depends(require_admin)):
    """Platform ayarlarını getirir"""
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


@router.put("/settings")
async def update_settings(data: SettingsUpdate, request: Request, dry_run: bool = False, user: dict = Depends(require_admin)):
    """Platform ayarlarını günceller. dry_run=true ile değişiklikleri önizler."""
    try:
        for key in data.settings:
            if key in CRITICAL_SETTINGS and user.get('user_role') != 'super_admin':
                raise HTTPException(status_code=403, detail=f"'{key}' ayarını değiştirmek için super admin yetkisi gerekli")

        current = {}
        try:
            result = supabase.table("platform_settings").select("key, value").execute()
            if result.data:
                for row in result.data:
                    current[row['key']] = row['value']
        except Exception:
            pass

        changes = []
        for key, new_value in data.settings.items():
            old_value = current.get(key)
            if old_value != new_value:
                changes.append({"key": key, "old_value": old_value, "new_value": new_value, "is_critical": key in CRITICAL_SETTINGS})

        if dry_run:
            return {
                "dry_run": True, "changes": changes,
                "total_changes": len(changes),
                "critical_changes": sum(1 for c in changes if c['is_critical']),
                "message": "Bu değişiklikler henüz uygulanmadı."
            }

        for key, value in data.settings.items():
            supabase.table("platform_settings").upsert({"key": key, "value": value}, on_conflict="key").execute()

        old_settings = {c['key']: c['old_value'] for c in changes}
        new_settings = {c['key']: c['new_value'] for c in changes}
        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='settings_updated',
            entity='platform_settings',
            details={'changed_keys': list(data.settings.keys()), 'changes': changes},
            previous_data=old_settings, new_data=new_settings
        )

        return {"dry_run": False, "success": True, "message": "Ayarlar kaydedildi", "changes": changes}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("SETTINGS_UPDATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Ayarlar kaydedilirken bir hata oluştu")


# ============================================
# ROLLBACK (super_admin only)
# ============================================

ROLLBACK_ELIGIBLE_ACTIONS = ['user_suspended', 'user_activated', 'settings_updated', 'feature_flag_updated']

@router.post("/rollback/{audit_id}")
async def rollback_action(audit_id: str, request: Request, user: dict = Depends(require_super_admin)):
    """Audit kaydındaki previous_data ile işlemi geri alır. Sadece super_admin."""
    try:
        record = supabase.table("audit_logs").select("*").eq("id", audit_id).execute()
        if not record.data:
            raise HTTPException(status_code=404, detail="Audit kaydı bulunamadı")

        audit = record.data[0]
        if audit.get('is_rollback'):
            raise HTTPException(status_code=400, detail="Bu kayıt zaten bir rollback işlemidir")
        if audit['action'] not in ROLLBACK_ELIGIBLE_ACTIONS:
            raise HTTPException(status_code=400, detail=f"'{audit['action']}' işlemi geri alınamaz")

        previous_data = audit.get('previous_data', {})
        if not previous_data:
            raise HTTPException(status_code=400, detail="Geri alınacak veri bulunamadı (previous_data boş)")

        entity = audit.get('entity')
        entity_id = audit.get('entity_id')

        if entity == 'user' and entity_id:
            supabase.table("users").update(previous_data).eq("id", entity_id).execute()
        elif entity == 'platform_settings':
            for key, value in previous_data.items():
                supabase.table("platform_settings").upsert({"key": key, "value": value}, on_conflict="key").execute()
        elif entity == 'feature_flag' and entity_id:
            supabase.table("feature_flags").update(previous_data).eq("key", entity_id).execute()
        else:
            raise HTTPException(status_code=400, detail="Bilinmeyen entity türü")

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'super_admin'),
            action=f"rollback_{audit['action']}", entity=entity, entity_id=entity_id,
            details={'rolled_back_audit_id': audit_id},
            previous_data=audit.get('new_data', {}), new_data=previous_data
        )

        try:
            supabase.table("audit_logs").update({"is_rollback": True}).eq("id", audit_id).execute()
        except Exception:
            pass

        return {"success": True, "message": f"'{audit['action']}' işlemi geri alındı", "rolled_back_data": previous_data}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("ROLLBACK_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Rollback işlemi başarısız")


# ============================================
# FEATURE FLAGS
# ============================================

@router.get("/feature-flags")
async def get_feature_flags(user: dict = Depends(require_admin)):
    """Tüm feature flag'leri listeler"""
    try:
        result = supabase.table("feature_flags").select("*").order("key").execute()
        return {"flags": result.data or []}
    except Exception as e:
        log_security_event("FEATURE_FLAGS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Feature flags yüklenemedi")


@router.patch("/feature-flags/{key}")
async def toggle_feature_flag(key: str, request: Request, user: dict = Depends(require_admin)):
    """Feature flag aç/kapat"""
    try:
        existing = supabase.table("feature_flags").select("*").eq("key", key).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail=f"Feature flag '{key}' bulunamadı")

        current = existing.data[0]
        new_enabled = not current['enabled']

        supabase.table("feature_flags").update({
            "enabled": new_enabled, "updated_by": user['id'],
            "updated_at": datetime.utcnow().isoformat()
        }).eq("key", key).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='feature_flag_updated',
            entity='feature_flag', entity_id=key,
            details={'flag_key': key},
            previous_data={'enabled': current['enabled']}, new_data={'enabled': new_enabled}
        )

        return {"success": True, "key": key, "enabled": new_enabled, "message": f"'{key}' {'aktif' if new_enabled else 'devre dışı'}"}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("FEATURE_FLAG_TOGGLE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Feature flag güncellenemedi")


# ============================================
# NOTIFICATIONS / ANNOUNCEMENTS
# ============================================

@router.get("/notifications")
async def get_notifications(user: dict = Depends(require_admin)):
    """Duyuruları listeler"""
    try:
        result = supabase.table("notifications").select("*").order("created_at", desc=True).limit(50).execute()
        return {"notifications": result.data or []}
    except Exception as e:
        log_security_event("NOTIFICATIONS_GET_ERROR", {"error": str(e)}, "ERROR")
        return {"notifications": []}


@router.post("/notifications")
async def create_notification(data: NotificationCreate, request: Request, user: dict = Depends(require_admin)):
    """Yeni duyuru oluşturur"""
    try:
        if data.target_role not in ['all', 'user', 'operator']:
            raise HTTPException(status_code=400, detail="Geçersiz hedef kitle")

        result = supabase.table("notifications").insert({
            "title": data.title, "message": data.message,
            "target_role": data.target_role, "created_by": user['id'],
        }).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='notification_created',
            entity='notification', details={'title': data.title, 'target_role': data.target_role}
        )

        return {"success": True, "notification": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("NOTIFICATION_CREATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Duyuru oluşturulurken bir hata oluştu")


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, request: Request, user: dict = Depends(require_admin)):
    """Duyuru siler"""
    try:
        supabase.table("notifications").delete().eq("id", notification_id).execute()
        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='notification_deleted',
            entity='notification', entity_id=notification_id
        )
        return {"success": True, "message": "Duyuru silindi"}
    except Exception as e:
        log_security_event("NOTIFICATION_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Duyuru silinirken bir hata oluştu")


# ============================================
# FILE MANAGER (Supabase Storage)
# ============================================

ADMIN_FILES_BUCKET = "admin-documents"
ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/csv"]
MAX_FILE_SIZE = 10 * 1024 * 1024

@router.post("/files/upload")
@limiter.limit("20/minute")
async def admin_upload_file(request: Request, file: UploadFile = File(...), category: str = "general", user: dict = Depends(require_admin)):
    """Admin dosya yükleme"""
    try:
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya tipi: {file.content_type}")

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'ı aşamaz")

        import uuid
        safe_name = f"{category}/{uuid.uuid4().hex}_{file.filename}"

        supabase.storage.from_(ADMIN_FILES_BUCKET).upload(
            path=safe_name, file=contents,
            file_options={"content-type": file.content_type}
        )

        log_security_event("ADMIN_FILE_UPLOAD", {"admin": user.get("email"), "file": safe_name, "size": len(contents), "category": category})

        return {"success": True, "file_path": safe_name, "file_name": file.filename, "file_size": len(contents), "content_type": file.content_type, "category": category}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("ADMIN_FILE_UPLOAD_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya yüklenirken bir hata oluştu")


@router.get("/files")
async def admin_list_files(category: str = "general", user: dict = Depends(require_admin)):
    """Admin dosya listesi"""
    try:
        files = supabase.storage.from_(ADMIN_FILES_BUCKET).list(
            path=category,
            options={"limit": 100, "sortBy": {"column": "created_at", "order": "desc"}}
        )

        file_list = []
        for f in files:
            if f.get("name") and not f["name"].startswith("."):
                file_list.append({
                    "id": f.get("id"), "name": f.get("name"),
                    "size": f.get("metadata", {}).get("size", 0),
                    "content_type": f.get("metadata", {}).get("mimetype", ""),
                    "created_at": f.get("created_at"), "updated_at": f.get("updated_at"),
                    "category": category, "path": f"{category}/{f.get('name')}"
                })

        return {"files": file_list}
    except Exception as e:
        log_security_event("ADMIN_FILE_LIST_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya listesi alınırken bir hata oluştu")


@router.delete("/files")
async def admin_delete_file(file_path: str, user: dict = Depends(require_admin)):
    """Admin dosya silme"""
    try:
        supabase.storage.from_(ADMIN_FILES_BUCKET).remove([file_path])
        log_security_event("ADMIN_FILE_DELETE", {"admin": user.get("email"), "file": file_path})
        return {"success": True, "deleted": file_path}
    except Exception as e:
        log_security_event("ADMIN_FILE_DELETE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya silinirken bir hata oluştu")


@router.get("/files/url")
async def admin_get_file_url(file_path: str, user: dict = Depends(require_admin)):
    """Admin dosya URL'i — Signed URL (1 saat geçerli)"""
    try:
        signed = supabase.storage.from_(ADMIN_FILES_BUCKET).create_signed_url(path=file_path, expires_in=3600)
        return {"url": signed.get("signedURL") or signed.get("signedUrl", "")}
    except Exception as e:
        log_security_event("ADMIN_FILE_URL_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Dosya URL'i oluşturulurken bir hata oluştu")


# ============================================
# REVIEW MODERATION
# ============================================

@router.get("/reviews")
async def get_admin_reviews(status: str = "pending", user: dict = Depends(require_admin)):
    """Admin: Yorumları listeler"""
    try:
        result = supabase.table("operator_reviews").select("*").eq("status", status).order("created_at", desc=True).execute()
        return {"reviews": result.data or [], "total": len(result.data or [])}
    except Exception as e:
        log_security_event("ADMIN_REVIEWS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorumlar yüklenirken hata oluştu")


@router.patch("/reviews/{review_id}")
async def moderate_review(review_id: str, data: ReviewModerate, request: Request, user: dict = Depends(require_admin)):
    """Admin: Yorum onayla/reddet"""
    try:
        if data.status not in ["approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Geçersiz durum")

        update_data = {"status": data.status, "moderated_by": user["id"], "moderated_at": datetime.utcnow().isoformat()}
        if data.rejection_reason:
            update_data["rejection_reason"] = data.rejection_reason

        supabase.table("operator_reviews").update(update_data).eq("id", review_id).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action=f'review_{data.status}',
            entity='review', entity_id=review_id,
            details={'status': data.status, 'rejection_reason': data.rejection_reason}
        )

        return {"success": True, "message": f"Yorum {'onaylandı' if data.status == 'approved' else 'reddedildi'}"}
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("REVIEW_MODERATE_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Yorum moderasyon hatası")


# ============================================
# SCHEDULED ACTIONS
# ============================================

@router.get("/scheduled-actions")
async def get_scheduled_actions(status_filter: str = "pending", user: dict = Depends(require_admin)):
    """Zamanlanmış aksiyonları listele"""
    try:
        query = supabase.table("scheduled_actions").select("*", count="exact").order("scheduled_at", desc=False)
        if status_filter:
            query = query.eq("status", status_filter)
        result = query.limit(100).execute()
        return {"data": result.data or [], "total": result.count or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Zamanlanmış aksiyonlar yüklenemedi")


@router.post("/scheduled-actions")
async def create_scheduled_action(data: ScheduledActionCreate, request: Request, user: dict = Depends(require_admin)):
    """Yeni zamanlanmış aksiyon oluştur"""
    try:
        result = supabase.table("scheduled_actions").insert({
            "action_type": data.action_type, "entity": data.entity,
            "entity_id": data.entity_id, "payload": data.payload,
            "scheduled_at": data.scheduled_at, "created_by": user['id'],
        }).execute()

        await write_audit_log(
            request=request, user_id=user['id'],
            role=user.get('user_role', 'admin'), action='scheduled_action_created',
            entity=data.entity, entity_id=data.entity_id,
            details={'action_type': data.action_type, 'scheduled_at': data.scheduled_at}
        )

        return {"success": True, "data": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Zamanlanmış aksiyon oluşturulamadı")


@router.delete("/scheduled-actions/{action_id}")
async def cancel_scheduled_action(action_id: str, user: dict = Depends(require_admin)):
    """Zamanlanmış aksiyonu iptal et"""
    try:
        supabase.table("scheduled_actions").update({"status": "cancelled"}).eq("id", action_id).eq("status", "pending").execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Aksiyon iptal edilemedi")


# ============================================
# OPERATOR PERFORMANCE
# ============================================

@router.get("/operator-performance")
async def get_operator_performance(user: dict = Depends(require_admin)):
    """Operatör performans metrikleri — Batch queries"""
    try:
        operators = supabase.table("users").select("id, email, company_name, created_at").eq("user_role", "operator").execute()
        op_ids = [op['id'] for op in (operators.data or [])]
        if not op_ids:
            return {"operators": []}

        all_tours = supabase.table("tours").select("user_id, status").in_("user_id", op_ids).execute()
        tours_by_op: dict = {}
        for t in (all_tours.data or []):
            uid = t['user_id']
            if uid not in tours_by_op:
                tours_by_op[uid] = []
            tours_by_op[uid].append(t)

        all_reviews_data = []
        try:
            all_reviews = supabase.table("reviews").select("operator_id, rating").in_("operator_id", op_ids).execute()
            all_reviews_data = all_reviews.data or []
        except Exception:
            pass

        reviews_by_op: dict = {}
        for r in all_reviews_data:
            oid = r.get('operator_id')
            if oid:
                if oid not in reviews_by_op:
                    reviews_by_op[oid] = []
                reviews_by_op[oid].append(r)

        performance = []
        for op in (operators.data or []):
            op_id = op['id']
            op_tours = tours_by_op.get(op_id, [])
            total_tours = len(op_tours)
            approved = sum(1 for t in op_tours if t.get('status') == 'approved')
            rejected = sum(1 for t in op_tours if t.get('status') == 'rejected')

            op_reviews = reviews_by_op.get(op_id, [])
            ratings = [r['rating'] for r in op_reviews if r.get('rating')]
            avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

            performance.append({
                "id": op_id, "email": op['email'],
                "company_name": op.get('company_name', ''),
                "total_tours": total_tours, "approved_tours": approved, "rejected_tours": rejected,
                "approval_rate": round((approved / total_tours * 100), 1) if total_tours else 0,
                "avg_rating": avg_rating, "joined_at": op['created_at'],
            })

        performance.sort(key=lambda x: x['approval_rate'], reverse=True)
        return {"operators": performance}
    except Exception as e:
        log_security_event("OPERATOR_PERF_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Operatör performansı yüklenemedi")


# ============================================
# SYSTEM INFO
# ============================================

@router.get("/system-info")
async def get_system_info(user: dict = Depends(require_admin)):
    """Sistem bilgisi"""
    import os
    try:
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
