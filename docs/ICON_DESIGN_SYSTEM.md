# 🎨 Hac & Umre Platform - Icon Design System

> **Versiyon:** 1.0  
> **Son Güncelleme:** 21 Ocak 2026  
> **Kapsam:** Web ve Mobil Frontend

---

## 📋 İçindekiler

1. [Genel Kurallar](#1-genel-kurallar)
2. [Anlam → İkon Eşleme Tablosu](#2-anlam--ikon-eşleme-tablosu)
3. [Boyut Rehberi](#3-boyut-rehberi)
4. [React (TSX) Kullanım Örnekleri](#4-react-tsx-kullanım-örnekleri)
5. [Yeni İkon Ekleme Prosedürü](#5-yeni-ikon-ekleme-prosedürü)
6. [Yasak Kullanımlar](#6-yasak-kullanımlar)

---

## 1. Genel Kurallar

### ✅ ZORUNLU Kurallar

| Kural | Açıklama |
|-------|----------|
| **Tek Kütüphane** | Yalnızca `lucide-react` kullanılır |
| **Emoji Yasağı** | UI'da emoji kullanımı **kesinlikle yasaktır** |
| **Tutarlılık** | Aynı anlam için her zaman aynı ikon kullanılır |
| **Stroke Width** | Tüm ikonlar `strokeWidth={2}` ile kullanılır |
| **Erişilebilirlik** | Dekoratif ikonlarda `aria-hidden="true"` |

### 🎨 Renk Standartları

```typescript
// Tema renkleri (App.css'den)
const ICON_COLORS = {
  primary: 'var(--primary-teal)',      // #0D9488 - Ana eylemler
  gold: 'var(--accent-gold)',          // #D4AF37 - Vurgular, yıldızlar
  muted: 'var(--text-muted)',          // Gri - İkincil bilgiler
  success: '#10B981',                   // Yeşil - Onay, başarı
  error: '#EF4444',                     // Kırmızı - Hata, uyarı
  warning: '#F59E0B',                   // Turuncu - Dikkat
  current: 'currentColor',              // Metin rengi ile aynı
};
```

---

## 2. Anlam → İkon Eşleme Tablosu

### 🏠 Navigasyon & Genel

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Ana Sayfa | `<Home />` | `Home` |
| Turlar / Dünya | `<Globe />` | `Globe` |
| Karşılaştırma | `<RefreshCw />` | `RefreshCw` |
| Rehber / Kitap | `<BookOpen />` | `BookOpen` |
| Dashboard | `<BarChart3 />` | `BarChart3` |
| Ayarlar | `<Settings />` | `Settings` |
| Menü | `<Menu />` | `Menu` |
| Kapat | `<X />` | `X` |
| Geri | `<ArrowLeft />` | `ArrowLeft` |
| İleri | `<ArrowRight />` | `ArrowRight` |

### 👤 Kullanıcı & Kimlik

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Kullanıcı | `<User />` | `User` |
| E-posta | `<Mail />` | `Mail` |
| Şifre / Kilit | `<Lock />` | `Lock` |
| Şifre Göster | `<Eye />` | `Eye` |
| Şifre Gizle | `<EyeOff />` | `EyeOff` |
| Giriş Yap | `<LogIn />` | `LogIn` |
| Çıkış Yap | `<LogOut />` | `LogOut` |
| Anahtar | `<Key />` | `Key` |
| Kalkan / Güvenlik | `<Shield />` | `Shield` |

### 🏨 Tur & Otel

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Otel | `<Building2 />` | `Building2` |
| Şirket / Operatör | `<Building />` | `Building` |
| Uçak | `<Plane />` | `Plane` |
| Kalkış | `<PlaneTakeoff />` | `PlaneTakeoff` |
| İniş | `<PlaneLanding />` | `PlaneLanding` |
| Konum | `<MapPin />` | `MapPin` |
| Takvim / Tarih | `<Calendar />` | `Calendar` |
| Paket / Hizmetler | `<Package />` | `Package` |
| Yıldız / Puan | `<Star />` | `Star` |
| Telefon | `<Phone />` | `Phone` |

### ✅ Durum & Eylem

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Onay / Başarı | `<CheckCircle />` | `CheckCircle` |
| Basit Tik | `<Check />` | `Check` |
| Hata / İptal | `<XCircle />` | `XCircle` |
| Uyarı | `<AlertTriangle />` | `AlertTriangle` |
| Bilgi | `<Info />` | `Info` |
| Yardım | `<HelpCircle />` | `HelpCircle` |
| Bekleniyor | `<Clock />` | `Clock` |
| Yükleniyor | `<RefreshCw />` | `RefreshCw` (animate) |

### 💬 İletişim & Destek

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Mesaj / Chat | `<MessageCircle />` | `MessageCircle` |
| Destek Talebi | `<Ticket />` | `Ticket` |
| Gönder | `<Send />` | `Send` |
| Gelen Kutusu | `<Inbox />` | `Inbox` |
| Pano / Liste | `<ClipboardList />` | `ClipboardList` |

### 🔍 Arama & Aksiyon

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Arama | `<Search />` | `Search` |
| Filtre | `<Filter />` | `Filter` |
| Düzenle | `<Edit />` | `Edit` |
| Sil | `<Trash2 />` | `Trash2` |
| Ekle | `<Plus />` | `Plus` |
| Çıkar | `<Minus />` | `Minus` |
| Yükle | `<Upload />` | `Upload` |
| İndir | `<Download />` | `Download` |
| Kopyala | `<Copy />` | `Copy` |
| Dış Link | `<ExternalLink />` | `ExternalLink` |

### 🤖 AI & Özel

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| AI / Robot | `<Bot />` | `Bot` |
| Beyin / Zeka | `<Brain />` | `Brain` |
| Işık / Öneri | `<Lightbulb />` | `Lightbulb` |
| Hedef | `<Target />` | `Target` |
| Kupa / Ödül | `<Trophy />` | `Trophy` |
| Hız / Performans | `<Zap />` | `Zap` |
| Sparkles | `<Sparkles />` | `Sparkles` |
| Roket | `<Rocket />` | `Rocket` |
| Parti | `<PartyPopper />` | `PartyPopper` |

### 📄 Döküman & Dosya

| Anlam | Lucide İkon | Import Adı |
|-------|-------------|------------|
| Dosya / Döküman | `<FileText />` | `FileText` |
| Dosya Onaylı | `<FileCheck />` | `FileCheck` |
| Klasör | `<FolderUp />` | `FolderUp` |
| Ödül / Rozet | `<Award />` | `Award` |

---

## 3. Boyut Rehberi

### 📱 Mobil Boyutlar

| Kullanım Alanı | Boyut (px) | Özellik |
|----------------|------------|---------|
| Bottom Nav İkonları | 20-24 | `size={20}` |
| Liste Item İkonları | 16-18 | `size={16}` |
| Buton İçi İkonlar | 14-16 | `size={14}` |
| Form Label İkonları | 14-16 | `size={16}` |
| Büyük Dekoratif | 48-64 | `size={48}` |

### 💻 Web Boyutları

| Kullanım Alanı | Boyut (px) | Özellik |
|----------------|------------|---------|
| Navbar / Header | 18-24 | `size={18}` |
| Sidebar İkonları | 20-24 | `size={20}` |
| Sayfa Başlığı | 24-28 | `size={24}` |
| Buton İçi İkonlar | 14-18 | `size={16}` |
| Form Label İkonları | 14-16 | `size={16}` |
| Büyük Dekoratif | 48-64 | `size={48}` |
| Hero / Empty State | 64-96 | `size={64}` |

### 📐 Boyut Sabitleri (Önerilen)

```typescript
const ICON_SIZES = {
  xs: 12,   // Çok küçük badge'ler
  sm: 14,   // Buton içi, küçük etiketler
  md: 16,   // Standart form label
  lg: 20,   // Navigation, liste
  xl: 24,   // Sayfa başlığı
  '2xl': 32, // Büyük vurgu
  '3xl': 48, // Empty state
  '4xl': 64, // Hero alanları
};
```

---

## 4. React (TSX) Kullanım Örnekleri

### ✅ Doğru Kullanım

```tsx
// 1. Import
import { Home, Mail, Lock, CheckCircle } from 'lucide-react';

// 2. Basit Kullanım
<Home size={20} />

// 3. Renkli Kullanım
<CheckCircle size={16} color="#10B981" />
<Mail size={16} color="var(--primary-teal)" />

// 4. Tema Renkleri ile
<Lock size={16} color="var(--text-muted)" />

// 5. Buton İçinde
<button className="btn btn-primary">
  <Mail size={14} style={{ marginRight: '0.5rem' }} />
  Gönder
</button>

// 6. Form Label'da
<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <Lock size={16} /> Şifre
</label>

// 7. Dinamik İçerikte
{loading ? (
  <><RefreshCw size={14} /> Yükleniyor...</>
) : (
  <><CheckCircle size={14} /> Tamamlandı</>
)}

// 8. Erişilebilirlik ile
<Home size={20} aria-hidden="true" />
```

### ❌ Yanlış Kullanım

```tsx
// YANLIŞ: Emoji kullanımı
<button>📧 Gönder</button>  // ❌

// YANLIŞ: Farklı kütüphane
import { FaHome } from 'react-icons/fa';  // ❌

// YANLIŞ: Sabit piksel değeri yerine string
<Home size="20px" />  // ❌ → size={20} kullan

// YANLIŞ: Tutarsız ikon kullanımı
// Bir yerde <Mail /> diğer yerde <Envelope /> ❌
```

---

## 5. Yeni İkon Ekleme Prosedürü

### Adım 1: İhtiyaç Analizi

```
□ Bu anlam için mevcut tabloda ikon var mı?
□ Lucide kütüphanesinde uygun ikon var mı?
□ Birden fazla aday varsa hangisi daha evrensel?
```

### Adım 2: Seçim ve Onay

1. [Lucide Icons](https://lucide.dev/icons/) sitesinden ikon ara
2. En az 2 alternatif belirle
3. Ekip ile tartış ve tek bir ikon seç
4. Bu dokümana ekle

### Adım 3: Kullanım

```tsx
// 1. Import ekle
import { NewIcon } from 'lucide-react';

// 2. Boyut ve renk standardına uy
<NewIcon size={16} color="var(--primary-teal)" />
```

### Adım 4: Dokümantasyon

Bu dosyadaki ilgili tabloya yeni ikonu ekle:

```markdown
| Yeni Anlam | `<NewIcon />` | `NewIcon` |
```

---

## 6. Yasak Kullanımlar

### 🚫 İkon KULLANILMAYACAK Yerler

| Alan | Neden |
|------|-------|
| **Validation mesajları** | Metin yeterli, ikon karmaşıklık ekler |
| **Hata detay metinleri** | Backend'den gelen metinler dokunulmaz |
| **Placeholder metinleri** | Form input placeholder'larında ikon yok |
| **API response içerikleri** | Dinamik backend verileri |
| **CATEGORY_LABELS** | Sabit dizeler, tutarlılık için değiştirilmez |
| **STATUS_TABS** | UI sabitleri, mevcut yapı korunur |
| **Toast mesajları** | Kısa bildirimler, ikon gereksiz |

### 🚫 ASLA Kullanılmayacaklar

| Yasak | Alternatif |
|-------|------------|
| Emoji (🔥, ✅, ⚠️, vb.) | Lucide icon |
| Font Awesome | Lucide icon |
| Material Icons | Lucide icon |
| React Icons karma | Lucide icon |
| SVG inline | Lucide component |
| PNG/JPG ikon | Lucide icon |

---

## 📚 Kaynaklar

- [Lucide Icons Resmi Sitesi](https://lucide.dev/)
- [Lucide React GitHub](https://github.com/lucide-icons/lucide)
- [Lucide Icons Arama](https://lucide.dev/icons/)

---

> **Not:** Bu dokümantasyon yaşayan bir belgedir. Yeni gereksinimler ortaya çıktıkça güncellenmelidir.
