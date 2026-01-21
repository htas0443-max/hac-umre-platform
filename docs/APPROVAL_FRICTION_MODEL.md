# ⏱️ Zaman Bazlı Onay Süreci Modeli

> **Amaç:** Kötüye kullanımı yavaşlatmak, güvenilir firmaları hızlandırmak

---

## Senaryo Tablosu

| Senaryo | Onay Türü | Bekleme | Mesaj |
|---------|-----------|---------|-------|
| **Yeni Firma** | Manuel | 24-48 saat | "İlanınız inceleme aşamasındadır. Genellikle 1-2 iş günü içinde sonuçlanır." |
| **Belgeli Firma** | Otomatik | < 1 saat | "İlanınız kısa süre içinde yayına alınacaktır." |
| **Reddedilmiş Başvuru** | Manuel (öncelikli) | 48-72 saat | "İlanınız detaylı inceleme aşamasındadır. En kısa sürede size dönüş yapılacaktır." |
| **Dikkat Etiketi** | Manuel (detaylı) | 72+ saat | "İlanınız inceleme kuyruğundadır. Sonuç e-posta ile bildirilecektir." |

---

## Detaylı Senaryolar

### 1. Yeni Kayıt Olmuş Firma

| Alan | Değer |
|------|-------|
| **Onay Türü** | Manuel inceleme |
| **Bekleme** | 24-48 saat |
| **Mesaj** | "İlanınız inceleme aşamasındadır. Genellikle 1-2 iş günü içinde sonuçlanır." |
| **Gerekçe** | İlk ilanlar yeni hesapları tanımak için incelenir |

---

### 2. Belgeleri Onaylanmış Firma

| Alan | Değer |
|------|-------|
| **Onay Türü** | Otomatik onay |
| **Bekleme** | < 1 saat |
| **Mesaj** | "İlanınız kısa süre içinde yayına alınacaktır." |
| **Gerekçe** | Güvenilir firma, belgeler önceden doğrulanmış |

---

### 3. Daha Önce Reddedilmiş Başvurusu Olan Firma

| Alan | Değer |
|------|-------|
| **Onay Türü** | Manuel inceleme (öncelikli) |
| **Bekleme** | 48-72 saat |
| **Mesaj** | "İlanınız detaylı inceleme aşamasındadır. En kısa sürede size dönüş yapılacaktır." |
| **Gerekçe** | Geçmiş sorunlar nedeniyle dikkatli bakılır |

---

### 4. Davranışsal "Dikkat" Etiketi Taşıyan Firma

| Alan | Değer |
|------|-------|
| **Onay Türü** | Manuel inceleme (detaylı) |
| **Bekleme** | 72+ saat |
| **Mesaj** | "İlanınız inceleme kuyruğundadır. Sonuç e-posta ile bildirilecektir." |
| **Gerekçe** | Şüpheli davranış paterni tespit edilmiş |

---

## Mesaj Kuralları

### ✅ Doğru Ton

- "İnceleme aşamasında" (nötr)
- "En kısa sürede" (pozitif)
- "Genellikle 1-2 iş günü" (şeffaf)

### ❌ Kaçınılacak Ton

- "Gecikme yaşanabilir" (negatif)
- "Geçmiş sorunlar nedeniyle" (suçlayıcı)
- "Şüpheli hesap" (tehdit)

---

## Güven Kazanım Yolu

| Aşama | Davranış | Sonuç |
|-------|----------|-------|
| 1 | Belgeleri tamamla | Otomatik onaya geç |
| 2 | 3+ başarılı ilan | Öncelikli inceleme |
| 3 | 6+ ay sorunsuz | Hızlı onay |
