# 🤖 Sessiz Otomasyon Modeli (Silent Automation)

> **Amaç:** Admin sadece istisnalara odaklanır, güvenli ilanlar otomatik ilerler  
> **Kural:** Kullanıcıya otomasyon gösterilmez

---

## Otomatik Onay Kriterleri

| Kriter | Değer |
|--------|-------|
| Inbox seviyesi | 🟢 Düşük Risk |
| Belgeler | ✅ Tam ve onaylı |
| OCR sonucu | ✅ Uyumlu |
| Dikkat etiketi | ❌ Yok |
| Firma geçmişi | ✅ Sorunsuz (3+ başarılı ilan) |
| İlan türü | Tekrarlayan (ilk ilan değil) |

**Tüm kriterler sağlanırsa → Otomatik onay**

---

## Otomatik Olmayan Durumlar

| Durum | Neden? |
|-------|--------|
| İlk ilan | Yeni firma tanınmıyor |
| 🟠 Orta risk | Manuel inceleme gerekli |
| 🔴 Yüksek risk | Detaylı inceleme gerekli |
| Dikkat etiketi var | Şüpheli davranış tespit edilmiş |
| Daha önce reddedilen | Geçmiş sorun |
| OCR uyumsuzluğu | Belge kontrolü gerekli |

---

## Otomasyon Akışı

```
1. İlan gönderilir
2. Sistem kriterleri kontrol eder
   ├─ Tüm kriterler OK → Otomatik onay (sessiz)
   └─ Bir kriter eksik → Manuel kuyruğa al
3. Otomatik onaylanan ilan yayına alınır
4. Admin log'a kayıt düşer
```

---

## Admin Panel Görünümü

### Otomatik Onaylanan İlanlar

```
┌─────────────────────────────────────────┐
│ 📊 Bugün                                │
├─────────────────────────────────────────┤
│ 🤖 Otomatik Onay: 12 ilan              │
│    [Listeyi Gör] [İptal Et]             │
├─────────────────────────────────────────┤
│ 📋 Manuel Bekleme: 5 ilan              │
│    [İncele]                             │
└─────────────────────────────────────────┘
```

### İlan Detayında

```
┌─────────────────────────────────────┐
│ ABC Tur - Umre Paketi 2026          │
│                                     │
│ Durum: ✅ Yayında                   │
│ Onay: 🤖 Otomatik                   │
│                                     │
│ [Onayı İptal Et]                    │
└─────────────────────────────────────┘
```

---

## Admin Geri Alma Akışı

| Adım | Açıklama |
|------|----------|
| 1 | Admin otomatik onaylanan ilanı görür |
| 2 | "Onayı İptal Et" butonuna tıklar |
| 3 | İlan yayından kaldırılır |
| 4 | Manuel inceleme kuyruğuna alınır |
| 5 | Firma bilgilendirilmez (sessiz) |

---

## Kullanıcı Deneyimi

| Alan | Görünürlük |
|------|-----------|
| "Otomatik onay" ifadesi | 🔒 Sadece admin |
| "🤖" etiketi | 🔒 Sadece admin |
| Onay süresi | ✅ Kullanıcı görür ("< 1 saat") |
| Onay yöntemi | ❌ Kullanıcı görmez |

---

## Kurallar

- ✅ Otomasyon sessiz çalışır
- ✅ Admin her zaman geri alabilir
- ✅ Log'a kayıt düşer
- ❌ Kullanıcıya "otomatik" bilgisi yok
- ❌ Otomatik ret yok
