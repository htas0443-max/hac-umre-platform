# 🧪 A/B Test Planı: Primary CTA

> **Test Tipi:** Tek Değişkenli  
> **Hedef:** CTA dönüşüm oranını artırmak

---

## 1. Test Hipotezi

**Hipotez:**  
"Teklif Al" metni, "Hemen Başla" metnine göre daha yüksek tıklanma oranı sağlar.

**Neden?**  
- "Teklif Al" daha spesifik bir değer öneriyor
- Kullanıcı ne alacağını biliyor
- Aksiyon odaklı ama bağlayıcı değil

---

## 2. Varyant Tanımı

| Varyant | CTA Metni | Konum |
|---------|-----------|-------|
| **A (Kontrol)** | "Hemen Başla" | Hero bölümü |
| **B (Test)** | "Teklif Al" | Hero bölümü (aynı) |

### Değişmeyen Öğeler

- Buton rengi (primary teal)
- Buton boyutu
- Buton konumu
- Sayfa içeriği

---

## 3. Ölçülecek Metrikler

### Primary Metric

| Metrik | Event | Hesaplama |
|--------|-------|-----------|
| CTA Tıklanma Oranı | `cta_click_primary` | Click / Page View |

### Secondary Metric

| Metrik | Event | Hesaplama |
|--------|-------|-----------|
| Login Success Rate | `login_success` | Success / Click |

### Segmentler

| Segment | Ayrı Analiz |
|---------|-------------|
| Mobil | ✅ |
| Web | ✅ |

---

## 4. Test Parametreleri

| Parametre | Değer |
|-----------|-------|
| Trafik Dağılımı | %50 A / %50 B |
| Minimum Süre | 7 gün |
| Minimum Örneklem | 500 click / varyant |
| Test Freeze | UI değişikliği yasak |

### Zamanlama

| Aşama | Süre |
|-------|------|
| Kurulum | 1 gün |
| Test | 7-14 gün |
| Analiz | 2 gün |
| Karar | 1 gün |

---

## 5. Karar Matrisi

### A Kazanırsa

| Sonuç | Aksiyon |
|-------|---------|
| A > B (%10+ fark) | "Hemen Başla" kalır |
| Değişiklik | Yok |
| Öğrenim | Mevcut metin etkili |

### B Kazanırsa

| Sonuç | Aksiyon |
|-------|---------|
| B > A (%10+ fark) | "Teklif Al" deploy edilir |
| Değişiklik | CTA metni güncellenir |
| Öğrenim | Spesifik değer önerisi daha etkili |

### Berabereyse

| Sonuç | Aksiyon |
|-------|---------|
| Fark < %10 | A (kontrol) kalır |
| Değişiklik | Yok |
| Sonraki Adım | Farklı hipotez test et (konum?) |

---

## 6. İstatistiksel Anlamlılık

| Koşul | Geçerlilik |
|-------|-----------|
| p-value < 0.05 | Anlamlı |
| Confidence > %95 | Anlamlı |
| Örneklem yeterli | Her varyant 500+ click |

### Sonuç Net Değilse

1. Test süresini uzat (14 güne)
2. Örneklem büyüsün
3. Hala net değilse → A kalır, yeni test planla

---

## 7. Test Kuralları

### ✅ Do

- Tek değişken test et
- 7 gün bekle
- Veri topla, yorum yapma
- Mobil/web ayrı analiz et
- Sonucu dokümante et

### ❌ Don't

- Test süresinde UI değiştirme
- Erken yorum yapma
- Birden fazla değişken test etme
- Trafiği eşit bölmeme
- Sonucu gizleme (başarısız da olsa kaydet)

---

## Referanslar

- [UX Analytics Plan](./UX_ANALYTICS_PLAN.md)
- [Post-Launch Plan](./POST_LAUNCH_PLAN.md)
