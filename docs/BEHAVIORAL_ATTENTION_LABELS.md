# 🚨 Davranışsal Dikkat Etiketleri

> **Amaç:** Şüpheli davranışları erken fark etmek, admin'e karar desteği sağlamak  
> **Kural:** Etiketler kullanıcıya görünmez, otomatik ceza yok

---

## Davranış → Etiket Tablosu

| Davranış | Kriter | Seviye | Admin Görünümü |
|----------|--------|--------|----------------|
| **Aşırı Düzenleme** | 10+ düzenleme / 1 saat | 🟡 Orta | "Yoğun düzenleme aktivitesi" |
| **Tekrarlayan İçerik** | Aynı metin 3+ ilan | 🟠 Yüksek | "Tekrarlayan ilan içeriği" |
| **Çoklu Ret** | 3+ ret / 7 gün | 🟠 Yüksek | "Sık reddedilen başvurular" |
| **Belge Bombardımanı** | 5+ belge yükleme / 24 saat | 🟡 Orta | "Yoğun belge güncelleme" |

---

## Detaylı Açıklamalar

### 1. Aşırı Düzenleme

| Alan | Değer |
|------|-------|
| **Kriter** | 10+ düzenleme / 1 saat |
| **Seviye** | 🟡 Orta |
| **Admin Görünümü** | "Yoğun düzenleme aktivitesi" |
| **Olası Neden** | Sıralama manipülasyonu veya spam |
| **Otomatik Aksiyon** | ❌ Yok |

---

### 2. Tekrarlayan İçerik

| Alan | Değer |
|------|-------|
| **Kriter** | Aynı ilan metni 3+ kez kullanılmış |
| **Seviye** | 🟠 Yüksek |
| **Admin Görünümü** | "Tekrarlayan ilan içeriği" |
| **Olası Neden** | Spam veya sahte çoğaltma |
| **Otomatik Aksiyon** | ❌ Yok |

---

### 3. Çoklu Ret

| Alan | Değer |
|------|-------|
| **Kriter** | 3+ ret / 7 gün içinde |
| **Seviye** | 🟠 Yüksek |
| **Admin Görünümü** | "Sık reddedilen başvurular" |
| **Olası Neden** | Kurallara uymayan veya şüpheli firma |
| **Otomatik Aksiyon** | ❌ Yok |

---

### 4. Belge Bombardımanı

| Alan | Değer |
|------|-------|
| **Kriter** | 5+ belge yükleme / 24 saat |
| **Seviye** | 🟡 Orta |
| **Admin Görünümü** | "Yoğun belge güncelleme" |
| **Olası Neden** | Sahte belge deneme veya sistem testi |
| **Otomatik Aksiyon** | ❌ Yok |

---

## Seviye Tanımları

| Seviye | Renk | Anlamı |
|--------|------|--------|
| 🟢 Düşük | Yeşil | Bilgi amaçlı, rutin |
| 🟡 Orta | Sarı | Dikkat gerektiren |
| 🟠 Yüksek | Turuncu | İnceleme önerilir |
| 🔴 Kritik | Kırmızı | Acil değerlendirme |

---

## Admin Panel Gösterimi

```
┌─────────────────────────────────────────┐
│ Firma: ABC Tur Ltd.                      │
│ Durum: İncelemede                        │
│                                          │
│ ⚠️ Dikkat Etiketleri:                    │
│   🟠 Sık reddedilen başvurular           │
│   🟡 Yoğun düzenleme aktivitesi          │
│                                          │
│ [Onayla] [Reddet] [Detay Gör]           │
└─────────────────────────────────────────┘
```

---

## Admin Yorum Rehberi

| Etiket | Önerilen Yaklaşım |
|--------|-------------------|
| 🟡 Orta | İlan içeriğini kontrol et |
| 🟠 Yüksek | Belgeleri ve geçmiş başvuruları incele |
| 🔴 Kritik | Hesabı detaylı değerlendir |

---

## Kurallar

- ❌ Kullanıcıya etiket gösterilmez
- ❌ Otomatik ceza veya engelleme yok
- ✅ Sadece admin'e bilgi sağlar
- ✅ Karar admin'in
