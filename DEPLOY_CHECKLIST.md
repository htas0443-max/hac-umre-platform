# 🚀 Deploy Checklist — Hac & Umre Platform

Production deploy öncesi kontrol listesi.

---

## 1. Environment Variables

### Frontend (Vercel)
| Değişken | Açıklama | Zorunlu |
|---|---|---|
| `VITE_BACKEND_URL` | Backend API URL | ✅ |
| `VITE_SUPABASE_URL` | Supabase proje URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public, güvenli) | ✅ |

### Backend (Render/Railway)
| Değişken | Açıklama | Zorunlu |
|---|---|---|
| `SUPABASE_URL` | Supabase proje URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (sadece backend!) | ✅ |
| `CORS_ORIGINS` | İzin verilen frontend domainleri | ✅ |
| `JWT_SECRET_KEY` | JWT imzalama anahtarı | ✅ |
| `ENVIRONMENT` | `production` olmalı | ✅ |

---

## 2. Güvenlik Kontrolleri

- [ ] `SUPABASE_SERVICE_ROLE_KEY` sadece backend'te mi?
- [ ] Frontend `.env`'de secret yok mu?
- [ ] `CORS_ORIGINS` wildcard (`*`) değil, spesifik domain mi?
- [ ] HTTPS zorunlu mu? (`ENVIRONMENT=production`)
- [ ] Rate limiting aktif mi?
- [ ] RLS politikaları Supabase'de çalıştırıldı mı? (`supabase_rls.sql`)

---

## 3. Vercel Deploy

```bash
# 1. Build test
cd frontend
npm run build

# 2. Vercel'e push (otomatik deploy)
git add . && git commit -m "deploy" && git push

# 3. Environment variables ekle (Vercel Dashboard)
# Settings > Environment Variables
```

vercel.json zaten mevcut (SPA rewrite):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 4. Backend Deploy

```bash
# Render/Railway otomatik deploy
git push origin main
```

---

## 5. Supabase

- [ ] RLS SQL çalıştırıldı mı?
- [ ] Auth email templates güncellendi mi?
- [ ] Custom domain ayarlandı mı?

---

## 6. DNS

- [ ] Frontend: `hacveumreturlari.com` → Vercel/Cloudflare
- [ ] Backend: `api.hacveumreturlari.com` → Render
- [ ] SPF / DKIM / DMARC (email) doğru mu?

---

## 7. Post-Deploy Test

- [ ] Ana sayfa yükleniyor mu?
- [ ] `/admin/login` çalışıyor mu?
- [ ] Admin paneline sadece admin giriyor mu?
- [ ] Tur ekleme çalışıyor mu?
- [ ] Hard refresh 404 vermiyor mu?
- [ ] Favicon doğru görünüyor mu?
