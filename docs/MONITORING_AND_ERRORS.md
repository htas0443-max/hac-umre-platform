# 📊 Monitoring & Error Handling Yaklaşımı

> **Amaç:** Production'da hataları erken yakalamak, kullanıcı deneyimini korumak

---

## 1. Monitoring Stratejisi

### Ne İzlenir?

| Kategori | Metrik | Neden? |
|----------|--------|--------|
| **Performans** | İlk açılış süresi (FCP, LCP) | Kullanıcı deneyimi |
| **Hatalar** | JS runtime error sayısı | Stabilite |
| **Crash** | Sayfa çökme oranı | Kritik sorunlar |
| **API** | Başarısız istek oranı | Backend sağlığı |
| **UX** | Rage click (art arda tıklama) | UI sorunları |

### Önem Seviyeleri

| Seviye | Açıklama | Örnek |
|--------|----------|-------|
| **Critical** | Uygulama çalışmıyor | Sayfa yüklenmiyor |
| **Error** | Özellik çalışmıyor | Form submit başarısız |
| **Warning** | Potansiyel sorun | Yavaş API yanıtı |
| **Info** | Bilgi amaçlı | Deploy tamamlandı |

---

## 2. Error Handling Prensipleri

### Global Error Handling

| Yaklaşım | Açıklama |
|----------|----------|
| **ErrorBoundary** | Tüm sayfa route'ları ErrorBoundary içinde |
| **Fallback UI** | Crash durumunda kullanıcıya anlaşılır mesaj |
| **Hata Loglama** | Hatalar monitoring sistemine gönderilir |

### Hata Yakalama Hiyerarşisi

```
1. Component try/catch (async işlemler)
2. ErrorBoundary (render hataları)
3. Global window.onerror (yakalanmayan)
```

### Kullanıcıya Gösterim

| Hata Tipi | Kullanıcı Görünümü |
|-----------|-------------------|
| Network error | "Bağlantı hatası, tekrar deneyin" |
| Auth error | "Oturum süresi doldu" |
| Server error | "Bir sorun oluştu, daha sonra deneyin" |
| Not found | 404 sayfası |
| Unknown | "Beklenmedik hata" + yenile butonu |

---

## 3. Console Error Politikası

### Production'da

| Level | İzin | Not |
|-------|------|-----|
| `console.error` | ✅ | Kritik hatalar |
| `console.warn` | ⚠️ | Minimal kullan |
| `console.log` | ❌ | Production'da yasak |
| `console.info` | ❌ | Production'da yasak |

### Development'ta

Tüm console çağrıları serbesttir.

---

## 4. Alert Kuralları

### Ne Zaman Alert Üretilir?

| Koşul | Alert Seviyesi | Aksiyon |
|-------|---------------|---------|
| Hata oranı > %5 | Critical | Hemen müdahale |
| API başarısızlık > %10 | Critical | Backend kontrol |
| Sayfa yükleme > 5s | Warning | Performans inceleme |
| Crash > 3 / saat | Critical | Hemen rollback |

### Alert Alıcıları

| Seviye | Kim Bilgilendirilir? |
|--------|---------------------|
| Critical | Lead + Tüm ekip |
| Error | İlgili developer |
| Warning | Günlük rapor |

---

## 5. Loglama Seviyeleri

| Seviye | Ne Loglanır? | Retention |
|--------|-------------|-----------|
| **Error** | Exception, crash, API failure | 30 gün |
| **Warning** | Yavaş response, retry | 14 gün |
| **Info** | Deploy, user action | 7 gün |

### Log Formatı

```
[Timestamp] [Level] [Source] [Message] [Context]
```

---

## 6. Do / Don't

### ✅ Do

- ErrorBoundary ile tüm sayfaları sar
- Kullanıcıya anlaşılır hata mesajı göster
- Hataları loglama sistemine gönder
- Kritik hatalara hızlı müdahale et
- Retry mekanizması ekle (network)

### ❌ Don't

- console.log'u production'da bırakma
- Hassas veriyi log'a yazma (token, şifre)
- Tüm hataları aynı seviyede değerlendirme
- Alert yorgunluğu yaratma (spam)
- Kullanıcıya teknik hata detayı gösterme

---

## Referanslar

- [Production Readiness](./PRODUCTION_READINESS.md)
- [Release Process](./RELEASE_PROCESS.md)
