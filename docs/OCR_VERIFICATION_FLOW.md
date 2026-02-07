# 🔍 OCR Tabanlı Belge Doğrulama Akışı

> **Amaç:** Otomatik metin çıkarma ve metadata eşleştirme ile sahte/tutarsız belge tespiti

---

## Genel Akış

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Belge      │ ──▶ │  OCR        │ ──▶ │  Eşleştir   │ ──▶ │  Karar      │
│  Yükleme    │     │  İşleme     │     │  (Match)    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                           ┌───────────────────────────────────────┼───────┐
                           ▼                   ▼                   ▼       │
                      ✅ Onay           ⚠️ Uyarı           🔴 Manuel       │
                                                           İnceleme        │
```

---

## 1. TÜRSAB İşletme Belgesi

### A) OCR ile Okunacak Alanlar

| Alan | OCR Bölgesi | Öncelik |
|------|-------------|---------|
| TÜRSAB No | Belge üst kısım | 🔴 Kritik |
| Firma Ünvanı | Belge orta kısım | 🔴 Kritik |
| Düzenleme Tarihi | Belge alt kısım | 🟠 Yüksek |
| Geçerlilik Tarihi | Belge alt kısım | 🟠 Yüksek |

### B) Eşleştirme Kuralları

| Alan | Eşleştirme Tipi | Tolerans |
|------|-----------------|----------|
| `tursab_no` | Tam eşleşme | ❌ Yok |
| `firma_unvani` | Kısmi eşleşme | ✅ %90 benzerlik |
| `gecerlilik_tarihi` | Tarih kontrolü | ±7 gün |

---

## 2. Vergi Levhası

### A) OCR ile Okunacak Alanlar

| Alan | OCR Bölgesi | Öncelik |
|------|-------------|---------|
| Vergi No | Belge üst/orta | 🔴 Kritik |
| Firma Ünvanı | Belge orta | 🔴 Kritik |
| Vergi Dairesi | Belge orta | 🟠 Yüksek |
| Yıl | Belge üst/alt | 🟡 Orta |

### B) Eşleştirme Kuralları

| Alan | Eşleştirme Tipi | Tolerans |
|------|-----------------|----------|
| `vergi_no` | Tam eşleşme | ❌ Yok |
| `firma_unvani` | Kısmi eşleşme | ✅ %90 benzerlik |
| `vergi_dairesi` | Kısmi eşleşme | ✅ Büyük/küçük harf |

---

## 3. İmza Sirküleri

### A) OCR ile Okunacak Alanlar

| Alan | OCR Bölgesi | Öncelik |
|------|-------------|---------|
| Firma Ünvanı | Belge üst | 🔴 Kritik |
| Yetkili Adı | Belge orta | 🟠 Yüksek |
| Noter Tarihi | Belge alt | 🟡 Orta |

### B) Eşleştirme Kuralları

| Alan | Eşleştirme Tipi | Tolerans |
|------|-----------------|----------|
| `firma_unvani` | Kısmi eşleşme | ✅ %90 benzerlik |
| `yetkili_adi` | Kısmi eşleşme | ✅ %85 benzerlik |
| `noter_tarihi` | Tarih kontrolü | ±30 gün |

---

## Uyuşmazlık Türleri

### Küçük Uyumsuzluk (OCR Hatası Olası)

| Durum | Örnek | Aksiyon |
|-------|-------|---------|
| Harf farkı | "Şirket" vs "Sirket" | ⚠️ Uyarı, devam |
| Boşluk farkı | "ABC Ltd" vs "ABCLtd" | ⚠️ Uyarı, devam |
| Tarih format | "01.01.2024" vs "2024-01-01" | ✅ Normalize et |

### Büyük Uyumsuzluk (Kritik)

| Durum | Örnek | Aksiyon |
|-------|-------|---------|
| Farklı vergi no | Girilen ≠ OCR | 🔴 Manuel inceleme |
| Farklı ünvan | Tamamen farklı firma | 🔴 Manuel inceleme |
| Farklı TÜRSAB no | Girilen ≠ OCR | 🔴 Manuel inceleme |

### Okunamayan Alanlar

| Durum | Aksiyon |
|-------|---------|
| OCR güven < %60 | ⚠️ Manuel doğrulama iste |
| Alan bulunamadı | ⚠️ Kullanıcıya tekrar yükleme iste |
| Belge tamamen okunamaz | 🔴 Yeniden yükleme zorunlu |

---

## Uyuşmazlık → Aksiyon Tablosu

| Uyuşmazlık | Seviye | Sistem Tepkisi |
|------------|--------|----------------|
| %95+ eşleşme | ✅ Düşük | Otomatik onay |
| %90-95 eşleşme | ⚠️ Orta | Uyarı log, onay |
| %80-90 eşleşme | ⚠️ Yüksek | Risk sinyali, manuel review |
| < %80 eşleşme | 🔴 Kritik | Manuel inceleme zorunlu |
| Kritik alan uyumsuz | 🔴 Kritik | Otomatik ret, manuel review |

---

## Sistem Tepkileri

### ✅ Otomatik Onay

```
Koşul: Tüm kritik alanlar %95+ eşleşme
Aksiyon: Belge onaylandı
Log: Başarılı doğrulama kaydı
```

### ⚠️ Uyarı Üret

```
Koşul: Küçük uyumsuzluklar var
Aksiyon: Onay ver, uyarı log'la
Log: "Firma ünvanında küçük fark tespit edildi"
```

### 🔴 Manuel İnceleme

```
Koşul: Kritik uyumsuzluk veya düşük güven
Aksiyon: Admin kuyruğuna al
Log: "Manuel inceleme gerekli: vergi no uyumsuzluğu"
```

---

## OCR Güven Eşikleri

| Güven | Aksiyon |
|-------|---------|
| > %90 | Sonucu kullan |
| %70-90 | Sonuç + uyarı |
| %50-70 | Manuel doğrulama iste |
| < %50 | Sonucu kullanma |

---

## Özet

| Belge | Kritik Eşleşme | Toleranslı Eşleşme |
|-------|----------------|-------------------|
| TÜRSAB | tursab_no | firma_unvani |
| Vergi Levhası | vergi_no | firma_unvani, daire |
| İmza Sirküleri | - | firma_unvani, yetkili |
