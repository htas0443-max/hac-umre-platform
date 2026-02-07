# 🗣️ Sistem Tonu ve Dil Rehberi

Platform genelinde kullanılacak dil standartları, ton kuralları ve mesaj şablonları.

---

## Temel Prensipler

| Prensip | Açıklama |
|---------|----------|
| **Saygılı** | Hac ve Umre manevi bir yolculuktur. Dil buna uygun olmalı |
| **Güven verici** | Kullanıcı endişesini artırmadan bilgi ver |
| **Açık** | Jargon kullanma, herkesin anlayacağı dilde yaz |
| **Kısa** | Gereksiz açıklama yok, öz ve net |

---

## Ton Seviyeleri

| Seviye | Kullanım Alanı | Örnek |
|--------|----------------|-------|
| **🟢 Pozitif** | Onay, başarı, hoş geldin | "İlanınız onaylandı. Hayırlı satışlar!" |
| **🟡 Nötr** | Bilgilendirme, bekleme | "İlanınız inceleme aşamasındadır." |
| **🟠 Dikkatli** | Eksiklik, ek talep | "İşleminizi tamamlamak için ek belge gerekiyor." |
| **🔴 Ciddi** | Ret, hata | "İlanınız yayın kriterlerimize uygun bulunmadı." |

---

## Yapılması ve Yapılmaması Gerekenler

### ✅ Yapılması Gerekenler

| Durum | Doğru Örnek |
|-------|-------------|
| Bekleme bildirimi | "İlanınız inceleme aşamasındadır. Genellikle 1-2 iş günü içinde sonuçlanır." |
| Ret bildirimi | "İlanınız yayın kriterlerimize uygun bulunmadı. Detaylar için destek ile iletişime geçebilirsiniz." |
| Eksik belge | "İşleminizi tamamlamak için TURSAB belgenizi yüklemeniz gerekmektedir." |
| Limit uyarısı | "Maksimum aktif ilan sayısına ulaştınız." |

### ❌ Yapılmaması Gerekenler

| Durum | Yanlış | Neden |
|-------|--------|-------|
| Suçlayıcı dil | "Sahte belge yüklediniz" | Kullanıcıyı suçlama |
| Tehditkâr ton | "Hesabınız engellenecek" | Ürkütücü |
| Belirsiz mesaj | "Bir sorun oluştu" | Bilgi vermiyor |
| Aşırı teknik | "OCR validation failed" | Anlaşılmıyor |

---

## Standart Mesaj Şablonları

### Onay Mesajları
```
✅ İlanınız onaylandı ve yayına alındı.
✅ Belgeniz başarıyla doğrulandı.
✅ Hesabınız aktif edildi. Hoş geldiniz!
```

### Bekleme Mesajları
```
⏳ İlanınız inceleme aşamasındadır. Genellikle 1-2 iş günü içinde sonuçlanır.
⏳ Belgeniz inceleniyor. Sonuç e-posta ile bildirilecektir.
⏳ Talebiniz alındı. En kısa sürede dönüş yapılacaktır.
```

### Eksiklik Mesajları
```
📄 İşleminizi tamamlamak için ek belge yüklemeniz gerekmektedir.
📄 TURSAB belgenizin geçerlilik süresi dolmuş. Güncel belge yükleyiniz.
📄 Bazı alanlar eksik kalmış. Lütfen formu tamamlayınız.
```

### Ret Mesajları
```
❌ İlanınız yayın kriterlerimize uygun bulunmadığı için onaylanmadı.
❌ Belgeniz doğrulanamadı. Lütfen geçerli belge yükleyiniz.
❌ Talebiniz değerlendirme sonucu uygun bulunmadı.
```

### Limit Mesajları
```
⚠️ Maksimum aktif ilan sayısına ulaştınız. Yeni ilan eklemek için mevcut bir ilanı kaldırabilirsiniz.
⚠️ Bu ay için düzenleme limitinize ulaştınız. Limit yeni ayda sıfırlanacaktır.
⚠️ Belge güncelleme limitinize ulaştınız. 30 gün sonra tekrar deneyebilirsiniz.
```

---

## Kültürel Hassasiyet

| Konu | Yaklaşım |
|------|----------|
| **Dini terimler** | Doğru kullan: "Hac", "Umre", "Kâbe", "Medine" |
| **Dua/Dilek** | Uygun yerlerde: "Hayırlı yolculuklar", "Kabul olsun" |
| **Para konusu** | Hassas yaklaş, fiyat tartışması yapmadan bilgi ver |
| **Güven** | "Doğrulanmış firma" ifadesi güven sağlar |

---

## Emoji Kullanımı

| Alan | İzin | Örnek |
|------|------|-------|
| Başarı mesajları | ✅ | ✅ İlanınız onaylandı |
| Bekleme mesajları | ✅ | ⏳ İnceleme aşamasında |
| Hata mesajları | ✅ | ❌ Onaylanmadı |
| UI butonları | ❌ | Lucide ikonları kullan |
| Form etiketleri | ❌ | Sadece metin |

---

*Referans: [UI_UX_FRAMEWORK.md](./UI_UX_FRAMEWORK.md), [ABUSE_PREVENTION_GOVERNANCE.md](./ABUSE_PREVENTION_GOVERNANCE.md)*
