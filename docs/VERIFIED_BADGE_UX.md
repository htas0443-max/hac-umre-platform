# ✅ Doğrulanmış Tur Şirketi Rozeti - UX Metinleri

> **Amaç:** Güven vermek, belge ifşa etmemek, sahteciliği önlemek

---

## 1. Rozet Metinleri

### Ana Rozet

| Varyant | Metin |
|---------|-------|
| **A (Önerilen)** | ✓ Doğrulanmış Firma |
| B | ✓ Onaylı Şirket |
| C | ✓ Güvenilir Operatör |

### İkon Önerisi

- Lucide: `<Shield />` veya `<CheckCircle />`
- Renk: Teal (güven) veya Gold (premium)

---

## 2. Tooltip / Info Açıklaması

### Kısa Versiyon (Önerilen)

> "Bu firma, platform tarafından resmi belgeleri kontrol edilerek doğrulanmıştır."

### Orta Versiyon

> "Bu tur şirketinin yasal faaliyet belgeleri platform ekibimiz tarafından incelenmiş ve onaylanmıştır."

### Uzun Versiyon (Modal için)

> "Bu firma, Türkiye'de tur operatörü olarak faaliyet gösterebilmek için gerekli yasal izinlere sahiptir. Belgeler platform ekibimiz tarafından doğrulanmıştır."

---

## 3. Gösterim Kuralları

### ✅ Rozet Gösterilir

| Koşul | Gösterim |
|-------|----------|
| Tüm belgeler onaylı | ✅ Göster |
| Admin tarafından onaylanmış | ✅ Göster |
| Belgeler güncel | ✅ Göster |

### ❌ Rozet Gösterilmez

| Koşul | Gösterim |
|-------|----------|
| Belgeler eksik | ❌ Gösterme |
| Belgeler süresi dolmuş | ❌ Gösterme |
| Onay bekliyor | ❌ Gösterme |
| Firma askıya alınmış | ❌ Gösterme |

### Belgeler Eksikse

| Durum | UI Davranışı |
|-------|-------------|
| Rozet yok | Rozet alanı boş kalır |
| Uyarı yok | Kullanıcıya "doğrulanmamış" uyarısı gösterilmez |
| Nötr görünüm | Sadece rozet yok, algı olumsuz değil |

---

## 4. Güven İfadeleri

### Kullanılabilir İfadeler

| İfade | Kullanım Alanı |
|-------|---------------|
| "Platform tarafından doğrulanmıştır" | Rozet tooltip |
| "Resmi belgeleri kontrol edilmiştir" | Info modal |
| "Yasal faaliyet izinleri onaylıdır" | Detay sayfası |
| "Güvenli alışveriş için doğrulandı" | CTA yakını |

### Örnek Kullanım

```
[✓ Doğrulanmış Firma]
    ↓ (hover/tap)
"Bu firma, platform tarafından resmi belgeleri 
kontrol edilerek doğrulanmıştır."
```

---

## 5. Yasaklı İfadeler

| ❌ Yasak İfade | Neden? |
|---------------|--------|
| "TÜRSAB belgeli" | Belge adı ifşası |
| "Vergi levhası onaylı" | Belge adı ifşası |
| "2024 tarihli belge" | Tarih ifşası |
| "12345 numaralı ruhsat" | Numara ifşası |
| "%100 güvenli" | Aşırı iddia |
| "Kesinlikle doğrulanmış" | Hukuki risk |
| "Devlet onaylı" | Yanıltıcı |
| "Resmi kurum onayı" | Yanıltıcı |

### Neden Yasak?

| Sebep | Açıklama |
|-------|----------|
| KVKK | Ticari bilgi koruması |
| Sahtecilik riski | Belge detayı ifşa edilirse taklit kolaylaşır |
| Hukuki risk | Aşırı iddia dava riski taşır |
| Yanıltma | Platformun devlet kurumu olmadığı net olmalı |

---

## Özet

| Alan | Önerilen Metin |
|------|----------------|
| **Rozet** | ✓ Doğrulanmış Firma |
| **Tooltip** | "Bu firma, platform tarafından resmi belgeleri kontrol edilerek doğrulanmıştır." |
| **İkon** | `<Shield />` veya `<CheckCircle />` |
| **Renk** | Teal (--primary-teal) |
