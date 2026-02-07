# 📅 Post-Launch (Canlı Sonrası) Planı

> **Amaç:** İlk 30 günü kontrollü yönetmek, erken hata yakalamak, panik önlemek

---

## 1. İlk 24 Saat

### Kontrol Edilecek Metrikler

| Metrik | Eşik | Aksiyon |
|--------|------|---------|
| Error rate | > %5 | Kritik - hemen müdahale |
| Crash | > 3 / saat | Rollback değerlendir |
| API failure | > %10 | Backend kontrol |
| Sayfa yükleme | > 5 saniye | Performans inceleme |

### Kritik Hata Tanımı

| Durum | Seviye | Müdahale |
|-------|--------|----------|
| Site açılmıyor | P1 | 5 dk içinde |
| Login çalışmıyor | P1 | 5 dk içinde |
| Ana akış bozuk (tur listeleme) | P1 | 15 dk içinde |
| Tek sayfa hata veriyor | P2 | 1 saat içinde |
| Görsel bozukluk | P4 | Bekle, hotfix planla |

### Ne Zaman Müdahale Edilmez?

- Minor görsel hatalar
- Edge case buglar (< %1 kullanıcı etkili)
- "Nice to have" iyileştirmeler

---

## 2. İlk 7 Gün

### Günlük Kontrol Listesi

- [ ] Error dashboard kontrol
- [ ] En çok ziyaret edilen sayfalar normal mi?
- [ ] Mobil vs Web oranları
- [ ] Kullanıcı şikayeti var mı?

### İzlenecek Alanlar

| Alan | Ne Aranır? |
|------|-----------|
| **En çok ziyaret** | Home, Tours, Login |
| **En çok hata** | Hangi sayfa/component? |
| **Drop-off** | Nereden çıkılıyor? |
| **Mobil UX** | Touch sorunları var mı? |

### Güvenli İyileştirmeler (İzin Verilen)

| Tür | Örnek | Onay |
|-----|-------|------|
| Typo düzeltme | Yazım hatası | Developer |
| Minor CSS fix | Hizalama, renk | Reviewer |
| Copy değişikliği | Metin güncelleme | Reviewer |

### Kaçınılması Gereken (İlk 7 gün)

- Major refactoring
- Yeni özellik ekleme
- Büyük UI değişikliği
- Performans optimizasyonu (acil değilse)

---

## 3. İlk 30 Gün

### Haftalık Değerlendirme

| Hafta | Odak |
|-------|------|
| 1 | Stabilite, kritik hata yok |
| 2 | UX sürtünme noktaları |
| 3 | Performans eğilimleri |
| 4 | Teknik borç değerlendirme |

### UX Sürtünme Noktaları

| İşaret | Anlamı |
|--------|--------|
| Rage click | UI yanıt vermiyor |
| Kısa session | Kullanıcı kayboldu |
| Form abandon | Form çok uzun/karmaşık |
| Geri buton paterni | Navigasyon sorunu |

### Dokümantasyon Güncelleme

| Kontrol | Gerekli mi? |
|---------|-------------|
| Design System güncel mi? | Evet/Hayır |
| Icon System güncel mi? | Evet/Hayır |
| Onboarding güncel mi? | Evet/Hayır |

### Teknik Borç Değerlendirme

| Soru | Cevap |
|------|-------|
| Workaround yapıldı mı? | |
| TODO kaldı mı? | |
| Test coverage yeterli mi? | |
| Refactoring gerekli mi? | |

---

## 4. Temel Metrikler

| Metrik | Ölçüm | Hedef |
|--------|-------|-------|
| **Error rate** | Günlük | < %1 |
| **Crash** | Saatlik | 0 |
| **İlk yükleme** | LCP | < 2.5s |
| **Mobil başarı** | Tamamlanan akış | > %90 |
| **API success** | Başarılı istek | > %99 |

### Mobil vs Web Farkları

| Metrik | Mobil | Web |
|--------|-------|-----|
| İlk yükleme | < 3s | < 2s |
| Touch target | 44px | 40px |
| Font size | 16px+ | 14px+ |

---

## 5. Müdahale Kuralları

### Ne Zaman HOTFIX?

| Koşul | Karar |
|-------|-------|
| P1 hata, rollback çözmüyor | Hotfix |
| P2 hata, bilinen basit fix | Hotfix |
| Güvenlik açığı | Hemen hotfix |

### Ne Zaman BEKLE?

| Koşul | Karar |
|-------|-------|
| P3-P4 hata | Normal PR planla |
| Edge case bug | Öncelik değerlendir |
| "İyileştirme" talebi | Backlog'a al |

### Ne Zaman ROLLBACK?

| Koşul | Karar |
|-------|-------|
| P1 + son 1 saatte deploy | Hemen rollback |
| Fix 15 dk içinde bulunamadı | Rollback |
| Etkinin büyüdüğü görülüyor | Rollback |

---

## 6. Do / Don't

### ✅ Do

- İlk 24 saat yoğun izle
- Günlük metrik kontrolü yap
- Küçük fix'leri biriktir, toplu deploy et
- Kullanıcı geri bildirimini dinle
- Her değişikliği dokümante et

### ❌ Don't

- Panikle büyük değişiklik yapma
- İlk haftada major refactoring yapma
- Her bug'ı hotfix ile çözmeye çalışma
- Metrik bakmadan karar verme
- Tek başına kritik karar alma

---

## Referanslar

- [Production Readiness](./PRODUCTION_READINESS.md)
- [Release Process](./RELEASE_PROCESS.md)
- [Monitoring & Errors](./MONITORING_AND_ERRORS.md)
- [Incident Response](./INCIDENT_RESPONSE.md)
