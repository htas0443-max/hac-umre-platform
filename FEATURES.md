# 🌟 Platform Özellikleri

## Hac & Umre Tur Karşılaştırma Platformu

Tam özellik listesi ve kullanım kılavuzu.

---

## 👥 Kullanıcı Tipleri

### 1. Normal Kullanıcı (User)
- Turları görüntüleme ve filtreleme
- AI ile tur karşılaştırma
- AI chatbot ile danışmanlık
- Favori turları seçme

### 2. Tur Şirketi (Operator)
- Şirket kaydı (company_name)
- Tur ilanı oluşturma
- Dashboard ile istatistikler
- Tur düzenleme ve güncelleme
- Onay durumu takibi

### 3. Admin
- Tüm turları görüntüleme
- Tur onaylama/reddetme
- CSV ile toplu import
- Platform yönetimi

---

## 🔑 Temel Özellikler

### 1. 🤖 AI Tur Karşılaştırma

**Açıklama:** Yapay zeka ile 2-3 turu detaylı karşılaştırın

**Nasıl Kullanılır:**
1. Turlar sayfasında 2-3 tur seçin
2. "AI ile Karşılaştır" butonuna tıklayın
3. AI provider seçin (OpenAI veya Claude)
4. Karşılaştırma sonuçlarını görüntüleyin

**Özellikler:**
- Fiyat analizi
- Konfor değerlendirmesi
- Hizmet karşılaştırması
- Süre ve lokasyon analizi
- Skor tablosu (0-100)
- Öneriler (bütçe dostu, konfor arayan, ilk kez giden)

**AI Providers:**
- OpenAI GPT-5 (detaylı analiz, ~45s)
- Claude Sonnet 4 (hızlı, ~15s) ⚡ **Önerilen**

---

### 2. 💬 AI Chatbot

**Açıklama:** Hac ve Umre hakkında sorularınıza AI'dan cevap alın

**Nasıl Kullanılır:**
1. Chat sayfasına gidin
2. AI provider seçin
3. Sorunuzu yazın
4. Anında cevap alın

**Örnek Sorular:**
- "Yaşlı bir kişi için hangi tur uygun?"
- "Vize işlemleri ne kadar sürer?"
- "İlk kez Umre'ye gidiyorum, önerileriniz?"
- "Ramazan ayında Umre yapmak nasıl?"

**Özellikler:**
- Tur bağlamlı sorular (belirli tur hakkında)
- Genel Hac/Umre danışmanlığı
- Türkçe doğal dil desteği
- Sohbet geçmişi

---

### 3. 🔍 Gelişmiş Filtreleme

**Filtreleme Seçenekleri:**
- **Fiyat:** Min-max aralığı (TRY)
- **Operatör:** Şirket adına göre arama
- **Sıralama:** 
  - Ekleme tarihi
  - Fiyat (artan/azalan)
  - Başlangıç tarihi

**Tur Bilgileri:**
- Başlık ve operatör
- Fiyat ve para birimi
- Süre ve tarihler
- Otel bilgileri ve mesafe
- Ulaşım detayları
- Rehber bilgisi
- Vize durumu
- Hizmetler listesi
- Günlük program (itinerary)
- Puan (rating)

---

### 4. 🏢 Tur Şirketi İlan Sistemi

**Operator Kaydı:**
1. `/operator/register` sayfasına git
2. Şirket adı, email, şifre gir
3. Kayıt ol
4. Dashboard'a yönlendir

**Dashboard Özellikleri:**
- 📊 İstatistikler:
  - Toplam tur sayısı
  - Yayında olan turlar
  - Onay bekleyen turlar
  - Taslak turlar
  - Reddedilen turlar
- 📋 Tur listesi (filtreleme ile)
- ➕ Yeni tur oluşturma
- ✏️ Tur düzenleme

**Tur Oluşturma:**
1. "Yeni Tur İlanı" butonuna tıkla
2. Form doldur:
   - Tur başlığı
   - Fiyat (TRY)
   - Tarihler (başlangıç-bitiş)
   - Süre
   - Otel bilgileri
   - Ulaşım
   - Rehber
   - Vize
   - Hizmetler (virgülle ayrılmış)
   - Program (her satır bir gün)
   - Puan (opsiyonel)
3. "Oluştur ve Onaya Gönder"
4. Status: pending (admin onayı bekler)

**Tur Düzenleme:**
- Sadece kendi turlarını düzenleyebilir
- Approved tur güncellenirse → tekrar pending olur
- Red nedeni görülebilir (rejected turlar için)

---

### 5. ✅ Admin Onay Sistemi

**Admin Paneli:**
- `/admin/approval` - Onay bekleyen turlar
- `/admin/import` - CSV import

**Tur Onaylama:**
1. Pending turları listele
2. Tur detaylarını incele
3. "Onayla" → Status: approved (yayına alır)
4. "Reddet" → Red nedeni gir → Status: rejected

**Onay Workflow:**
```
draft → pending → approved ✅
              ↓
          rejected ❌
```

**Red Nedeni:**
- Operatör dashboard'da gösterilir
- Düzeltme yapıp tekrar gönderebilir

---

### 6. 📊 CSV Import (Admin)

**Format:**
```csv
title,operator,price,currency,duration,hotel,visa,services,transport,guide
Ekonomik Umre,ABC Turizm,12000,TRY,7 gün,Makkah Hotel 3*,Dahil,"Ulaşım,Rehber",THY,Türkçe rehber
```

**Gerekli Alanlar:**
- title, operator, price, currency, duration, hotel, visa

**Opsiyonel Alanlar:**
- start_date, end_date, services, transport, guide, itinerary, rating

**Kullanım:**
1. CSV dosyası hazırla
2. `/admin/import` sayfasına git
3. Dosya yükle
4. Import sonuçlarını görüntüle
5. Hatalar varsa düzelt

---

## 🎨 Tasarım Sistemi

### Renk Paleti

**Primary (Emerald Green):**
- `#00674F` - Ana renk (butonlar, başlıklar)
- `#7A9D7A` - Sage green (hover states)
- `#A8D5BA` - Mint (aksanlar)
- `#E8F5E9` - Light green (arka planlar)

**Accent (Gold):**
- `#D4AF37` - Classic gold (premium vurgu)
- `#E8D7A0` - Light gold (borders)
- `#B8941F` - Dark gold (active states)

**Neutral:**
- `#FFFFFF` - White (kartlar)
- `#FFF8DE` - Cream (sayfa arka planı)
- `#F5F1E8` - Beige (section arka planı)

**AI Colors:**
- `#00A896` - Teal (AI features)
- `#02C39A` - Light teal (aksanlar)
- `#F0FDFA` - AI background

### Typography

**Fonts:**
- Space Grotesk (başlıklar, UI)
- Inter (body text)
- Playfair Display (özel başlıklar)

**Boyutlar:**
- H1: 2.5rem → 2rem (mobile)
- H2: 2rem → 1.5rem (mobile)
- Body: 1rem → 0.875rem (mobile)

---

## ⚡ Animasyonlar

### Framer Motion

**Page Transitions:**
- Fade in (opacity: 0 → 1)
- Slide up (y: 20 → 0)
- Scale (scale: 0.9 → 1)

**Card Animations:**
- Hover: scale(1.05) + rotateY(5deg)
- Tap: scale(0.95)
- Entrance: stagger 0.1s

**Button Interactions:**
- Ripple effect
- Hover scale: 1.02
- Tap scale: 0.98

### Advanced CSS

**3D Effects:**
- Card tilt on hover
- 3D perspective transforms
- Rotating elements

**Gradients:**
- Animated mesh gradients
- Golden shine effect
- Border animations

**Particles:**
- Floating particles
- Sparkle effects
- Confetti animations

**Special:**
- Pulse ring
- Heartbeat
- Neon glow
- Wave animations

---

## 🚀 API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "secure123",
  "role": "user|operator|admin",
  "company_name": "Şirket Adı" // operator için zorunlu
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "secure123"
}
```

**GET /api/auth/me**
- Headers: `Authorization: Bearer <token>`
- Returns: User bilgileri

### Tours

**GET /api/tours**
- Query params: min_price, max_price, operator, status, sort_by, sort_order
- Returns: Tur listesi (default: sadece approved)

**GET /api/tours/{id}**
- Returns: Tur detayları

**POST /api/tours** (Admin)
- Body: Tour bilgileri
- Returns: Tour ID

**PUT /api/tours/{id}** (Admin)
**DELETE /api/tours/{id}** (Admin)

### Operator

**GET /api/operator/tours**
- Returns: Operatörün kendi turları

**POST /api/operator/tours**
- Body: Tour bilgileri (operator otomatik company_name olur)
- Returns: Tour ID (status: pending)

**PUT /api/operator/tours/{id}**
- Body: Güncellenecek alanlar
- Note: Approved tur güncellenirse → pending olur

**GET /api/operator/stats**
- Returns: total_tours, approved_tours, pending_tours, draft_tours, rejected_tours

### Admin

**PUT /api/admin/tours/{id}/approve**
- Returns: Onay mesajı

**PUT /api/admin/tours/{id}/reject?reason=...**
- Query param: reason (red nedeni)
- Returns: Red mesajı

**POST /api/import/csv** (Admin)
- Form data: file (CSV)
- Returns: Import istatistikleri

### AI

**POST /api/compare**
```json
{
  "tour_ids": ["id1", "id2", "id3"],
  "criteria": ["fiyat", "konfor", "hizmetler"],
  "ai_provider": "anthropic|openai"
}
```
- Returns: Comparison result (summary, scores, recommendations)

**POST /api/chat**
```json
{
  "message": "Sorum nedir?",
  "context_tour_ids": ["id1"], // opsiyonel
  "ai_provider": "anthropic|openai"
}
```
- Returns: AI cevabı

**GET /api/providers/models**
- Returns: Mevcut AI providers ve durumları

---

## 📱 Sayfa Yapısı

### Public Pages
- `/` - Ana sayfa (hero, özellikler, CTA)
- `/login` - Giriş
- `/register` - Kullanıcı kaydı
- `/operator/register` - Tur şirketi kaydı

### User Pages (Auth gerekli)
- `/tours` - Tur listesi (filtreleme)
- `/tours/:id` - Tur detayı
- `/compare?tours=id1,id2` - Karşılaştırma
- `/chat` - AI Chatbot
- `/chat?tour=id` - Tur bağlamlı chat

### Operator Pages (Operator auth gerekli)
- `/operator/dashboard` - Dashboard (stats, tur listesi)
- `/operator/create` - Yeni tur oluştur
- `/operator/edit/:id` - Tur düzenle

### Admin Pages (Admin auth gerekli)
- `/admin/approval` - Tur onaylama
- `/admin/import` - CSV import

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Normal Kullanıcı
```
1. Ana sayfaya git
2. "Hemen Başlayın" → Kayıt ol
3. Turlar sayfasında turları filtrele
4. 2 tur seç → "AI ile Karşılaştır"
5. Claude Sonnet 4 seç → Karşılaştır
6. Sonuçları incele (skorlar, öneriler)
7. Chatbot'a soru sor
```

### Senaryo 2: Tur Şirketi
```
1. Ana sayfaya git
2. "Tur Şirketi Kaydı" → Kayıt ol (şirket adı ile)
3. Dashboard'da istatistikler gör
4. "Yeni Tur İlanı" → Form doldur
5. "Oluştur ve Onaya Gönder"
6. Status: pending (admin onayı bekle)
7. Onaylandı → Status: approved
8. Tur yayında, kullanıcılar görebilir
```

### Senaryo 3: Admin
```
1. Admin olarak giriş yap
2. "Tur Onayları" sayfasına git
3. Pending turları incele
4. Tur detaylarını oku
5. "Onayla" veya "Reddet" (nedeni belirt)
6. CSV Import ile toplu tur yükle
```

---

## 🎨 Design Guidelines

### Animasyon Kullanımı

**Ne Zaman Kullanılır:**
- Sayfa geçişleri: Fade in
- Kart girişleri: Scale + slide
- Hover effects: Subtle scale (1.05x)
- Loading: Skeleton screens
- Success: Bounce in
- Error: Shake

**Animasyon Süreleri:**
- Micro: 150ms
- Normal: 300ms
- Slow: 500ms
- Page: 600ms

**Easing Functions:**
- Default: cubic-bezier(0.4, 0, 0.2, 1)
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- Spring: Framer Motion spring physics

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  - Single column layouts
  - Full-width buttons
  - Stacked navigation
  - Larger touch targets
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  - 2 column grids
  - Horizontal navigation
}

/* Desktop */
@media (min-width: 1025px) {
  - 3 column grids
  - Full features
  - Hover effects
}
```

---

## 🔧 Teknik Detaylar

### Environment Variables

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017
EMERGENT_LLM_KEY=sk-emergent-xxx
JWT_SECRET_KEY=your-secret-key
```

**Frontend (.env):**
```
VITE_BACKEND_URL=https://your-domain.com
REACT_APP_BACKEND_URL=https://your-domain.com
```

### Database Schema

**users:**
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password_hash": "bcrypt hash",
  "role": "user|operator|admin",
  "company_name": "Şirket Adı", // operator için
  "created_at": ISODate
}
```

**tours:**
```json
{
  "_id": ObjectId,
  "title": "Tur Başlığı",
  "operator": "Şirket Adı",
  "price": 15000,
  "currency": "TRY",
  "start_date": "2024-12-01",
  "end_date": "2024-12-10",
  "duration": "10 gün",
  "hotel": "Otel bilgisi",
  "services": ["Hizmet1", "Hizmet2"],
  "visa": "Vize durumu",
  "transport": "Ulaşım",
  "guide": "Rehber",
  "itinerary": ["Gün 1", "Gün 2"],
  "rating": 4.5,
  "source": "manual|csv_import|operator",
  "status": "draft|pending|approved|rejected",
  "created_by": "email",
  "created_at": ISODate,
  "rejection_reason": "Red nedeni" // rejected için
}
```

**comparisons:**
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "tour_ids": ["id1", "id2"],
  "criteria": ["fiyat", "konfor"],
  "ai_provider": "openai|anthropic",
  "result": { /* AI response */ },
  "created_at": ISODate
}
```

**chats:**
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "message": "Soru",
  "context_tour_ids": ["id1"],
  "ai_provider": "openai|anthropic",
  "answer": "AI cevabı",
  "created_at": ISODate
}
```

---

## 📈 Performans

### Backend
- Health check: <100ms
- CRUD operations: <1s
- AI comparison (Claude): 12-15s ⚡
- AI comparison (OpenAI): 45-50s
- AI chat (Claude): 15s ⚡
- AI chat (OpenAI): 45-50s

### Frontend
- Initial load: <2s
- Page transitions: 300-600ms
- Hot reload (Vite): <200ms
- Animations: 60fps

### Optimizations
- Vite code splitting
- Lazy loading
- GPU-accelerated animations
- Image optimization
- Bundle size optimization

---

## 🔐 Güvenlik

**Authentication:**
- JWT tokens (7 gün geçerlilik)
- bcrypt password hashing
- Secure HTTP-only cookies (önerilir)

**Authorization:**
- Role-based access control
- Operator sadece kendi turlarını yönetir
- Admin tüm yetkilere sahip

**Validation:**
- Input sanitization
- Email format validation
- Password strength (min 6 karakter)
- Company name validation (operator için)

**Best Practices:**
- Environment variables (.env)
- CORS configured
- Rate limiting (planned)
- SQL injection koruması (MongoDB)

---

## 📱 Mobile Support

**Tested Viewports:**
- 390x844 (iPhone 12 Pro)
- 768x1024 (iPad)
- 1920x1080 (Desktop)

**Mobile Features:**
- Full-width buttons
- Touch-optimized (44x44px min)
- Stacked navigation
- Responsive grids
- Mobile-friendly forms

---

## ♿ Accessibility

**WCAG 2.1 AA Compliance:**
- Color contrast ratios
- Keyboard navigation
- Focus indicators
- ARIA labels
- Semantic HTML
- Reduced motion support

**Features:**
- `data-testid` on all interactive elements
- Alt text for images
- Form labels
- Error announcements
- Skip to main content

---

## 🌐 Internationalization (Planned)

**Current:** Türkçe only
**Planned:** English, Arabic

---

## 📞 Support

**Documentation:**
- `/app/README.md` - Genel bilgi
- `/app/DEPLOYMENT_GUIDE.md` - Deployment
- `/app/FEATURES.md` - Bu dosya
- `/app/CHANGELOG.md` - Değişiklikler

**Test Reports:**
- `/app/test_reports/iteration_1.json`
- `/app/test_reports/iteration_2.json`

**Platform URL:**
https://hajj-travel-assist.preview.emergentagent.com

---

## ✨ Gelecek Özellikler

**v1.1.0:**
- Email notifications
- Tour image uploads
- Advanced analytics
- Multi-language

**v1.2.0:**
- Payment integration
- Booking system
- Reviews and ratings
- Social sharing

---

**Son Güncelleme:** 19 Kasım 2024
**Versiyon:** 1.0.0
**Durum:** ✅ Production Ready
