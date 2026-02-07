# 🐳 Docker Deployment Kılavuzu
## Hac & Umre Platformu

### Hızlı Başlangıç

**1. .env Dosyası Oluştur:**
```bash
cp .env.docker.example .env
# .env dosyasını düzenle, Supabase credentials ekle
```

**2. Docker Compose ile Başlat:**
```bash
docker-compose up -d
```

**3. Kontrol Et:**
```bash
# Backend health check
curl http://localhost:8001/api/health

# Frontend (development)
open http://localhost:3000

# Frontend (production)
# open https://hacveumreturlari.com
```

---

### Detaylı Adımlar

#### 1. Environment Variables

`.env` dosyasını oluşturun:
```env
SUPABASE_URL=https://viwbxolkhvgxpvgtukic.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EMERGENT_LLM_KEY=sk-emergent-...
JWT_SECRET_KEY=your-secret-key
VITE_BACKEND_URL=http://localhost:8001
VITE_SUPABASE_URL=https://viwbxolkhvgxpvgtukic.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. Build ve Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 3. Kontrol

```bash
# Service durumu
docker-compose ps

# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend
```

---

### Port Yapılandırması (Development)

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs (disabled in production)

### Production URLs

- **Frontend:** https://hacveumreturlari.com
- **Backend API:** https://api.hacveumreturlari.com

---

### Production Deployment

**1. Environment Variables Güncelle:**
```env
VITE_BACKEND_URL=https://api.hacveumreturlari.com
CORS_ORIGINS=https://hacveumreturlari.com,https://www.hacveumreturlari.com
```

**2. Build Production:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

### Troubleshooting

**Backend başlamıyor:**
```bash
docker-compose logs backend
# .env dosyası doğru mu kontrol edin
```

**Frontend build hatası:**
```bash
docker-compose build --no-cache frontend
```

**Container restart:**
```bash
docker-compose restart backend frontend
```

---

**Developer:** Hamza Taş 🕋
