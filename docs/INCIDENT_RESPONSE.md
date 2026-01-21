# 🚨 Incident Response Plan

> **Amaç:** Kritik sorunda panik yerine kontrollü aksiyon almak

---

## 1. Incident Seviyeleri

| Seviye | Tanım | Örnek | Yanıt Süresi |
|--------|-------|-------|--------------|
| **P1 - Critical** | Uygulama tamamen çalışmıyor | Site açılmıyor, tüm kullanıcılar etkilendi | 5 dk |
| **P2 - High** | Ana özellik çalışmıyor | Login/logout bozuk, ödeme yapılamıyor | 30 dk |
| **P3 - Medium** | Özellik kısmen çalışmıyor | Bir sayfa hata veriyor | 2 saat |
| **P4 - Low** | Minor sorun | Görsel bozukluk, küçük bug | 24 saat |

---

## 2. İlk 10 Dakika

| Dakika | Aksiyon | Sorumlu |
|--------|---------|---------|
| 0-2 | Sorunu doğrula (gerçekten var mı?) | İlk fark eden |
| 2-3 | Seviye belirle (P1-P4) | İlk fark eden |
| 3-5 | İlgili kişileri bilgilendir | İlk fark eden |
| 5-10 | İlk analiz: son deploy, error log | Developer |

### Bilgilendirme

| Seviye | Kim Bilgilendirilir? | Kanal |
|--------|---------------------|-------|
| P1 | Lead + Tüm ekip | Acil arama/mesaj |
| P2 | Lead + İlgili developer | Mesaj |
| P3-P4 | İlgili developer | Normal kanal |

---

## 3. Karar Alma

### Rollback Kriterleri

| Koşul | Karar |
|-------|-------|
| P1 ve son 1 saat içinde deploy yapıldı | **Hemen rollback** |
| P1 ve deploy ilişkisi belirsiz | Analiz + 15 dk içinde karar |
| P2 ve hızlı fix bulunamadı | 30 dk içinde rollback |
| P3-P4 | Hotfix tercih edilir |

### Kim Karar Verir?

| Karar | Yetkili |
|-------|---------|
| Rollback | Lead |
| Hotfix deploy | Lead onayı ile Developer |
| Kullanıcı bildirimi | Lead |

---

## 4. Müdahale Adımları

### P1 - Critical

```
1. Sorunu doğrula
2. Lead'i ara
3. Son deploy'u kontrol et
4. Rollback kararı al (5 dk içinde)
5. Rollback yap veya hotfix başlat
6. Kullanıcıları bilgilendir (gerekirse)
7. Düzeldiğini doğrula
```

### P2-P4

```
1. Sorunu dokümante et
2. Root cause analizi yap
3. Fix planla
4. Fix uygula (hotfix veya normal PR)
5. Düzeldiğini doğrula
```

---

## 5. Post-Incident Checklist

Incident çözüldükten sonra 24 saat içinde:

- [ ] Incident özeti yazıldı
- [ ] Root cause belirlendi
- [ ] Timeline oluşturuldu (ne zaman ne oldu?)
- [ ] Tekrarını önleyecek aksiyon belirlendi
- [ ] Aksiyon sorumlusu atandı
- [ ] Ekiple paylaşıldı

### Post-Mortem Formatı

```
## Incident Özeti
[Ne oldu, kaç kullanıcı etkilendi]

## Timeline
[Saat bazında olaylar]

## Root Cause
[Neden oldu]

## Çözüm
[Nasıl düzeltildi]

## Önleme
[Tekrarını engellemek için ne yapılacak]
```

---

## 6. Do / Don't

### ✅ Do

- Sakin kal, panik yapma
- Önce doğrula, sonra müdahale et
- Rollback seçeneğini her zaman hazır tut
- Her adımı dokümante et
- Post-mortem yap, suçlama yapma

### ❌ Don't

- Tek başına karar verme (P1-P2)
- Test etmeden hotfix deploy etme
- Kullanıcıları bilgilendirmeden uzun süre bekleme
- Aynı hatayı tekrar yapmaya izin verme
- Incident'ı gizleme

---

## Referanslar

- [Release Process](./RELEASE_PROCESS.md)
- [Monitoring & Errors](./MONITORING_AND_ERRORS.md)
