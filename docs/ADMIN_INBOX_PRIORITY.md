# 📥 Admin İnceleme Kutusu (Inbox) Tasarımı

> **Amaç:** Kritik işleri önce görmek, karar hatalarını azaltmak

---

## Öncelik Seviyeleri

| Seviye | Renk | Hangi İlanlar? | Sıra |
|--------|------|----------------|------|
| 🔴 **Yüksek Risk** | Kırmızı | Dikkat etiketli, çoklu ret, şüpheli davranış | 1. sıra (en üstte) |
| 🟠 **Orta Risk** | Turuncu | Yeni firma, ilk ilan, belge sorunu | 2. sıra |
| 🟢 **Düşük Risk** | Yeşil | Belgeli firma, geçmiş onaylı, rutin | 3. sıra (en altta) |

---

## Detaylı Seviye Tanımları

### 🔴 Yüksek Risk

| Alan | Değer |
|------|-------|
| **Hangi İlanlar?** | |
| - Dikkat etiketi taşıyan firma | ✅ |
| - 3+ ret / son 7 gün | ✅ |
| - Tekrarlayan içerik tespit edilmiş | ✅ |
| - Belge uyumsuzluğu | ✅ |
| **Admin Etiketi** | "Dikkat gerektiren ilan" |
| **Otomatik Aksiyon** | ❌ Yok, manuel inceleme zorunlu |

---

### 🟠 Orta Risk

| Alan | Değer |
|------|-------|
| **Hangi İlanlar?** | |
| - Yeni kayıt olmuş firma (< 30 gün) | ✅ |
| - Firmanın ilk ilanı | ✅ |
| - Belge süresi dolmak üzere | ✅ |
| - Düzenleme limiti yaklaşmış | ✅ |
| **Admin Etiketi** | "İnceleme önerilir" |
| **Otomatik Aksiyon** | ❌ Yok, manuel inceleme |

---

### 🟢 Düşük Risk

| Alan | Değer |
|------|-------|
| **Hangi İlanlar?** | |
| - Belgeleri onaylı firma | ✅ |
| - 3+ başarılı geçmiş ilan | ✅ |
| - 6+ ay sorunsuz hesap | ✅ |
| - Rutin düzenleme | ✅ |
| **Admin Etiketi** | "Rutin kontrol" |
| **Otomatik Aksiyon** | ✅ Otomatik onay (opsiyonel) |

---

## Listeleme Sırası

```
1. 🔴 Yüksek Risk ilanları (en üstte)
2. 🟠 Orta Risk ilanları
3. 🟢 Düşük Risk ilanları (en altta)

Her seviye içinde: Eski tarihli → Yeni tarihli
```

---

## Admin Inbox Örnek Görünümü

```
┌─────────────────────────────────────────────────────┐
│ 📥 İnceleme Kutusu                    [12 bekliyor] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🔴 Yüksek Risk (3)                                 │
│ ├─ ABC Tur - "Tekrarlayan ilan içeriği"            │
│ ├─ XYZ Travel - "Sık reddedilen başvurular"        │
│ └─ 123 Hac - "Dikkat etiketli firma"               │
│                                                     │
│ 🟠 Orta Risk (5)                                   │
│ ├─ Yeni Firma A - "İlk ilan"                       │
│ ├─ Firma B - "Belge süresi dolmak üzere"           │
│ └─ ... 3 more                                       │
│                                                     │
│ 🟢 Düşük Risk (4)                                  │
│ ├─ Güvenilir Tur - "Rutin kontrol"                 │
│ └─ ... 3 more (otomatik onay aktif)                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Aksiyon Matrisi

| Seviye | Manuel İnceleme | Otomatik Onay | Otomatik Ret |
|--------|-----------------|---------------|--------------|
| 🔴 Yüksek | ✅ Zorunlu | ❌ | ❌ |
| 🟠 Orta | ✅ Önerilir | ❌ | ❌ |
| 🟢 Düşük | ⚪ Opsiyonel | ✅ Mümkün | ❌ |

---

## Kurallar

- ❌ Otomatik silme yok
- ❌ Otomatik ret yok
- ✅ Otomatik onay sadece 🟢 Düşük Risk'te
- ✅ Karar her zaman admin'in
