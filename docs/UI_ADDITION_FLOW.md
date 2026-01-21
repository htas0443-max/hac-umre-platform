# 🔄 Yeni UI Ekleme Akışı

> **Bağlayıcılık:** Tüm UI değişiklikleri için zorunlu süreç

---

## 1. Karar Ağacı

```
┌─────────────────────────────────────┐
│  Yeni bir UI ihtiyacı doğdu         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Design System'de karşılığı VAR MI? │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
   ✅ VAR            ❌ YOK
      │                 │
      ▼                 ▼
┌──────────┐    ┌──────────────────┐
│ Mevcut   │    │ Reviewer onayı   │
│ kullan   │    │ gerekli          │
└────┬─────┘    └────────┬─────────┘
     │                   │
     ▼                   ▼
┌──────────┐    ┌──────────────────┐
│ PR aç    │    │ Design System'e  │
│          │    │ ekle + PR aç     │
└──────────┘    └──────────────────┘
```

---

## 2. Adım Adım Süreç

### Adım 1: İhtiyacı Tanımla
- Ne eklenmek isteniyor? (ekran, component, varyant)
- Hangi problemi çözüyor?

### Adım 2: Design System'i Kontrol Et
- [Design System](./DESIGN_SYSTEM.md) oku
- [Icon Design System](./ICON_DESIGN_SYSTEM.md) kontrol et
- Mevcut component/pattern var mı?

### Adım 3: Karar Ver

| Durum | Aksiyon | Onay |
|-------|---------|------|
| **Mevcut component var** | Kullan | Developer karar verir |
| **Mevcut yok, yeni gerekli** | Reviewer'a danış | Reviewer onayı zorunlu |
| **Mevcut var, varyant gerekli** | Reviewer'a danış | Reviewer onayı zorunlu |

### Adım 4: Uygula ve Dökümante Et

| Yeni Ekleme | Güncellenmesi Gereken Doküman |
|-------------|-------------------------------|
| Yeni ikon | Icon Design System |
| Yeni renk | Design System - Renkler |
| Yeni component | Design System - Components |
| Yeni spacing değeri | Design System - Spacing |

### Adım 5: PR Aç
- [UI PR Checklist](./UI_PR_CHECKLIST.md) doldur
- Değişiklik açıklamasına referans ekle

---

## 3. PR Açma Kuralları

### ✅ PR Açılabilir

- Design System'de mevcut component kullanıldıysa
- Reviewer onayı alındıysa
- Checklist tamamlandıysa

### ❌ PR Açılamaz

- Yeni pattern/component onay almadan
- Design System dokümanı güncellenmeden
- Checklist tamamlanmadan

---

## 4. Örnek Senaryolar

### Senaryo 1: Yeni Buton Kullanımı

```
İhtiyaç: "Favorilere Ekle" butonu

1. Design System kontrol → btn-outline mevcut ✅
2. Icon System kontrol → Heart ikonu mevcut ✅
3. Aksiyon: Mevcut kullan
4. Onay: Developer karar verir
5. PR aç
```

### Senaryo 2: Yeni Renk İhtiyacı

```
İhtiyaç: "Premium" için mor renk

1. Design System kontrol → Mor renk YOK ❌
2. Aksiyon: Reviewer'a danış
3. Onay: Reviewer onayı al
4. Aksiyon: Design System'e renk ekle
5. PR aç (doküman güncellemesi dahil)
```

---

## 5. Referanslar

| Doküman | İçerik |
|---------|--------|
| [Design System](./DESIGN_SYSTEM.md) | Renkler, typography, spacing, components |
| [Icon Design System](./ICON_DESIGN_SYSTEM.md) | İkon kuralları ve eşleme tablosu |
| [UI Governance](./UI_GOVERNANCE.md) | Zorunlu kurallar ve yasaklar |
| [UI PR Checklist](./UI_PR_CHECKLIST.md) | PR öncesi kontrol listesi |
