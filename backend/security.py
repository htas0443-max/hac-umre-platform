"""Security middleware and utilities for maximum protection"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import bleach
import re
import unicodedata
from typing import Any, Dict
import secrets
from cachetools import TTLCache
import ipaddress
import hashlib
import os

# ============================================
# CRITICAL-001 FIX: Secure Rate Limiting
# ============================================

# Trusted proxy networks (Vercel, Cloudflare, local development)
TRUSTED_PROXY_NETWORKS = [
    "10.0.0.0/8",       # Private network
    "172.16.0.0/12",    # Private network
    "192.168.0.0/16",   # Private network
    "127.0.0.0/8",      # Localhost
    # Cloudflare IP ranges
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    # Vercel IP ranges
    "76.76.21.0/24",
]

def is_trusted_proxy(ip: str) -> bool:
    """Check if IP is from a trusted proxy"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        for network in TRUSTED_PROXY_NETWORKS:
            if ip_obj in ipaddress.ip_network(network, strict=False):
                return True
        return False
    except ValueError:
        return False

def get_secure_client_ip(request: Request) -> str:
    """
    CRITICAL-001 FIX: Güvenli IP tespiti
    - Sadece güvenilir proxy'lerden gelen X-Forwarded-For'a güven
    - Fingerprint ile ek koruma
    """
    client_ip = request.client.host if request.client else "unknown"
    
    # Eğer istek doğrudan geliyorsa (proxy yok), client IP'yi kullan
    if not is_trusted_proxy(client_ip):
        return client_ip
    
    # X-Real-IP header'ı varsa (Nginx, Cloudflare)
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        # Validate it's a valid IP
        try:
            ipaddress.ip_address(x_real_ip.strip())
            return x_real_ip.strip()
        except ValueError:
            pass
    
    # X-Forwarded-For header'ından ilk IP'yi al
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # İlk IP orijinal client'tır
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
        if ips:
            try:
                ipaddress.ip_address(ips[0])
                return ips[0]
            except ValueError:
                pass
    
    # CF-Connecting-IP (Cloudflare specific)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        try:
            ipaddress.ip_address(cf_ip.strip())
            return cf_ip.strip()
        except ValueError:
            pass
    
    return client_ip

def get_rate_limit_key(request: Request) -> str:
    """
    Rate limiting için composite key oluştur
    IP + User-Agent fingerprint kombinasyonu
    """
    ip = get_secure_client_ip(request)
    
    # User-Agent ve Accept-Language ile hafif fingerprint
    user_agent = request.headers.get("User-Agent", "")[:100]
    accept_lang = request.headers.get("Accept-Language", "")[:20]
    
    # Fingerprint hash oluştur
    fingerprint_data = f"{ip}:{user_agent}:{accept_lang}"
    fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
    
    return f"{ip}:{fingerprint}"

# Rate Limiter with secure key function
limiter = Limiter(key_func=get_rate_limit_key)

# Security Configurations
ALLOWED_TAGS = []  # No HTML tags allowed
ALLOWED_ATTRIBUTES = {}
ALLOWED_PROTOCOLS = ['http', 'https']

# SQL Injection patterns
SQL_INJECTION_PATTERNS = [
    r"('|(\-\-)|(;)|(\|\|)|(\*))",
    r"(\bOR\b|\bAND\b).*=.*",
    r"(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)",
    r"(\bEXEC\b|\bEXECUTE\b|\bSCRIPT\b)",
]

# XSS patterns
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe",
    r"<object",
    r"<embed",
]

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS - SECURITY ENHANCED"""
    if not text:
        return text
    
    # Unicode normalization to prevent bypass attacks
    text = unicodedata.normalize('NFKC', text)
    
    # Remove HTML tags
    cleaned = bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, protocols=ALLOWED_PROTOCOLS, strip=True)
    
    return cleaned

def validate_no_sql_injection(text: str) -> bool:
    """Check for SQL injection patterns"""
    if not text:
        return True
    
    text_upper = text.upper()
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, text_upper, re.IGNORECASE):
            return False
    return True

def validate_no_xss(text: str) -> bool:
    """Check for XSS patterns"""
    if not text:
        return True
    
    text_lower = text.lower()
    for pattern in XSS_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return False
    return True

def validate_input(data: Any, field_name: str = "input") -> Any:
    """Comprehensive input validation"""
    if isinstance(data, str):
        # Sanitize
        data = sanitize_input(data)
        
        # Check SQL injection
        if not validate_no_sql_injection(data):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_name}: Potential SQL injection detected"
            )
        
        # Check XSS
        if not validate_no_xss(data):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_name}: Potential XSS detected"
            )
        
        return data
    
    elif isinstance(data, dict):
        return {k: validate_input(v, k) for k, v in data.items()}
    
    elif isinstance(data, list):
        return [validate_input(item, field_name) for item in data]
    
    return data

def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return secrets.token_urlsafe(32)

def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify CSRF token"""
    return secrets.compare_digest(token, expected)

# ============================================
# CSRF PROTECTION SYSTEM
# ============================================

# CSRF token storage (TTL: 1 hour)
csrf_token_store: TTLCache = TTLCache(maxsize=10000, ttl=3600)

def create_csrf_token_for_session(session_id: str) -> str:
    """Create and store CSRF token for a session"""
    token = generate_csrf_token()
    csrf_token_store[session_id] = token
    return token

def validate_csrf_token(request: Request, session_id: str) -> bool:
    """
    Validate CSRF token from request header
    Token should be in X-CSRF-Token header
    """
    token = request.headers.get("X-CSRF-Token")
    if not token:
        return False
    
    expected = csrf_token_store.get(session_id)
    if not expected:
        return False
    
    return verify_csrf_token(token, expected)

def require_csrf_token(request: Request, session_id: str):
    """
    Middleware function to require CSRF token for state-changing requests
    """
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        if not validate_csrf_token(request, session_id):
            raise HTTPException(
                status_code=403,
                detail="CSRF token missing or invalid"
            )

# Security Headers Middleware
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # Content Security Policy - ENHANCED
    # Note: unsafe-inline needed for React, but unsafe-eval removed
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.youtube.com https://challenges.cloudflare.com; "  # unsafe-eval REMOVED
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https: blob:; "
        "media-src 'self' https://www.youtube.com https://*.youtube.com; "
        "frame-src 'self' https://www.youtube.com https://*.youtube.com https://challenges.cloudflare.com; "  # YouTube embed + Turnstile
        "connect-src 'self' https://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com wss://*.supabase.co https://challenges.cloudflare.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "upgrade-insecure-requests;"  # HTTP -> HTTPS upgrade
    )
    response.headers["Content-Security-Policy"] = csp
    
    return response

# ============================================
# LOG MASKING UTILITIES
# ============================================

def mask_email(email: str) -> str:
    """Mask email for secure logging: user@domain.com -> u***@d***.com"""
    if not email or '@' not in email:
        return '***'
    local, domain = email.split('@', 1)
    masked_local = local[0] + '***' if local else '***'
    domain_parts = domain.split('.')
    masked_domain = domain_parts[0][0] + '***' if domain_parts[0] else '***'
    return f"{masked_local}@{masked_domain}.{''.join(domain_parts[1:])}"

def mask_ip(ip: str) -> str:
    """Mask IP for secure logging: 192.168.1.100 -> 192.168.***.***"""
    if not ip:
        return '***'
    parts = ip.split('.')
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.***.***"
    return '***'  # IPv6 or invalid

def mask_sensitive_data(details: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive data in log details - SECURITY ENHANCEMENT"""
    masked = {}
    sensitive_keys = {'email', 'ip', 'token', 'password', 'secret', 'key', 'authorization'}
    
    for key, value in details.items():
        key_lower = key.lower()
        if 'email' in key_lower:
            masked[key] = mask_email(str(value))
        elif 'ip' in key_lower:
            masked[key] = mask_ip(str(value))
        elif any(s in key_lower for s in sensitive_keys):
            masked[key] = '***REDACTED***'
        else:
            masked[key] = value
    return masked

# Request logging for security audit
def log_security_event(event_type: str, details: Dict[str, Any], severity: str = "INFO"):
    """Log security events for audit - ENHANCED with masking"""
    from datetime import datetime
    
    # Mask sensitive data before logging
    masked_details = mask_sensitive_data(details)
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "severity": severity,
        "details": masked_details
    }
    
    # Color-coded console output
    severity_colors = {
        "INFO": "",
        "WARN": "\033[93m",
        "ERROR": "\033[91m",
        "CRITICAL": "\033[91m\033[1m"
    }
    reset_color = "\033[0m"
    color = severity_colors.get(severity, "")
    
    # Structured log output
    print(f"{color}[SECURITY {severity}] {event_type}{reset_color}")
    print(f"  Timestamp: {log_entry['timestamp']}")
    for key, value in masked_details.items():
        # Truncate long values
        str_value = str(value)[:200] if len(str(value)) > 200 else str(value)
        print(f"  {key}: {str_value}")
    
    # In production, this should write to:
    # 1. A dedicated security log file
    # 2. A SIEM system (e.g., Splunk, ELK)
    # 3. A database audit table
    # Example: supabase.table("audit_logs").insert(log_entry).execute()


# File upload validation
MAGIC_BYTES = {
    'pdf': b'%PDF',
    'jpeg': b'\xff\xd8\xff',
    'jpg': b'\xff\xd8\xff',
    'png': b'\x89PNG\r\n\x1a\n',
}

def validate_magic_bytes(file_content: bytes, extension: str) -> bool:
    """
    SEC-003: Validate file content matches its extension using magic bytes.
    Prevents malicious file uploads disguised with wrong extensions.
    """
    ext = extension.lower().lstrip('.')
    
    if ext not in MAGIC_BYTES:
        return True  # Unknown extension, skip check
    
    expected_magic = MAGIC_BYTES[ext]
    return file_content[:len(expected_magic)] == expected_magic

def scan_file_for_viruses(file_content: bytes, filename: str) -> tuple[bool, str]:
    """
    SEC-004: Optional ClamAV antivirus scanning.
    Returns (is_safe, message).
    Gracefully degrades if ClamAV is not available.
    """
    import os
    
    # Check if ClamAV is enabled
    clamav_enabled = os.getenv("CLAMAV_ENABLED", "false").lower() == "true"
    if not clamav_enabled:
        return True, "Antivirus scanning disabled"
    
    try:
        import clamd
        
        clamav_host = os.getenv("CLAMAV_HOST", "localhost")
        clamav_port = int(os.getenv("CLAMAV_PORT", "3310"))
        
        cd = clamd.ClamdNetworkSocket(host=clamav_host, port=clamav_port, timeout=30)
        
        # Scan the file content
        result = cd.instream(file_content)
        
        if result and 'stream' in result:
            status, virus_name = result['stream']
            if status == 'FOUND':
                log_security_event("VIRUS_DETECTED", {
                    "filename": filename,
                    "virus": virus_name
                }, "CRITICAL")
                return False, f"Virüs tespit edildi: {virus_name}"
        
        return True, "Dosya temiz"
    
    except ImportError:
        # clamd not installed
        return True, "ClamAV modülü yüklü değil"
    except Exception as e:
        # ClamAV not reachable - log but allow (graceful degradation)
        log_security_event("CLAMAV_ERROR", {"error": str(e)}, "WARN")
        return True, "Antivirus taraması yapılamadı (servis erişilemez)"

def validate_file_upload(filename: str, content_type: str, file_size: int, 
                         file_content: bytes = None, max_size: int = 5 * 1024 * 1024) -> bool:
    """
    Comprehensive file upload validation with magic bytes and antivirus.
    SEC-003: Magic bytes validation
    SEC-004: ClamAV antivirus scanning (optional)
    """
    # Size check
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"Dosya boyutu {max_size / (1024*1024)}MB'dan küçük olmalıdır")
    
    # Extension check
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    ext = filename.lower().split('.')[-1]
    if f'.{ext}' not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Sadece PDF ve resim dosyaları yüklenebilir")
    
    # Content type check
    allowed_content_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Geçersiz dosya tipi")
    
    # Filename sanitization (prevent directory traversal)
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Geçersiz dosya adı")
    
    # SEC-003: Magic bytes validation
    if file_content:
        if not validate_magic_bytes(file_content, ext):
            log_security_event("MAGIC_BYTES_MISMATCH", {
                "filename": filename,
                "claimed_extension": ext,
                "content_type": content_type
            }, "CRITICAL")
            raise HTTPException(status_code=400, detail="Dosya içeriği uzantısıyla uyuşmuyor. Lütfen geçerli bir dosya yükleyin.")
        
        # SEC-004: Antivirus scan
        is_safe, scan_message = scan_file_for_viruses(file_content, filename)
        if not is_safe:
            raise HTTPException(status_code=400, detail=scan_message)
    
    return True

# Password strength validation
def validate_password_strength(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır")
    
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Şifre en az 1 büyük harf içermelidir")
    
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Şifre en az 1 küçük harf içermelidir")
    
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Şifre en az 1 rakam içermelidir")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Şifre en az 1 özel karakter içermelidir")
    
    # Common passwords blacklist
    common_passwords = ['password', '12345678', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon']
    if password.lower() in common_passwords:
        raise HTTPException(status_code=400, detail="Çok yaygın bir şifre seçtiniz")
    
    return True

# IP-based brute force protection - SECURITY FIX: TTL Cache to prevent memory leak
# Max 10000 IPs, 1 hour TTL for failed attempts, 15 min TTL for blocked IPs
failed_login_attempts: TTLCache = TTLCache(maxsize=10000, ttl=3600)
blocked_ips: TTLCache = TTLCache(maxsize=1000, ttl=900)

def check_brute_force(ip: str) -> bool:
    """Check if IP is blocked due to brute force"""
    import time
    
    if ip in blocked_ips:
        if time.time() < blocked_ips[ip]:
            raise HTTPException(
                status_code=429,
                detail="Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin."
            )
        else:
            # Unblock
            del blocked_ips[ip]
            failed_login_attempts[ip] = 0
    
    return True

def record_failed_login(ip: str):
    """Record failed login attempt"""
    import time
    
    failed_login_attempts[ip] = failed_login_attempts.get(ip, 0) + 1
    
    # Block after 5 failed attempts
    if failed_login_attempts[ip] >= 5:
        blocked_ips[ip] = time.time() + (15 * 60)  # Block for 15 minutes
        log_security_event(
            "BRUTE_FORCE_DETECTED",
            {"ip": ip, "attempts": failed_login_attempts[ip]},
            "CRITICAL"
        )

def record_successful_login(ip: str):
    """Clear failed attempts on successful login"""
    if ip in failed_login_attempts:
        failed_login_attempts[ip] = 0


# ============================================
# CLOUDFLARE TURNSTILE VERIFICATION
# ============================================

TURNSTILE_SECRET_KEY = os.getenv("TURNSTILE_SECRET_KEY", "")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

async def verify_turnstile_token(token: str, ip: str = "") -> bool:
    """
    Cloudflare Turnstile token doğrulaması.
    Secret key yoksa devre dışı (development modda True döner).
    """
    if not TURNSTILE_SECRET_KEY:
        return True  # Development modda geç

    if not token:
        return False

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                TURNSTILE_VERIFY_URL,
                data={
                    "secret": TURNSTILE_SECRET_KEY,
                    "response": token,
                    "remoteip": ip,
                }
            )
            result = response.json()

            if not result.get("success", False):
                log_security_event("TURNSTILE_FAILED", {
                    "ip": ip,
                    "error_codes": result.get("error-codes", []),
                }, "WARN")
                return False

            return True
    except Exception as e:
        log_security_event("TURNSTILE_ERROR", {"error": str(e)}, "WARN")
        return True  # Graceful degradation — hata durumunda engelleme
