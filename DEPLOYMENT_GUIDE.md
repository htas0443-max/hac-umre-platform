# 🚀 Vercel Deployment Kılavuzu

## Hac & Umre Tur Karşılaştırma Platformu

Bu kılavuz, platformunuzu Vercel'e deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Hazırlık

### Gerekli Hesaplar
1. ✅ **Vercel Hesabı**: https://vercel.com (GitHub ile giriş yapın)
2. ✅ **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas (Ücretsiz tier yeterli)
3. ✅ **GitHub Repository**: Kodunuzu yüklemek için

---

## 🗄️ MongoDB Atlas Kurulumu

### 1. Cluster Oluştur
```
1. MongoDB Atlas'a giriş yapın
2. "Create" → "Deploy a cloud database" → "M0 (Free)" seçin
3. Cloud Provider: AWS
4. Region: En yakın bölge (Europe/Frankfurt önerilir)
5. Cluster Name: hajj-umrah-cluster
6. "Create" tıklayın
```

### 2. Database User Oluştur
```
1. Database Access → "Add New Database User"
2. Authentication Method: Password
3. Username: hajj-admin
4. Password: Güçlü bir şifre oluşturun (kaydedin!)
5. Database User Privileges: "Read and write to any database"
6. "Add User"
```

### 3. Network Access Ayarla
```
1. Network Access → "Add IP Address"
2. "Allow Access from Anywhere" seçin (0.0.0.0/0)
3. Veya Vercel IP'lerini ekleyin
4. "Confirm"
```

### 4. Connection String Al
```
1. Databases → "Connect" → "Connect your application"
2. Driver: Python 3.11 or later
3. Connection string kopyalayın:
   mongodb+srv://hajj-admin:<password>@hajj-umrah-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
4. <password> kısmını gerçek şifrenizle değiştirin
```

---

## 🐙 GitHub Repository Hazırlama

### 1. Repository Oluştur
```bash
# GitHub'da yeni repository oluşturun: hajj-umrah-platform

# Local'de initialize edin
cd /app
git init
git add .
git commit -m \"feat: Hac & Umre AI Platform - Initial Release

Features:
- AI-powered tour comparison (OpenAI GPT-5, Claude Sonnet 4)
- Tour operator listing system with admin approval
- Advanced UX/UI with Framer Motion animations
- Vite build system for optimal performance
- MongoDB database integration
- JWT authentication
- TypeScript support
\"

# Remote ekleyin ve push edin
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hajj-umrah-platform.git
git push -u origin main
```

---

## ☁️ Vercel Deployment

### 1. Vercel'e Import Et

```
1. https://vercel.com/new adresine git
2. "Import Git Repository" seçin
3. GitHub repository'nizi seçin
4. Framework Preset: Vite
5. Root Directory: frontend
6. Build Command: yarn build
7. Output Directory: build
8. "Deploy" tıklamayın - önce environment variables ekleyin!
```

### 2. Environment Variables Ekle

**Vercel Dashboard → Settings → Environment Variables**

#### Backend Variables (Production, Preview, Development için):
```
MONGO_URL=mongodb+srv://hajj-admin:YOUR_PASSWORD@hajj-umrah-cluster.xxxxx.mongodb.net/hajj_umrah_db?retryWrites=true&w=majority

EMERGENT_LLM_KEY=sk-emergent-f4eB9197aB19f22404

JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long-change-this
```

#### Frontend Variables:
```
REACT_APP_BACKEND_URL=https://your-project-name.vercel.app
```

**ÖNEMLİ:** 
- Her variable için "Production", "Preview", "Development" üçünü de seçin
- JWT_SECRET_KEY için güçlü bir key üretin (minimum 32 karakter)
- REACT_APP_BACKEND_URL'yi deployment sonrası güncelleyebilirsiniz

### 3. Deploy Et
```
1. Tüm environment variables eklendiğinden emin olun
2. "Deploy" butonuna tıklayın
3. Deployment tamamlanana kadar bekleyin (~2-3 dakika)
4. "Visit" butonu ile sitenizi açın
```

---

## 🌐 Custom Domain Bağlama

### 1. Vercel'de Domain Ekle
```
1. Vercel Project → Settings → Domains
2. "Add Domain" tıklayın
3. Domain adınızı girin (örn: hajj-umrah.com)
4. "Add" tıklayın
```

### 2. DNS Ayarlarını Yapılandır

**Domain sağlayıcınızın DNS panelinde (GoDaddy, Namecheap, vb.):**

#### A Records:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

#### CNAME Records:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. SSL Sertifikası
- Vercel otomatik olarak Let's Encrypt SSL sertifikası ekler
- 5-10 dakika içinde aktif olur
- https:// ile erişebilirsiniz

---

## 🔧 Deployment Sonrası Ayarlar

### Frontend Environment URL Güncelleme

Deployment tamamlandıktan sonra:

```bash
# Vercel'den verilen URL'yi alın (örn: hajj-umrah-platform.vercel.app)

# Vercel Dashboard → Settings → Environment Variables
# REACT_APP_BACKEND_URL değerini güncelleyin:
REACT_APP_BACKEND_URL=https://hajj-umrah-platform.vercel.app

# Sonra "Redeploy" yapın
```

### İlk Admin Hesabı Oluşturma

```bash
# Vercel deployment sonrası, API'ye POST isteği gönderin:
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

---

## 🧪 Deployment Testi

### 1. API Test
```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Providers check
curl https://your-domain.vercel.app/api/providers/models
```

### 2. Frontend Test
```
1. Ana sayfayı ziyaret edin: https://your-domain.vercel.app
2. Kayıt olun (kullanıcı veya operator)
3. Giriş yapın
4. Tur listeleme, karşılaştırma, chatbot özelliklerini test edin
```

### 3. Operator Workflow Test
```
1. /operator/register ile şirket kaydı yapın
2. Dashboard'dan yeni tur oluşturun
3. Admin hesabı ile giriş yapın
4. /admin/approval sayfasından turu onaylayın
5. Normal kullanıcı olarak turların görünürlüğünü kontrol edin
```

---

## 🔄 Continuous Deployment

Vercel otomatik olarak:
- `main` branch'e her push'ta production deploy yapar
- Pull request'lerde preview deployment oluşturur
- Build hatalarını e-posta ile bildirir

```bash
# Kod güncellemesi yapmak için:
git add .
git commit -m \"feat: new feature\"
git push origin main

# Vercel otomatik olarak deploy eder!
```

---

## 🐛 Troubleshooting

### Build Hatası
```
1. Vercel Dashboard → Deployments → Failed deployment → "View Build Logs"
2. Hataları okuyun
3. Genellikle:
   - Missing environment variables
   - TypeScript type errors
   - Missing dependencies
```

### API Çalışmıyor
```
1. Environment variables kontrol edin (özellikle MONGO_URL)
2. MongoDB Atlas'ta network access ayarlarını kontrol edin
3. Vercel Functions logs'larını kontrol edin
```

### Frontend Backend Bağlanamıyor
```
1. REACT_APP_BACKEND_URL doğru mu?
2. CORS ayarları doğru mu? (server.py'de allow_origins)
3. /api prefix kullanılıyor mu?
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics
```
1. Vercel Dashboard → Analytics
2. Visitor stats, page views, performance metrics
```

### MongoDB Atlas Monitoring
```
1. Atlas Dashboard → Monitoring
2. Database operations, connections, performance
```

---

## 💰 Maliyet Tahmini

### Vercel (Hobby Plan - Ücretsiz)
- ✅ 100 GB bandwidth
- ✅ Serverless Functions
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ⚠️ Commercial use için Pro plan gerekli ($20/month)

### MongoDB Atlas (M0 Free Tier)
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ ~500-1000 concurrent users destekler
- ⚠️ Daha fazla için M10+ ($9/month)

### Emergent LLM Key
- ⚠️ Pay-per-use (token bazlı)
- Ortalama maliyet: $0.01-0.05 per comparison
- Budget ayarları: Emergent Dashboard

---

## 🔐 Güvenlik Önerileri

### Production için:
1. ✅ JWT_SECRET_KEY'i değiştirin (minimum 32 karakter)
2. ✅ MongoDB'de strong password kullanın
3. ✅ CORS ayarlarını production domain'e kısıtlayın
4. ✅ Rate limiting ekleyin (AI endpoints için)
5. ✅ Environment variables'ı asla commit etmeyin

### Örnek JWT Secret Oluşturma:
```python
import secrets
print(secrets.token_urlsafe(32))
# Çıktıyı JWT_SECRET_KEY olarak kullanın
```

---

## 📞 Destek

### Vercel Dokümantasyonu
- https://vercel.com/docs

### MongoDB Atlas Dokümantasyonu  
- https://www.mongodb.com/docs/atlas/

### Platform Issues
- GitHub Issues: https://github.com/YOUR-USERNAME/hajj-umrah-platform/issues

---

## ✅ Deployment Checklist

Deployment öncesi kontrol listesi:

- [ ] MongoDB Atlas cluster oluşturuldu
- [ ] Database user ve network access ayarlandı
- [ ] GitHub repository oluşturuldu ve kod push edildi
- [ ] Vercel hesabı açıldı
- [ ] Environment variables eklendi (backend & frontend)
- [ ] İlk deployment başarılı
- [ ] API health check çalışıyor
- [ ] Frontend açılıyor
- [ ] İlk admin hesabı oluşturuldu
- [ ] Operator registration test edildi
- [ ] AI comparison test edildi
- [ ] Custom domain bağlandı (opsiyonel)
- [ ] SSL sertifikası aktif

---

## 🎉 Deployment Başarılı!

Platform artık canlıda! 🚀

Kullanıcılar şunları yapabilir:
- ✅ Hac/Umre turlarını görüntüleme ve filtreleme
- ✅ AI ile tur karşılaştırma
- ✅ AI chatbot ile danışmanlık
- ✅ Tur şirketleri ilan verme
- ✅ Admin onay sistemi

**Platform URL**: https://your-domain.vercel.app

Başarılar! 🕋
