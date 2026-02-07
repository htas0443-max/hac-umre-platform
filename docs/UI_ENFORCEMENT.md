# ⚖️ UI Governance - Yaptırım Kuralları

> **Amaç:** Kaliteyi korumak, ekibi desteklemek

---

## Yaptırım Maddeleri

### 1. Geri Bildirim

Aşağıdaki durumlarda PR merge edilmeden önce **düzeltme istenir**:

- Design System'de tanımlı bir pattern yerine farklı bir çözüm kullanılmış
- Küçük spacing veya renk tutarsızlıkları var
- Accessibility önerisi yapılabilir

> Reviewer, sorunu ve çözümü açıkça belirtir. Developer düzeltir ve tekrar review ister.

---

### 2. PR Reddi

Aşağıdaki durumlarda PR **onaylanmaz**, düzeltme zorunludur:

- Emoji kullanılmış (Icon Design System ihlali)
- Focus outline kaldırılmış (Erişilebilirlik ihlali)
- Touch target 44px altında (Mobil UX ihlali)
- Hardcoded hex renk kullanılmış (`var()` yerine)

> PR reject edilir. Developer düzeltme yapar, tekrar review ister.

---

### 3. İstisna Talebi

Kuralların dışına çıkılması gerekiyorsa:

- PR açıklamasında gerekçe belirt
- Reviewer ile tartış
- Ortak karar al ve dökümante et

---

> **Not:** Bu kurallar kaliteyi korumak içindir, cezalandırmak için değil.
