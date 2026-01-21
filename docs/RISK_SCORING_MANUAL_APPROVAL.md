# 📊 Belge Doğrulama Risk Skoru ve Manuel Onay Mekanizması

> **Amaç:** Sahte belge riskini puanlama, tutarlı admin kararları

---

## 1. Risk Sinyalleri

### Sinyal Tablosu

| # | Risk Sinyali | Seviye | Puan | Admin Açıklaması |
|---|--------------|--------|------|------------------|
| 1 | OCR eşleşme < %80 | 🔴 Yüksek | +30 | "Belge içeriği ile girilen bilgiler önemli ölçüde farklı" |
| 2 | Kritik alan uyumsuzluğu | 🔴 Yüksek | +40 | "Vergi no veya TÜRSAB no eşleşmiyor" |
| 3 | Belge okunamıyor | 🟠 Orta | +20 | "Belge kalitesi düşük, net okunamıyor" |
| 4 | Eksik metadata | 🟠 Orta | +15 | "Zorunlu bilgiler eksik" |
| 5 | Aynı belge tekrar yüklendi | 🔴 Yüksek | +35 | "Bu belge daha önce başka firma tarafından yüklendi" |
| 6 | Kısa sürede çoklu deneme | 🟡 Düşük | +10 | "Kısa sürede birden fazla yükleme denemesi" |
| 7 | Belge tarihi tutarsız | 🟠 Orta | +15 | "Belge tarihi beklenen aralıkta değil" |
| 8 | Firma ünvanı uyumsuz | 🟠 Orta | +20 | "Belgeler arasında firma ünvanı farklı" |

---

## 2. Toplam Risk Skoru

### Hesaplama

```
Toplam Skor = Σ (Tetiklenen Sinyal Puanları)
```

### Skor → Karar Matrisi

| Skor Aralığı | Risk Seviyesi | Sistem Kararı |
|--------------|---------------|---------------|
| 0-15 | ✅ Düşük | Otomatik onay |
| 16-40 | ⚠️ Orta | Manuel inceleme |
| 41-70 | 🔴 Yüksek | Manuel inceleme (öncelikli) |
| 71+ | 🔴 Kritik | Otomatik ret + manuel review |

---

## 3. Karar Matrisi

| Karar | Koşul | Aksiyon |
|-------|-------|---------|
| **Otomatik Onay** | Skor ≤ 15, kritik sinyal yok | Belge onaylanır, log tutulur |
| **Manuel İnceleme** | Skor 16-70 veya kritik sinyal | Admin kuyruğuna alınır |
| **Otomatik Ret** | Skor > 70 | Ret, kullanıcıya bildirim |
| **Ek Belge İste** | Kalite sorunu veya eksik | Yeniden yükleme bildirimi |

---

## 4. Admin Onay Ekranı

### Gösterilecek Bilgiler

| Alan | Görünürlük | Not |
|------|-----------|-----|
| Firma ünvanı | ✅ Göster | |
| Risk skoru | ✅ Göster | Sayı ve seviye |
| Tetiklenen sinyaller | ✅ Göster | Açıklamalarıyla |
| Belge önizleme | ✅ Göster | Bulanıklaştır opsiyonel |
| OCR eşleşme oranı | ✅ Göster | Yüzde olarak |
| Belgeler arası tutarlılık | ✅ Göster | Ünvan karşılaştırma |

### Gizlenecek Bilgiler

| Alan | Neden? |
|------|--------|
| Belge numarası (tam) | Güvenlik |
| OCR ham çıktısı | Teknik detay |
| Risk algoritması detayı | Sahtecilik önleme |
| Önceki ret gerekçeleri (tam) | Manipülasyon önleme |

### Admin Aksiyonları

| Aksiyon | Koşul | Kullanıcı Bildirimi |
|---------|-------|---------------------|
| ✅ **Onayla** | Belgeler uygun | "Belgeniz onaylandı" |
| ❌ **Reddet** | Ciddi uyumsuzluk | "Belgenizde tutarsızlık tespit edildi" |
| 📄 **Ek Belge İste** | Kalite/eksik | "Lütfen belgenizi yeniden yükleyin" |
| ⏸️ **Beklet** | Araştırma gerekli | - (bildirim yok) |

---

## 5. Admin Karar Gerekçeleri

### Onay Gerekçeleri (Seçenekler)

- [x] Tüm belgeler tutarlı
- [x] OCR eşleşmesi yeterli
- [x] Küçük farklar kabul edilebilir

### Ret Gerekçeleri (Seçenekler)

- [x] Kritik alan uyumsuzluğu
- [x] Belge okunamıyor
- [x] Firma bilgileri tutarsız
- [x] Belge süresi geçersiz

### Ek Belge Gerekçeleri (Seçenekler)

- [x] Düşük görüntü kalitesi
- [x] Eksik sayfa
- [x] Yanlış belge türü

---

## 6. Audit Log

Her karar için kayıt:

| Alan | Değer |
|------|-------|
| Karar tarihi | Timestamp |
| Admin ID | Anonim veya ID |
| Karar | Onay/Ret/Ek Belge |
| Seçilen gerekçe | Listeden |
| Risk skoru | Sayı |
| Tetiklenen sinyaller | Liste |

---

## 7. Admin UX Kuralları

### ✅ Yapılmalı

- Karar gerekçesi seçilmeden işlem tamamlanmasın
- Risk skoru ve sinyaller her zaman görünsün
- Belgeler yan yana karşılaştırma imkanı olsun
- "Onayla" butonu yeşil, "Reddet" butonu kırmızı

### ❌ Yapılmamalı

- "Sahte" veya "dolandırıcı" ifadesi kullanma
- Gerekçesiz karar verme
- Kullanıcıya algoritma detayı gösterme
- Tek tıkla toplu ret

---

## Özet

| Skor | Karar | Admin Eylemi |
|------|-------|--------------|
| 0-15 | Otomatik onay | - |
| 16-40 | Manuel | İnceleme |
| 41-70 | Manuel (öncelikli) | Detaylı inceleme |
| 71+ | Otomatik ret | Review sonrası karar |
