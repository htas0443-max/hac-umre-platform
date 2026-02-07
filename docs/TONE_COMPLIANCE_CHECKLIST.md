# ✅ Ton Uyum Kontrol Listesi

Yeni mesaj, bildirim veya UI metni eklerken kullanılacak hızlı kontrol listesi.

---

## PR / Commit Öncesi Kontrol

### Temel Kurallar
- [ ] Suçlayıcı veya tehditkâr dil yok mu?
- [ ] Mesaj açık ve anlaşılır mı? (Jargon yok)
- [ ] Kültürel hassasiyet korunuyor mu?
- [ ] Emoji kullanımı politikaya uygun mu?

### Ton Kontrolü
- [ ] Pozitif mesajlar → 🟢 Güven verici ton
- [ ] Bekleme mesajları → 🟡 Nötr, bilgilendirici ton
- [ ] Eksiklik mesajları → 🟠 Nazik, yönlendirici ton
- [ ] Ret mesajları → 🔴 Ciddi ama saygılı ton

### Yapılmaması Gerekenler
- [ ] "Sahte", "yanlış", "hatalı" gibi suçlayıcı kelimeler yok
- [ ] "Engellenecek", "kapatılacak" gibi tehditler yok
- [ ] "Sistem hatası", "OCR failed" gibi teknik terimler yok
- [ ] Belirsiz "Bir sorun oluştu" mesajları yok

---

## Mesaj Tipi Kontrolü

| Mesaj Tipi | Kontrol | ✅/❌ |
|------------|---------|------|
| **Onay** | "Hayırlı" veya pozitif kapanış var mı? | |
| **Bekleme** | Tahmini süre belirtildi mi? | |
| **Eksiklik** | Ne yapılması gerektiği açık mı? | |
| **Ret** | Destek yönlendirmesi var mı? | |
| **Limit** | Sıfırlanma/çözüm bilgisi var mı? | |

---

## Örnek Kontrol

```diff
- ❌ "Belgeniz hatalı, tekrar yükleyin."
+ ✅ "Belgeniz doğrulanamadı. Lütfen geçerli belge yükleyiniz."

- ❌ "Hesabınız engellenecek."
+ ✅ "İşleminizi tamamlamak için ek belge gerekiyor."

- ❌ "Bir sorun oluştu."
+ ✅ "İlanınız inceleme aşamasındadır. 1-2 iş günü içinde sonuçlanır."
```

---

## Onay Kriterleri

Aşağıdaki **tümü** karşılanmalı:

1. ✅ Mesaj açık ve anlaşılır
2. ✅ Ton duruma uygun (pozitif/nötr/dikkatli/ciddi)
3. ✅ Suçlayıcı veya tehditkâr ifade yok
4. ✅ Kullanıcıya sonraki adım veya bilgi sunuluyor
5. ✅ Kültürel hassasiyet korunuyor

---

*Referans: [SYSTEM_TONE_AND_LANGUAGE.md](./SYSTEM_TONE_AND_LANGUAGE.md)*
