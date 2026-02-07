# 🌐 Custom Domain Kurulum Kılavuzu
## hacumreturlari.com

### Adım 1: Domain Satın Alma

**Önerilen Sağlayıcılar (Türkiye için):**
1. **Natro.com** - Türkiye'nin en büyüğü
   - https://www.natro.com
   - .com domain: ~150-200 TL/yıl
   - Türkçe destek

2. **HostingTürkiye**
   - https://www.hostingturkiye.com.tr
   - .com domain: ~180 TL/yıl

3. **GoDaddy** (International)
   - https://www.godaddy.com
   - .com domain: ~$15/yıl
   - Kredi kartı gerekli

**Domain Adı:** `hacumreturlari.com`

---

### Adım 2: DNS Ayarları (Domain sağlayıcınızda)

Domain satın aldıktan sonra DNS ayarlarını yapın:

**A) Vercel ile (Önerilen - Kolay):**

Domain sağlayıcınızda **Nameserver** değiştirin:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**B) Manuel DNS Records:**

Domain sağlayıcınızın DNS yönetim panelinde:

**A Record:**
```
Type: A
Name: @ (veya boş)
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (www için):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

### Adım 3: Vercel'de Domain Ekleme

1. **Vercel Dashboard'a gidin** (vercel.com)
2. Projenizi oluşturun (GitHub'dan import edin)
3. **Settings** → **Domains**
4. **Add Domain** tıklayın
5. `hacumreturlari.com` yazın
6. DNS ayarları talimatlarını takip edin
7. SSL otomatik eklenir (Let's Encrypt)

---

### Adım 4: Environment Variables (Vercel'de)

**Backend:**
```
SUPABASE_URL=https://viwbxolkhvgxpvgtukic.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EMERGENT_LLM_KEY=sk-emergent-f4eB9197aB19f22404
JWT_SECRET_KEY=hajj-umrah-secret-key-2024
```

**Frontend:**
```
VITE_BACKEND_URL=https://hacumreturlari.com
VITE_SUPABASE_URL=https://viwbxolkhvgxpvgtukic.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Adım 5: Supabase URL Configuration

Supabase Dashboard → **Authentication** → **URL Configuration**:

**Site URL:** `https://hacumreturlari.com`
**Redirect URLs:** 
```
https://hacumreturlari.com
https://hacumreturlari.com/**
https://www.hacumreturlari.com
https://www.hacumreturlari.com/**
```

---

### Domain Propagation (Yayılma)

DNS değişiklikleri **5 dakika - 48 saat** arasında yayılır.
- Genellikle 15-30 dakika içinde çalışır
- Kontrol: https://dnschecker.org

---

### SSL Sertifikası

Vercel otomatik olarak SSL ekler:
- Let's Encrypt (ücretsiz)
- Auto-renewal (otomatik yenileme)
- HTTPS zorunlu

---

### Test Etme

Domain aktif olduktan sonra:
```bash
# DNS kontrolü
nslookup hacumreturlari.com

# Site kontrolü
curl https://hacumreturlari.com

# SSL kontrolü
curl -I https://hacumreturlari.com
```

---

**Sonraki Adımlar:**

1. ✅ Domain satın alın (hacumreturlari.com)
2. ✅ DNS ayarlarını yapın (nameserver veya A/CNAME)
3. ✅ Vercel'de domain ekleyin
4. ✅ Environment variables güncelleyin
5. ✅ Supabase'de site URL güncelleyin
6. ✅ Platform hazır!

**Şimdilik Preview URL kullanabilirsiniz:**
https://hajj-travel-assist.preview.emergentagent.com
