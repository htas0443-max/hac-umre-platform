# ✅ UI Pull Request Checklist

> Her UI değişikliği içeren PR için zorunlu kontrol listesi.

---

## Değişiklik Yapan Geliştirici

PR açmadan önce aşağıdaki maddeleri kontrol edin:

- [ ] **Renkler:** Tüm renklerde CSS değişkenleri kullandım (`var(--primary-teal)` vb.)
  > Hardcoded hex değerler (`#0D9488`) yasak.

- [ ] **Spacing:** 8px grid sistemine uydum (4, 8, 16, 24, 32px)
  > Rastgele değerler (13px, 17px) yasak.

- [ ] **İkonlar:** Sadece `lucide-react` kullandım, emoji kullanmadım
  > Font Awesome, Material Icons veya herhangi bir emoji yasak.

- [ ] **Touch Target:** Tüm butonlar ve tıklanabilir alanlar minimum 44x44px
  > Mobil kullanılabilirlik için zorunlu.

- [ ] **Accessibility:** Focus visible korudum, dekoratif ikonlara `aria-hidden="true"` ekledim
  > `:focus-visible` outline kaldırılmamalı.

- [ ] **Mobil Test:** Değişiklikleri mobil ekranda test ettim
  > 375px genişlikte görünümü kontrol et.

---

## Reviewer Kontrolü

| Madde | Kontrol |
|-------|---------|
| Design System uyumu | ✅ / ❌ |
| Icon Design System uyumu | ✅ / ❌ |
| WCAG 2.1 AA uyumu | ✅ / ❌ |
| Mobil UX | ✅ / ❌ |

---

## Referanslar

- [Design System](./DESIGN_SYSTEM.md)
- [Icon Design System](./ICON_DESIGN_SYSTEM.md)
- [UI Governance](./UI_GOVERNANCE.md)
