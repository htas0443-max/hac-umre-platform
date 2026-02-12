"""Supabase kullanıcılarını listele ve test girişi yap"""
import os
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Kullanicilari listele
print("=== KULLANICILAR ===")
try:
    users = supabase.auth.admin.list_users()
    for u in users:
        if hasattr(u, 'email'):
            print(f"  {u.email}")
except Exception as e:
    print(f"Liste hatasi: {e}")

# Giriş testi
print("\n=== GIRIS TESTI ===")
anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# admin@test.com ile deneyelim
test_emails = []
try:
    users = supabase.auth.admin.list_users()
    for u in users:
        if hasattr(u, 'email') and u.email:
            test_emails.append(u.email)
except:
    pass

for email in test_emails[:3]:
    print(f"\n  {email} ile deneniyor...")
    try:
        resp = anon_client.auth.sign_in_with_password({"email": email, "password": "Admin123!"})
        print(f"    BASARILI! (user_id: {resp.user.id})")
    except Exception as e:
        err_str = str(e)
        if "Invalid" in err_str:
            print(f"    BASARISIZ: Sifre hatali")
        elif "Email not confirmed" in err_str:
            print(f"    BASARISIZ: Email onaylanmamis")
        else:
            print(f"    BASARISIZ: {err_str[:100]}")
