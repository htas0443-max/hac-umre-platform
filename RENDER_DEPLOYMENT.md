# Render.com Backend Deployment Guide

## Hazır Dosyalar
Tüm gerekli dosyalar oluşturuldu:
- `render.yaml` - Blueprint yapılandırması
- `backend/Procfile` - Process komutu
- `backend/.python-version` - Python 3.11
- `backend/requirements.txt` - Bağımlılıklar

## Deployment Adımları

### Adım 1: GitHub'a Yükle
Projeyi GitHub'a yüklemek için:
1. https://github.com/new adresine git
2. Repository adı: `hac-umre-platform`
3. Private olarak oluştur
4. Yerel dosyaları sürükle-bırak ile yükle

### Adım 2: Render'a Bağla
1. https://render.com adresine git
2. "Get Started for Free" ile kayıt ol
3. "New" → "Blueprint" seç
4. GitHub'ı bağla ve repo'yu seç
5. `render.yaml` otomatik algılanacak

### Adım 3: Environment Variables Ekle
Dashboard'da şu değişkenleri ekle:
- `SUPABASE_URL`: https://viwbxolkhvgxpvgtukic.supabase.co
- `SUPABASE_ANON_KEY`: [Supabase anon key]
- `SUPABASE_SERVICE_ROLE_KEY`: [Supabase service key]

### Adım 4: Deploy
"Apply" butonuna tıkla ve deploy başlasın.

## Deploy Sonrası
Backend URL: `https://hajj-umre-backend.onrender.com`
Bu URL'i frontend'e ekle.
