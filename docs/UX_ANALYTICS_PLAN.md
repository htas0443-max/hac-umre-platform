# 📊 UX Analytics & Event Tracking Plan

> **Yaklaşım:** Privacy-first, anonim ölçüm  
> **Uyumluluk:** KVKK / GDPR

---

## Temel İlkeler

| İlke | Açıklama |
|------|----------|
| **Anonim** | Kullanıcı kimliği yok |
| **Minimal** | Sadece gerekli event'ler |
| **Hafif** | Performansı etkilemez |
| **Yasal** | KVKK/GDPR uyumlu |

---

## Event Kataloğu

### 1. page_view_home

| Alan | Değer |
|------|-------|
| **Event Adı** | `page_view_home` |
| **Tetiklenme** | Ana sayfa yüklendiğinde |
| **Payload** | `{ timestamp: number }` |
| **Ne Anlatır?** | Ana sayfa trafiği |
| **Ürün Kararı** | Home page önemi, ilk izlenim optimizasyonu |

---

### 2. cta_click_primary

| Alan | Değer |
|------|-------|
| **Event Adı** | `cta_click_primary` |
| **Tetiklenme** | Primary CTA butonuna tıklandığında |
| **Payload** | `{ page: string, position: string }` |
| **Ne Anlatır?** | Hangi CTA daha etkili? |
| **Ürün Kararı** | CTA yerleşimi, buton metni optimizasyonu |

---

### 3. login_attempt

| Alan | Değer |
|------|-------|
| **Event Adı** | `login_attempt` |
| **Tetiklenme** | Login butonu tıklandığında |
| **Payload** | `{ timestamp: number }` |
| **Ne Anlatır?** | Login denemesi sayısı |
| **Ürün Kararı** | Login akışı sürtünme analizi |

---

### 4. login_success

| Alan | Değer |
|------|-------|
| **Event Adı** | `login_success` |
| **Tetiklenme** | Başarılı login sonrası |
| **Payload** | `{ timestamp: number }` |
| **Ne Anlatır?** | Başarılı login oranı |
| **Ürün Kararı** | Login success rate = success / attempt |

---

### 5. filter_used

| Alan | Değer |
|------|-------|
| **Event Adı** | `filter_used` |
| **Tetiklenme** | Herhangi bir filtre uygulandığında |
| **Payload** | `{ filter_type: string, has_value: boolean }` |
| **Ne Anlatır?** | Hangi filtreler kullanılıyor? |
| **Ürün Kararı** | Filtre önem sırası, varsayılan değerler |

---

## 🚫 Ölçülmeyecekler (Kırmızı Çizgiler)

| Kategori | Ölçülmez |
|----------|----------|
| **Form Input** | E-posta, şifre, isim, adres |
| **Arama** | Arama kelimeleri, query string |
| **Kimlik** | IP, device ID, fingerprint |
| **Metin** | Serbest metin input'ları |
| **Lokasyon** | Konum verisi |
| **Hassas** | Ödeme, sağlık, din |

---

## 📈 İlk 14 Gün Veri Yorumlama

### Hafta 1: Sadece İzle

| Kural | Açıklama |
|-------|----------|
| Karar alma | ❌ Hayır |
| Trend arama | ❌ Hayır |
| Veri toplama | ✅ Evet |

### Hafta 2: İlk Yorumlar

| Kural | Açıklama |
|-------|----------|
| Trend belirleme | ✅ Dikkatli |
| Hypothesis oluştur | ✅ Evet |
| Major karar | ❌ Henüz değil |

### Minimum Anlamlı Veri

| Metrik | Minimum Örneklem |
|--------|------------------|
| page_view | 1000+ |
| cta_click | 100+ |
| login_attempt | 50+ |

---

## ⚠️ Yanlış Yorumlama Örnekleri

### Anti-Pattern 1: Erken Karar

```
❌ YANLIŞ:
"3 gün sonra login_success düşük, formu değiştirelim"

✅ DOĞRU:
"14 gün veri toplayalım, trend oluşsun"
```

### Anti-Pattern 2: Tek Metrik

```
❌ YANLIŞ:
"CTA click yüksek = başarılı"

✅ DOĞRU:
"CTA click + conversion birlikte değerlendir"
```

### Anti-Pattern 3: Korelasyon = Nedensellik

```
❌ YANLIŞ:
"Filter kullanımı artınca satış arttı, filter önemli"

✅ DOĞRU:
"Korelasyon var, A/B test ile doğrula"
```

---

## Do / Don't

### ✅ Do

- Sadece tanımlı event'leri gönder
- Payload'ları minimal tut
- Boolean ve sayısal değerler kullan
- 14 gün bekle, sonra yorumla
- Hypothesis oluştur, test et

### ❌ Don't

- Serbest metin loglama
- Kullanıcı input'unu kaydetme
- 7 günden önce karar alma
- Tek metrikle hareket etme
- Event spam (aşırı event)

---

## Payload Kuralları

| İzin Verilen | Örnek |
|--------------|-------|
| Boolean | `{ has_filter: true }` |
| Number | `{ count: 5 }` |
| Enum | `{ page: "home" }` |
| Timestamp | `{ ts: 1705858800 }` |

| Yasak | Örnek |
|-------|-------|
| String (serbest) | `{ search: "umre..." }` |
| Email | `{ email: "..." }` |
| ID | `{ user_id: "..." }` |

---

## Referanslar

- [Post-Launch Plan](./POST_LAUNCH_PLAN.md)
- [Monitoring & Errors](./MONITORING_AND_ERRORS.md)
