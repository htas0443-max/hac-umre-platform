"""
Monitoring Routes — Health check, uptime, rate limiting, email queue
Also includes public feature flags endpoint
"""

from fastapi import APIRouter, Request, Depends
from dependencies import (
    supabase, limiter, log_security_event,
    require_admin, send_user_notification,
    HTTPException, Optional, os, datetime, timedelta, asyncio,
)
import time as _time
import httpx

router = APIRouter(tags=["monitoring"])

# ============================================
# HEALTH CHECK
# ============================================

@router.get("/api/health")
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


# ============================================
# PUBLIC FEATURE FLAGS (no auth)
# ============================================

@router.get("/api/feature-flags/public")
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


# ============================================
# UPTIME / SLA MONITORING
# ============================================

HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", "60"))
ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")
ALERT_EMAIL = os.getenv("ALERT_EMAIL", "")
_consecutive_failures = 0


async def _run_health_check_and_log():
    """Internal health check for SLA monitoring"""
    global _consecutive_failures
    start = _time.time()
    db_ok = False
    auth_ok = False
    error_msg = None

    try:
        r = supabase.table("tours").select("id").limit(1).execute()
        db_ok = True
    except Exception as e:
        error_msg = f"DB: {str(e)[:100]}"

    try:
        r = supabase.auth.admin.list_users(per_page=1, page=1)
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

    try:
        supabase.table("uptime_logs").insert({
            "status": status, "response_time_ms": response_time,
            "db_ok": db_ok, "auth_ok": auth_ok,
            "error_message": error_msg,
            "consecutive_failures": _consecutive_failures,
        }).execute()
    except Exception:
        pass

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
                if "telegram" in ALERT_WEBHOOK_URL.lower():
                    await client.post(ALERT_WEBHOOK_URL, json={
                        "text": f"[{level}] Hac & Umre Platform\n{message}\n{datetime.utcnow().isoformat()}"
                    })
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


@router.get("/api/admin/uptime/stats")
async def get_uptime_stats(user: dict = Depends(require_admin)):
    """SLA metrikleri"""
    try:
        now = datetime.utcnow()

        day_ago = (now - timedelta(hours=24)).isoformat()
        day_result = supabase.table("uptime_logs").select("status, response_time_ms", count="exact").gte("checked_at", day_ago).execute()
        day_total = day_result.count or 0
        day_ok = sum(1 for r in (day_result.data or []) if r['status'] == 'ok')
        day_avg_rt = 0
        if day_result.data:
            rts = [r['response_time_ms'] for r in day_result.data if r.get('response_time_ms')]
            day_avg_rt = int(sum(rts) / len(rts)) if rts else 0

        week_ago = (now - timedelta(days=7)).isoformat()
        week_result = supabase.table("uptime_logs").select("status, response_time_ms", count="exact").gte("checked_at", week_ago).execute()
        week_total = week_result.count or 0
        week_ok = sum(1 for r in (week_result.data or []) if r['status'] == 'ok')
        week_avg_rt = 0
        if week_result.data:
            rts = [r['response_time_ms'] for r in week_result.data if r.get('response_time_ms')]
            week_avg_rt = int(sum(rts) / len(rts)) if rts else 0

        month_ago = (now - timedelta(days=30)).isoformat()
        month_result = supabase.table("uptime_logs").select("status", count="exact").gte("checked_at", month_ago).execute()
        month_total = month_result.count or 0
        month_ok = sum(1 for r in (month_result.data or []) if r['status'] == 'ok')

        return {
            "uptime_24h": round((day_ok / day_total * 100), 2) if day_total else 100,
            "uptime_7d": round((week_ok / week_total * 100), 2) if week_total else 100,
            "uptime_30d": round((month_ok / month_total * 100), 2) if month_total else 100,
            "avg_response_24h": day_avg_rt, "avg_response_7d": week_avg_rt,
            "total_checks_24h": day_total, "total_checks_7d": week_total,
            "total_checks_30d": month_total, "consecutive_failures": _consecutive_failures,
        }
    except Exception as e:
        log_security_event("UPTIME_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Uptime istatistikleri yüklenemedi")


@router.get("/api/admin/uptime/logs")
async def get_uptime_logs(page: int = 0, page_size: int = 50, status_filter: str = None, user: dict = Depends(require_admin)):
    """Son uptime check logları (paginated)"""
    try:
        query = supabase.table("uptime_logs").select("*", count="exact").order("checked_at", desc=True)
        if status_filter:
            query = query.eq("status", status_filter)
        offset = page * page_size
        query = query.range(offset, offset + page_size - 1)
        result = query.execute()
        return {"data": result.data or [], "total": result.count or 0, "page": page, "page_size": page_size}
    except Exception as e:
        log_security_event("UPTIME_LOGS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Uptime logları yüklenemedi")


@router.get("/api/admin/uptime/chart")
async def get_uptime_chart(hours: int = 24, user: dict = Depends(require_admin)):
    """Response time chart data"""
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
# RATE LIMITING DASHBOARD
# ============================================

@router.get("/api/admin/rate-limits/stats")
async def get_rate_limit_stats(user: dict = Depends(require_admin)):
    """Rate limit istatistikleri"""
    try:
        now = datetime.utcnow()
        day_ago = (now - timedelta(hours=24)).isoformat()

        result = supabase.table("rate_limit_logs").select("ip_address, blocked, endpoint", count="exact").gte("created_at", day_ago).execute()

        total = result.count or 0
        blocked = sum(1 for r in (result.data or []) if r.get('blocked'))

        blocked_ips = list(set(r['ip_address'] for r in (result.data or []) if r.get('blocked')))

        ip_counts: dict = {}
        for r in (result.data or []):
            if r.get('blocked'):
                ip = r['ip_address']
                ip_counts[ip] = ip_counts.get(ip, 0) + 1

        top_offenders = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_requests_24h": total, "blocked_24h": blocked,
            "unique_blocked_ips": len(blocked_ips),
            "top_offenders": [{"ip": ip, "count": count} for ip, count in top_offenders],
            "block_rate": round((blocked / total * 100), 2) if total else 0,
        }
    except Exception as e:
        log_security_event("RATE_LIMIT_STATS_ERROR", {"error": str(e)}, "ERROR")
        raise HTTPException(status_code=500, detail="Rate limit istatistikleri yüklenemedi")


@router.get("/api/admin/rate-limits/logs")
async def get_rate_limit_logs(page: int = 0, blocked_only: bool = False, user: dict = Depends(require_admin)):
    """Rate limit log listesi"""
    try:
        query = supabase.table("rate_limit_logs").select("*", count="exact").order("created_at", desc=True)
        if blocked_only:
            query = query.eq("blocked", True)
        offset = page * 50
        query = query.range(offset, offset + 49)
        result = query.execute()
        return {"data": result.data or [], "total": result.count or 0, "page": page}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Rate limit logları yüklenemedi")


# ============================================
# EMAIL QUEUE
# ============================================

@router.get("/api/admin/email-queue")
async def get_email_queue(page: int = 0, status: str = None, user: dict = Depends(require_admin)):
    """Email kuyruk durumu"""
    try:
        query = supabase.table("email_queue").select("*", count="exact").order("created_at", desc=True)
        if status:
            query = query.eq("status", status)
        offset = page * 20
        query = query.range(offset, offset + 19)
        result = query.execute()

        stats_result = supabase.table("email_queue").select("status", count="exact").execute()
        status_counts: dict = {}
        for r in (stats_result.data or []):
            s = r.get('status', 'unknown')
            status_counts[s] = status_counts.get(s, 0) + 1

        return {"data": result.data or [], "total": result.count or 0, "page": page, "stats": status_counts}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Email kuyruk yüklenemedi")


@router.post("/api/admin/email-queue/{email_id}/retry")
async def retry_email(email_id: str, user: dict = Depends(require_admin)):
    """Başarısız emaili tekrar dene"""
    try:
        supabase.table("email_queue").update({"status": "pending", "error_message": None}).eq("id", email_id).execute()
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Email yeniden kuyruğa eklenemedi")


# ============================================
# BACKGROUND TASKS (exposed for server.py startup)
# ============================================

async def _process_email_queue():
    """Background: pending emailleri gönder"""
    try:
        result = supabase.table("email_queue").select("*").eq("status", "pending").order("created_at").limit(10).execute()
        for email in (result.data or []):
            try:
                resend_key = os.getenv("RESEND_API_KEY", "")
                if resend_key:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            "https://api.resend.com/emails",
                            headers={"Authorization": f"Bearer {resend_key}"},
                            json={
                                "from": os.getenv("RESEND_FROM_EMAIL", "noreply@hacveumreturlari.net"),
                                "to": email['to_email'], "subject": email['subject'],
                                "html": email['body'],
                            }
                        )
                        if resp.status_code == 200:
                            supabase.table("email_queue").update({
                                "status": "sent", "sent_at": datetime.utcnow().isoformat(),
                            }).eq("id", email['id']).execute()
                        else:
                            raise Exception(f"Resend error: {resp.status_code}")
                else:
                    raise Exception("RESEND_API_KEY not set")
            except Exception as e:
                attempts = email.get('attempts', 0) + 1
                new_status = "failed" if attempts >= email.get('max_attempts', 3) else "retry"
                supabase.table("email_queue").update({
                    "status": new_status, "attempts": attempts,
                    "error_message": str(e)[:200],
                }).eq("id", email['id']).execute()
    except Exception:
        pass


async def _execute_scheduled_actions():
    """Background: zamanı gelen aksiyonları çalıştır"""
    try:
        now = datetime.utcnow().isoformat()
        result = supabase.table("scheduled_actions").select("*").eq("status", "pending").lte("scheduled_at", now).limit(10).execute()

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
                    "status": "executed", "executed_at": datetime.utcnow().isoformat(),
                }).eq("id", action['id']).execute()
            except Exception as e:
                supabase.table("scheduled_actions").update({
                    "status": "failed", "error_message": str(e)[:200],
                }).eq("id", action['id']).execute()
    except Exception:
        pass
