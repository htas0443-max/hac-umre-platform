# 🚀 UI Onboarding & Kullanım Kılavuzu

> **Hedef:** İlk günden doğru UI geliştirmek  
> **Kapsam:** Frontend ve Full-stack geliştiriciler, Reviewer'lar

---

## 1. UI Felsefesi

Bu projede **tutarlılık, erişilebilirlik ve performans** önceliklidir.

**Neden Design System var?**
- Kullanıcı deneyimi tutarlılığı
- Hızlı geliştirme (tekerleği yeniden icat etme)
- Marka bütünlüğü
- WCAG 2.1 AA uyumu

---

## 2. Doküman Rehberi

| Doküman | Ne Zaman Kullanılır? |
|---------|---------------------|
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Renk, typography, spacing, component kullanırken |
| [ICON_DESIGN_SYSTEM.md](./ICON_DESIGN_SYSTEM.md) | İkon eklerken veya kullanırken |
| [UI_GOVERNANCE.md](./UI_GOVERNANCE.md) | Kuralları ve yasakları kontrol ederken |
| [UI_ADDITION_FLOW.md](./UI_ADDITION_FLOW.md) | Yeni UI eklerken karar verirken |
| [UI_PR_CHECKLIST.md](./UI_PR_CHECKLIST.md) | PR açmadan hemen önce |
| [UI_ENFORCEMENT.md](./UI_ENFORCEMENT.md) | PR reject edildiğinde referans |

---

## 3. Temel Geliştirme Adımları

```
1. İhtiyacı tanımla
2. Design System'de mevcut mu? → BAK
3. Mevcut varsa → KULLAN
4. Mevcut yoksa → Reviewer'a DANIŞI
5. PR Checklist'i doldur
6. PR aç
```

---

## 4. Sık Yapılan Hatalar

| Hata | Doğrusu |
|------|---------|
| `🔥` emoji kullanmak | `<Flame />` Lucide ikon |
| `color: #0D9488` | `color: var(--primary-teal)` |
| `margin: 17px` | `margin: 1rem` (16px) |
| `font-weight: bold` | `font-weight: 600` |
| `outline: none` | `:focus-visible` korumak |
| `<div onClick>` | `<button>` kullanmak |

---

## 5. PR Açmadan Önce

1. ✅ [UI PR Checklist](./UI_PR_CHECKLIST.md) doldur
2. ✅ Mobilde test et (375px)
3. ✅ Klavye ile gezin (Tab tuşu)
4. ✅ Yeni pattern varsa dokümanı güncelle

---

## 6. PR Review Sürecinde Beklenenler

**Developer'dan:**
- Checklist tamamlanmış olmalı
- Değişiklik açıklaması net olmalı
- Yeni pattern için doküman güncellemesi yapılmış olmalı

**Reviewer'dan:**
- Design System uyumu kontrolü
- Erişilebilirlik kontrolü
- Mobil UX kontrolü
- Yapıcı geri bildirim

---

## 7. Ne Zaman Soru Sor?

| Durum | Karar |
|-------|-------|
| Mevcut component var | ✅ Kendin karar ver |
| Mevcut renk/spacing kullanıyorum | ✅ Kendin karar ver |
| Yeni ikon gerekiyor | ❓ Soru sor |
| Yeni renk gerekiyor | ❓ Soru sor |
| Yeni component gerekiyor | ❓ Soru sor |
| Kuraldan sapmak gerekiyor | ❓ Soru sor |

---

## 8. Do / Don't

### ✅ Do

- CSS değişkenleri kullan
- Lucide ikonları kullan
- 8px grid'e uy
- 44px touch target sağla
- Focus outline koru

### ❌ Don't

- Emoji kullanma
- Hardcoded hex yazma
- Rastgele spacing kullanma
- Font Awesome import etme
- outline: none yazma

---

## 9. ALTIN KURALLAR

| # | Kural |
|---|-------|
| 1 | **Renkler:** Sadece `var(--token)` kullan |
| 2 | **İkonlar:** Sadece lucide-react, emoji yasak |
| 3 | **Spacing:** 8px grid (4, 8, 16, 24, 32) |
| 4 | **Touch:** Minimum 44x44px |
| 5 | **Focus:** Outline'ı asla kaldırma |

---

> **İlk gün yapılacaklar:** Bu dokümanı ve referans verilen 6 dokümanı oku.  
> **Soru varsa:** Reviewer'a danış, tahmin etme.
