# 🛡️ UI Governance Rehberi

> **Versiyon:** 1.0  
> **Son Güncelleme:** 21 Ocak 2026  
> **Bağlayıcılık:** Tüm frontend geliştiricileri için zorunlu

---

## 1. Amaç ve Kapsam

### Amaç
Bu rehber, Hac & Umre Platform'un UI/UX tutarlılığını, erişilebilirliğini ve performansını korumak için **bağlayıcı kurallar** tanımlar.

### Kapsam
- Renkler, typography, spacing
- İkonlar ve görseller
- Butonlar ve form elementleri
- Erişilebilirlik (WCAG 2.1 AA)
- Mobil ve web deneyimi

### Referans Dökümanlar
- [Design System](./DESIGN_SYSTEM.md)
- [Icon Design System](./ICON_DESIGN_SYSTEM.md)
- [Dark Mode Kontrast Analizi](./DARK_MODE_CONTRAST_ANALYSIS.md)

---

## 2. Zorunlu Kurallar

### 2.1 Renkler

| Kural | Açıklama |
|-------|----------|
| **CSS Değişkenleri** | Tüm renkler `var(--token)` ile kullanılmalı |
| **Hardcode Yasağı** | `#0D9488` gibi doğrudan hex yazmak yasak |
| **Metin Kontrastı** | Minimum 4.5:1 (WCAG AA) |

### 2.2 Typography

| Kural | Açıklama |
|-------|----------|
| **Font Ailesi** | Sadece `Inter` ve sistem fallback'leri |
| **Minimum Boyut** | 12px (0.75rem) altı yasak |
| **Weight** | Sadece 400, 500, 600 kullan |

### 2.3 Spacing

| Kural | Açıklama |
|-------|----------|
| **8px Grid** | Spacing değerleri 8'in katları (4, 8, 16, 24, 32) |
| **Rastgele Değer** | 13px, 17px gibi değerler yasak |

### 2.4 İkonlar

| Kural | Açıklama |
|-------|----------|
| **Tek Kütüphane** | Sadece `lucide-react` |
| **Emoji Yasağı** | UI'da emoji kullanmak yasak |
| **aria-hidden** | Dekoratif ikonlarda zorunlu |
| **Tutarlılık** | Aynı anlam = aynı ikon |

### 2.5 Butonlar

| Kural | Açıklama |
|-------|----------|
| **Touch Target** | Minimum 44x44px (mobil) |
| **Hiyerarşi** | Sayfa başına max 1-2 primary buton |
| **İkon + Metin** | Icon size: 14-16px, gap: 0.375-0.5rem |

### 2.6 Erişilebilirlik

| Kural | Açıklama |
|-------|----------|
| **Focus Visible** | Klavye focus outline zorunlu |
| **ARIA Labels** | İnteraktif öğelerde zorunlu |
| **Reduced Motion** | `prefers-reduced-motion` desteği zorunlu |

---

## 3. Yasaklı Uygulamalar

### 🚫 Kesinlikle Yasak

| Kategori | Yasak Uygulama | Neden |
|----------|----------------|-------|
| **Renkler** | Inline hex `color="#0D9488"` | Tutarsızlık |
| **İkonlar** | Emoji kullanımı (🔥, ✅) | Profesyonellik |
| **İkonlar** | Font Awesome, Material Icons | Tek kütüphane kuralı |
| **Typography** | `font-weight: bold` | 700 yerine 600 kullan |
| **Spacing** | `margin: 17px` | 8px grid ihlali |
| **Erişilebilirlik** | `outline: none` | Focus kaldırma yasak |
| **Link/Button** | `<div onClick>` yerine `<button>` | Semantik HTML |

### ⚠️ Dikkat Gerektiren

| Durum | Risk | Çözüm |
|-------|------|-------|
| Yeni ikon ekleme | Tutarsızlık | Icon Design System'e ekle |
| Yeni renk tanımlama | Marka uyumu | Önce review al |
| Custom component | Duplikasyon | Mevcut component kullan |

---

## 4. Karar Matrisi

### Geliştirici Sorumluluğu

| Alan | Developer Yetkisi |
|------|-------------------|
| Mevcut component kullanımı | ✅ Karar verebilir |
| Mevcut renk/spacing | ✅ Karar verebilir |
| Mevcut ikonu farklı yerde kullanma | ✅ Karar verebilir |
| Minor UI tweaks | ✅ Karar verebilir |

### Reviewer Onayı Gerektiren

| Alan | Neden |
|------|-------|
| Yeni ikon ekleme | Tutarlılık kontrolü |
| Yeni renk tanımlama | Marka uyumu |
| Yeni component oluşturma | Duplikasyon önleme |
| Erişilebilirlik değişikliği | WCAG uyumu |
| Global CSS değişikliği | Regresyon riski |

### Onay Süreci

```
1. Developer: Değişiklik yap
2. Developer: Design System'e uy
3. PR: Reviewer kontrolü
4. Reviewer: Governance kurallarını doğrula
5. Merge: Onay sonrası
```

---

## 5. Neden Önemli?

### Kullanıcı Perspektifi

| Kural | Kullanıcı Faydası |
|-------|-------------------|
| Tutarlı renkler | Güven ve profesyonellik |
| 44px touch target | Kolay kullanım (mobil) |
| Focus visible | Klavye kullanıcıları için erişim |
| Min 12px font | Okunabilirlik |

### İş Perspektifi

| Kural | İş Faydası |
|-------|-----------|
| Tek ikon kütüphanesi | Küçük bundle, hızlı site |
| CSS değişkenleri | Kolay tema değişikliği |
| Component reuse | Hızlı geliştirme |
| 8px grid | Tasarım tutarlılığı |

### Teknik Perspektif

| Kural | Teknik Fayda |
|-------|-------------|
| Tree-shaking | Küçük bundle boyutu |
| Semantic HTML | SEO ve erişilebilirlik |
| CSS variables | Tema yönetimi |
| WCAG uyumu | Yasal uyumluluk |

---

## 6. Hızlı Kontrol Listesi

PR açmadan önce:

- [ ] CSS değişkenleri kullandım (`var(--token)`)
- [ ] 8px grid'e uydum (4, 8, 16, 24, 32)
- [ ] Sadece lucide-react kullandım
- [ ] Emoji kullanmadım
- [ ] Touch target min 44px
- [ ] Focus visible korudum
- [ ] aria-hidden ekledim (dekoratif ikonlar)
- [ ] Mobilde test ettim

---

> **İhlal Durumunda:** PR review'da reject edilir. Design System dökümanlarına uyum sağlandıktan sonra tekrar review talep edilir.
