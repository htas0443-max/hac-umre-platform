# 🎨 Hac & Umre Platform - Design System

> **Versiyon:** 1.0  
> **Son Güncelleme:** 21 Ocak 2026  
> **Kapsam:** Web ve Mobil Frontend

---

## 📋 İçindekiler

1. [Renk Sistemi](#1-renk-sistemi)
2. [Typography](#2-typography)
3. [Spacing](#3-spacing)
4. [Button Sistemi](#4-button-sistemi)
5. [Component Rehberi](#5-component-rehberi)
6. [Do / Don't](#6-do--dont)

---

## 1. Renk Sistemi

### Ana Palet

| Token | Hex | Kullanım |
|-------|-----|----------|
| `--primary-teal` | #0D9488 | Ana eylemler, linkler, focus |
| `--primary-teal-light` | #14B8A6 | Hover durumları |
| `--primary-teal-dark` | #0F766E | Active/pressed durumları |
| `--accent-gold` | #C9A227 | CTA vurgular, premium öğeler |
| `--accent-gold-light` | #E8D7A0 | Gold hover, dekoratif |

### Arka Plan Renkleri

| Token | Hex | Kullanım |
|-------|-----|----------|
| `--bg-primary` | #FFFFFF | Sayfa arka planı, kartlar |
| `--bg-secondary` | #F9FAFB | Alternatif bölümler |
| `--bg-tertiary` | #F3F4F6 | Input arka planları |
| `--bg-islamic` | #f8f6f0 | İslami temalı alanlar |

### Metin Renkleri

| Token | Hex | Kullanım | Min Kontrast |
|-------|-----|----------|--------------|
| `--text-primary` | #111827 | Başlıklar, ana içerik | 15:1 |
| `--text-secondary` | #6B7280 | Açıklamalar, meta | 5.1:1 |
| `--text-muted` | #9CA3AF | Placeholder, ipucu | 3.7:1 |

### Durum Renkleri

| Durum | Renk | Hex | Kullanım |
|-------|------|-----|----------|
| Success | Yeşil | #10B981 | Onay, başarı mesajları |
| Error | Kırmızı | #EF4444 | Hata, uyarı |
| Warning | Turuncu | #F59E0B | Dikkat, uyarı |
| Info | Mavi | #3B82F6 | Bilgi, ipucu |

### Renk Kullanım Kuralları

```
✅ DOĞRU:
- Primary teal: Butonlar, linkler, focus outline
- Gold: CTA butonları, öne çıkan kartlar
- Text-secondary: Alt başlıklar, meta bilgi

❌ YANLIŞ:
- Gold'u ana buton olarak her yerde kullanma
- Kırmızıyı hata dışında kullanma
- Text-muted'ı ana içerik için kullanma
```

---

## 2. Typography

### Font Ailesi

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Ölçek

| Level | Size | Weight | Line Height | Kullanım |
|-------|------|--------|-------------|----------|
| **h1** | 2rem (32px) | 600 | 1.3 | Sayfa başlıkları |
| **h2** | 1.5rem (24px) | 600 | 1.3 | Bölüm başlıkları |
| **h3** | 1.25rem (20px) | 600 | 1.3 | Kart başlıkları |
| **h4** | 1.1rem (18px) | 600 | 1.4 | Alt başlıklar |
| **body** | 1rem (16px) | 400 | 1.6 | Ana içerik |
| **small** | 0.875rem (14px) | 400 | 1.5 | Meta, etiketler |
| **caption** | 0.75rem (12px) | 500 | 1.4 | Badge, timestamp |

### Mobil Ölçek

| Level | Desktop | Mobile |
|-------|---------|--------|
| h1 | 2rem | 1.75rem |
| h2 | 1.5rem | 1.25rem |
| h3 | 1.25rem | 1.1rem |
| body | 1rem | 0.95rem |

### Typography Kuralları

```
✅ DOĞRU:
- Sayfa başına tek h1
- Hiyerarşik başlık kullanımı (h1 > h2 > h3)
- Body text için line-height: 1.6

❌ YANLIŞ:
- h1'i vurgu için kullanma
- h2'den h4'e atlama
- 12px'den küçük metin (mobil)
```

---

## 3. Spacing

### Ölçek (8px Base)

| Token | Value | Kullanım |
|-------|-------|----------|
| `xs` | 0.25rem (4px) | İkon-metin arası |
| `sm` | 0.5rem (8px) | Kompakt öğeler arası |
| `md` | 1rem (16px) | Standart padding |
| `lg` | 1.5rem (24px) | Kart padding |
| `xl` | 2rem (32px) | Section arası |
| `2xl` | 3rem (48px) | Büyük bölüm arası |

### Component-Specific Spacing

| Component | Padding | Gap |
|-----------|---------|-----|
| **Button** | 0.625rem 1.25rem | 0.5rem (icon+text) |
| **Button Small** | 0.5rem 1rem | 0.375rem |
| **Card** | 1.5rem | - |
| **Card (mobile)** | 1.25rem | - |
| **Form Input** | 0.75rem 1rem | - |
| **Alert** | 1rem | 0.5rem |
| **Badge** | 0.25rem 0.625rem | 0.25rem |

### Spacing Kuralları

```
✅ DOĞRU:
- 8px grid sistemine uyum
- Tutarlı padding ve margin
- Component içi xs/sm, arası md/lg

❌ YANLIŞ:
- Rastgele piksel değerleri (13px, 17px)
- Aşırı tight spacing (< 4px)
- Tutarsız section aralıkları
```

---

## 4. Button Sistemi

### Türler ve Hiyerarşi

| Tür | Class | Kullanım | Sayfa Başına |
|-----|-------|----------|--------------|
| **Primary** | `.btn-primary` | Ana eylem | 1-2 |
| **Gold** | `.btn-gold` | Premium CTA | 0-1 |
| **Secondary** | `.btn-secondary` | İkincil eylem | 1-3 |
| **Outline** | `.btn-outline` | Üçüncül eylem | Sınırsız |

### Boyutlar

| Boyut | Class | Min Height | Kullanım |
|-------|-------|------------|----------|
| Default | `.btn` | 44px (mobil) | Form submit, ana aksiyonlar |
| Small | `.btn-small` | 40px (mobil) | Tablo, kart içi |

### Button Durumları

| Durum | Stil |
|-------|------|
| Default | Tanımlı arka plan |
| Hover | Daha koyu ton, translateY(-2px) |
| Active | translateY(0) |
| Focus | 2px teal outline |
| Disabled | opacity: 0.5 |

### İkon + Metin

```tsx
// ✅ DOĞRU
<button className="btn btn-primary">
  <Mail size={16} aria-hidden="true" /> Gönder
</button>

// ❌ YANLIŞ - ikon çok büyük
<button className="btn btn-primary">
  <Mail size={24} /> Gönder
</button>
```

| Buton Boyutu | İkon Boyutu | Gap |
|--------------|-------------|-----|
| Default | 16px | 0.5rem |
| Small | 14px | 0.375rem |

### Button Kullanım Kuralları

```
✅ DOĞRU:
- Sayfa başına tek primary CTA
- Form submit için btn-primary
- İptal/geri için btn-outline
- Loading state'de disabled + spinner

❌ YANLIŞ:
- Her butonu btn-primary yapmak
- Link yerine buton kullanmak
- İkonsuz loading text ("Yükleniyor...")
```

---

## 5. Component Rehberi

### Card

```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Başlık</h3>
  </div>
  <p>İçerik</p>
</div>
```

| Varyant | Kullanım |
|---------|----------|
| `.card` | Standart kart |
| `.card.glass` | Şeffaf arka plan |
| `.islamic-card` | İslami dekoratif |

### Alert

| Varyant | Class | Kullanım |
|---------|-------|----------|
| Success | `.alert-success` | Başarı bildirimi |
| Error | `.alert-error` | Hata mesajı |
| Warning | `.alert-warning` | Uyarı |
| Info | `.alert-info` | Bilgi |

### Badge

| Varyant | Kullanım |
|---------|----------|
| Default | Durum gösterge |
| `.badge-gold` | Premium/öne çıkan |

### Form Elements

| Element | Class | Kullanım |
|---------|-------|----------|
| Input | `.form-input` | Tüm text inputlar |
| Label | `.form-label` | Form etiketleri |
| Group | `.form-group` | Input + label wrapper |

---

## 6. Do / Don't

### ✅ DO (Yapılmalı)

| Kategori | Kural |
|----------|-------|
| **Renkler** | Tema değişkenlerini kullan (`var(--primary-teal)`) |
| **Typography** | Font weight için 400, 500, 600 kullan |
| **Spacing** | 8px grid sistemine uy (4, 8, 16, 24, 32) |
| **Buttons** | İkon + metin için `gap` kullan |
| **Mobile** | min-height: 44px touch target |
| **İkonlar** | Dekoratif ikonlara `aria-hidden="true"` |
| **Focus** | `:focus-visible` ile görünür outline |

### ❌ DON'T (Yapılmamalı)

| Kategori | Kural |
|----------|-------|
| **Renkler** | Hardcoded hex değerleri kullanma |
| **Typography** | 12px'den küçük metin kullanma |
| **Spacing** | Rastgele piksel değerleri (13px, 17px) |
| **Buttons** | Link yerine buton, buton yerine div |
| **Mobile** | Touch target < 44px |
| **İkonlar** | Emoji kullanma, farklı kütüphane |
| **Accessibility** | Focus outline'ı kaldırma |

### Hızlı Referans

```css
/* ✅ Doğru */
color: var(--primary-teal);
padding: 1rem 1.5rem;
font-weight: 500;
border-radius: 8px;

/* ❌ Yanlış */
color: #0D9488;
padding: 15px 22px;
font-weight: bold;
border-radius: 7px;
```

---

> **Not:** Bu dokümantasyon yaşayan bir belgedir. Yeni component veya pattern eklendiğinde güncellenmelidir.
> 
> **İlgili Dökümanlar:**
> - [Icon Design System](./ICON_DESIGN_SYSTEM.md)
> - [Dark Mode Kontrast Analizi](./DARK_MODE_CONTRAST_ANALYSIS.md)
