# 🕋 Hac & Umre Tur Karşılaştırma Platformu

AI destekli, modern ve kullanıcı dostu Hac ve Umre tur karşılaştırma platformu.

## ✨ Özellikler

### Kullanıcılar İçin
- 🔍 **Gelişmiş Filtreleme**: Fiyat, tarih, operatör, hizmetler
- 🤖 **AI Karşılaştırma**: OpenAI GPT-5 ve Claude Sonnet 4 ile detaylı analiz
- 💬 **AI Chatbot**: Hac/Umre danışmanlığı
- 📊 **Yan Yana Karşılaştırma**: Max 3 tur, skorlar ve öneriler

### Tur Şirketleri İçin
- 📣 **Tur İlanı**: Kendi turlarınızı oluşturun ve yayınlayın
- 📊 **Dashboard**: İstatistikler ve performans takibi
- ✏️ **Tur Yönetimi**: Düzenleme ve güncelleme
- ✅ **Onay Sistemi**: Admin onayından sonra yayın

### Admin İçin
- ✅ **Tur Onayı**: Pending turları onayla/reddet
- 📥 **CSV Import**: Toplu tur yükleme
- 📊 **Platform Yönetimi**: Tüm turları görüntüleme

## 🛠️ Teknoloji Stack

### Backend
- **FastAPI** (Python 3.11)
- **MongoDB** (NoSQL Database)
- **JWT** Authentication
- **Emergent LLM Key** (OpenAI, Claude, Gemini)

### Frontend
- **Vite** (Build Tool)
- **React 19** + **TypeScript**
- **Framer Motion** (Animations)
- **CSS3** (Advanced animations)
- **Responsive Design**

## 🚀 Vercel Deployment

### Gereksinimler
1. Vercel hesabı (https://vercel.com)
2. MongoDB Atlas hesabı (database için)
3. Environment variables

### Adım Adım Deployment

#### 1. GitHub Repository Oluştur
```bash
git init
git add .
git commit -m "Initial commit: Hajj Umrah Platform"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

#### 2. Vercel'e Bağlan
1. https://vercel.com adresine git
2. "New Project" tıkla
3. GitHub repository'yi seç
4. Framework Preset: **Vite**
5. Root Directory: `frontend`

#### 3. Environment Variables Ekle

Vercel Dashboard → Project → Settings → Environment Variables

**Backend Variables (.env):**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/hajj_umrah_db
EMERGENT_LLM_KEY=sk-emergent-f4eB9197aB19f22404
JWT_SECRET_KEY=your-super-secret-key-here
```

**Frontend Variables (.env.production):**
```
REACT_APP_BACKEND_URL=https://your-domain.vercel.app
```

#### 4. Build Commands

**Frontend Build:**
```bash
cd frontend
yarn install
yarn build
```

**Backend:**
- Vercel otomatik olarak `backend/server.py`'yi serverless function olarak deploy eder

#### 5. Custom Domain Bağlama

1. Vercel Dashboard → Project → Settings → Domains
2. Domain ekle (örn: `hajj-umrah.com`)
3. DNS ayarlarını güncelle:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. SSL otomatik yapılandırılır (Let's Encrypt)

## 📦 Lokal Geliştirme

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn dev
```

### Environment Variables

**backend/.env:**
```
MONGO_URL=mongodb://localhost:27017
EMERGENT_LLM_KEY=sk-emergent-f4eB9197aB19f22404
JWT_SECRET_KEY=local-dev-secret-key
```

**frontend/.env:**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `GET /api/auth/me` - Kullanıcı bilgileri

### Tours
- `GET /api/tours` - Turları listele (filtreleme destekli)
- `GET /api/tours/{id}` - Tur detayı
- `POST /api/tours` - Tur oluştur (Admin)
- `PUT /api/tours/{id}` - Tur güncelle (Admin)
- `DELETE /api/tours/{id}` - Tur sil (Admin)

### Operator
- `GET /api/operator/tours` - Operatörün turları
- `POST /api/operator/tours` - Tur oluştur
- `PUT /api/operator/tours/{id}` - Tur güncelle
- `GET /api/operator/stats` - İstatistikler

### Admin
- `PUT /api/admin/tours/{id}/approve` - Turu onayla
- `PUT /api/admin/tours/{id}/reject` - Turu reddet
- `POST /api/import/csv` - CSV import

### AI
- `POST /api/compare` - Turları karşılaştır
- `POST /api/chat` - Chatbot
- `GET /api/providers/models` - AI sağlayıcıları

## 🎨 Design System

### Renk Paleti
- **Primary**: Emerald Green (#00674F)
- **Accent**: Gold (#D4AF37)
- **Background**: Cream (#FFF8DE)
- **AI**: Teal (#00A896)

### Typography
- **Headings**: Space Grotesk
- **Body**: Inter
- **Special**: Playfair Display

## 📱 Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🧪 Testing

### Backend API Test
```bash
python test_core.py
```

### Frontend Test
```bash
cd frontend
yarn test
```

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 İletişim

Proje sahibi: [Your Name]
Email: your.email@example.com

## 🙏 Teşekkürler

- OpenAI GPT-5
- Anthropic Claude Sonnet 4
- Emergent Platform
- Vercel
