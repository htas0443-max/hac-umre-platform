# 🚀 GitHub'a Yükleme Kılavuzu
## Hac & Umre Platformu

### Ön Hazırlık

**1. GitHub Hesabı:**
- https://github.com adresine gidin
- Hesabınız yoksa ücretsiz oluşturun
- Email doğrulaması yapın

---

### Adım 1: GitHub'da Repository Oluşturma

**1. GitHub'da yeni repository:**
- GitHub'a giriş yapın
- Sağ üst köşede **"+"** → **"New repository"**

**2. Repository ayarları:**
```
Repository name: hajj-umrah-platform
Description: AI destekli Hac ve Umre tur karşılaştırma platformu
Visibility: Public (veya Private)
☐ Initialize with README (BUNU İŞARETLEMEYİN - zaten var)
```

**3. "Create repository" tıklayın**

**4. Repository URL'yi kopyalayın:**
```
https://github.com/YOUR-USERNAME/hajj-umrah-platform.git
```

---

### Adım 2: Git Konfigürasyonu (Terminal/Console)

**Aşağıdaki komutları sırayla çalıştırın:**

```bash
# 1. Git bilgilerini ayarlayın (ilk kez kullanıyorsanız)
git config --global user.name "Hamza Taş"
git config --global user.email "your-email@example.com"

# 2. Proje klasörüne gidin
cd /app

# 3. Git initialize edin (zaten yapılmış olabilir)
git init

# 4. Dosyaları staging area'ya ekleyin
git add .

# 5. İlk commit yapın
git commit -m "feat: Hac & Umre AI Platform - Production Ready

✨ Features:
- AI-powered tour comparison (OpenAI GPT-5, Claude Sonnet 4)
- Tour operator listing system
- Admin approval workflow
- Supabase integration (PostgreSQL, Auth, Storage)
- Vite + React + TypeScript
- Framer Motion animations
- Advanced CSS animations (400+ lines)
- Mobile responsive
- Row Level Security (RLS)
- Real-time ready

🛠️ Tech Stack:
- Backend: FastAPI + Supabase
- Frontend: React 19 + TypeScript + Vite
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth
- AI: Emergent LLM Key (OpenAI, Claude)

📦 Deployment Ready:
- Vercel configuration
- Environment templates
- Full documentation

👤 Developer: Hamza Taş"

# 6. GitHub remote ekleyin (YOUR-USERNAME değiştirin!)
git remote add origin https://github.com/YOUR-USERNAME/hajj-umrah-platform.git

# 7. Branch adını main yapın
git branch -M main

# 8. GitHub'a push edin
git push -u origin main
```

---

### Adım 3: .gitignore Kontrolü

**.gitignore dosyası zaten var, kontrol edin:**

```bash
cat /app/.gitignore
```

**Şu dosyalar GİT'e GİTMEMELİ:**
- ❌ `.env` (şifreler var!)
- ❌ `node_modules/`
- ❌ `__pycache__/`
- ❌ `*.pyc`
- ❌ `.venv/`
- ❌ Test dosyaları

✅ `.gitignore` zaten doğru yapılandırılmış!

---

### Adım 4: Sensitive Data Temizleme

**Push yapmadan ÖNCE:**

```bash
# 1. .env dosyalarını kontrol edin
cat /app/backend/.env
cat /app/frontend/.env

# 2. Eğer şifreler varsa, onları SİLİN veya .env.example'a taşıyın
# 3. Asla gerçek API key'leri GitHub'a yüklemeyin!
```

**Güvenli yöntem:**
```bash
# .env dosyalarını git'ten çıkarın
git rm --cached backend/.env
git rm --cached frontend/.env

# .gitignore'a eklenerek commit edin
git add .gitignore
git commit -m "chore: remove sensitive .env files"
```

---

### Adım 5: Push ve Doğrulama

```bash
# Push edin
git push -u origin main

# Başarılı olursa:
# Enumerating objects: 150, done.
# Counting objects: 100% (150/150), done.
# ...
# To https://github.com/YOUR-USERNAME/hajj-umrah-platform.git
#  * [new branch]      main -> main
```

**GitHub'da kontrol:**
- Repository sayfasına gidin
- Dosyaları görüyor musunuz?
- README.md görünüyor mu?

---

### Adım 6: GitHub'dan Vercel'e Deploy

**1. Vercel'e gidin:** https://vercel.com

**2. "New Project" tıklayın**

**3. GitHub repository'yi seçin:**
- "Import Git Repository"
- hajj-umrah-platform'u seçin
- "Import" tıklayın

**4. Konfigürasyon:**
```
Framework Preset: Vite
Root Directory: frontend
Build Command: yarn build
Output Directory: build
Install Command: yarn install
```

**5. Environment Variables ekleyin:**
- VITE_BACKEND_URL
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

**6. "Deploy" tıklayın!**

---

### Hızlı Komutlar (Tek Seferde)

```bash
cd /app
git init
git add .
git commit -m "feat: Initial commit - Hac & Umre AI Platform by Hamza Taş"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hajj-umrah-platform.git
git push -u origin main
```

---

### Sorun Giderme

**"Permission denied" hatası:**
```bash
# GitHub personal access token oluşturun:
# GitHub → Settings → Developer settings → Personal access tokens
# Token'ı kopyalayın ve şifre yerine kullanın
```

**"Repository already exists":**
```bash
# Remote'u değiştirin
git remote set-url origin https://github.com/YOUR-USERNAME/hajj-umrah-platform.git
```

**Dosya çok büyük:**
```bash
# node_modules silindi mi kontrol edin
rm -rf frontend/node_modules
git add .
git commit -m "chore: remove node_modules"
```

---

### ✅ Tamamlandı!

**GitHub Repository:** https://github.com/YOUR-USERNAME/hajj-umrah-platform

**Vercel Deployment:** https://hajj-umrah-platform.vercel.app

**Custom Domain:** hacumreturlari.com (DNS ayarlarından sonra)

**Developer:** Hamza Taş ✨
