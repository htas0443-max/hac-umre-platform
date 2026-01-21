# 📝 Admin Karar Şablonları (Decision Templates)

> **Amaç:** Hızlı karar, tutarlı mesajlar, gereksiz yazı yok

---

## 1. ✅ Onayla

### Şablonlar

| # | Mesaj | Düzenlenebilir? |
|---|-------|-----------------|
| A | "İlanınız onaylandı ve yayına alındı. İyi satışlar dileriz!" | ✅ Evet |
| B | "İlanınız başarıyla yayınlandı." | ✅ Evet |
| C | "Tur ilanınız platformumuzda yayında." | ✅ Evet |

**Ton:** Pozitif, kısa, teşvik edici

---

## 2. ❌ Reddet

### Şablonlar

| # | Mesaj | Düzenlenebilir? |
|---|-------|-----------------|
| A | "İlanınız yayın kriterlerimize uygun bulunmadığı için onaylanmadı. Düzenleyerek tekrar başvurabilirsiniz." | ✅ Evet |
| B | "İlanınız inceleme sonucunda onaylanmadı. Lütfen ilan içeriğini gözden geçirerek tekrar deneyin." | ✅ Evet |
| C | "Bu ilan şu an için yayınlanamıyor. Sorularınız için destek ekibimize ulaşabilirsiniz." | ✅ Evet |

**Ton:** Nazik, çözüm odaklı, suçlamayan

---

## 3. 📄 Ek Belge İste

### Şablonlar

| # | Mesaj | Düzenlenebilir? |
|---|-------|-----------------|
| A | "İlanınızın yayınlanabilmesi için ek belge yüklemeniz gerekmektedir. Lütfen eksik belgeleri tamamlayın." | ✅ Evet |
| B | "Belge kontrolü sırasında eksiklik tespit edildi. Lütfen gerekli belgeleri yükleyin." | ✅ Evet |
| C | "İlanınız belge güncellemesi beklemektedir. Belgelerinizi kontrol edip tekrar yükleyebilirsiniz." | ✅ Evet |

**Ton:** Yönlendirici, açık, yardımcı

---

## 4. ⏸️ Beklet

### Şablonlar

| # | Mesaj | Düzenlenebilir? |
|---|-------|-----------------|
| A | "İlanınız ek inceleme aşamasındadır. En kısa sürede size dönüş yapılacaktır." | ✅ Evet |
| B | "İlanınız değerlendirme sürecindedir. Sonuç e-posta ile bildirilecektir." | ✅ Evet |
| C | "İlanınız inceleme için sıradadır. Teşekkür ederiz." | ✅ Evet |

**Ton:** Sakin, bilgilendirici, güven veren

---

## Kullanım Kuralları

### ✅ Yapılmalı

- Şablonlardan birini seç
- Gerekirse özelleştir
- Kısa ve net tut

### ❌ Yapılmamalı

- "Sahte", "yasadışı", "dolandırıcı" gibi kelimeler
- Teknik detay paylaşımı
- Suçlayıcı veya tehditkâr dil

---

## Admin Ekran Örneği

```
┌─────────────────────────────────────┐
│ Karar: ❌ Reddet                    │
├─────────────────────────────────────┤
│ Şablon seç:                         │
│ ○ A - "İlanınız yayın kriterle..."  │
│ ● B - "İlanınız inceleme sonucu..." │
│ ○ C - "Bu ilan şu an için..."       │
├─────────────────────────────────────┤
│ Mesajı düzenle (opsiyonel):         │
│ [İlanınız inceleme sonucunda____]   │
│                                     │
│ [Kaydet ve Gönder]                  │
└─────────────────────────────────────┘
```
