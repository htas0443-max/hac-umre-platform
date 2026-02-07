# 🚀 Release Süreci ve Deployment Gate

> **Amaç:** Production deploy sürecini standartlaştırmak ve hataları önlemek

---

## 1. Release Akışı

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Geliştirme  │ ──▶ │   Staging    │ ──▶ │  Production  │
│   (main)     │     │   (test)     │     │   (live)     │
└──────────────┘     └──────────────┘     └──────────────┘
        │                  │                     │
        ▼                  ▼                     ▼
    PR Merge          Smoke Test           Monitoring
```

### Adımlar

| # | Adım | Sorumlu |
|---|------|---------|
| 1 | PR onaylandı ve merge edildi | Developer / Reviewer |
| 2 | Staging ortamına deploy | Otomatik (CI/CD) |
| 3 | Staging'de smoke test | Developer |
| 4 | Production Readiness Checklist dolduruldu | Developer |
| 5 | Deploy onayı alındı | Reviewer / Lead |
| 6 | Production'a deploy | Yetkili Developer |
| 7 | Post-deploy kontrol | Developer |

---

## 2. Deploy Gate Kuralları

### ✅ Deploy Yapılabilir

- [x] `npm run build` hatasız
- [x] Staging'de test edildi
- [x] [Production Readiness Checklist](./PRODUCTION_READINESS.md) tamamlandı
- [x] Tüm maddeler ✅ durumunda
- [x] Deploy onayı alındı

### ❌ Deploy Yapılamaz

- [ ] Build hatası var
- [ ] Staging testi yapılmadı
- [ ] Checklist'te ⚠️ veya ❌ madde var
- [ ] Onay alınmadı
- [ ] Cuma 17:00 sonrası (acil değilse)

---

## 3. Roller ve Yetki

| Rol | Yetki |
|-----|-------|
| **Developer** | Staging deploy, test, checklist doldurma |
| **Reviewer** | PR onay, deploy onay |
| **Lead** | Production deploy, rollback kararı |

---

## 4. Rollback Kuralları

### Ne Zaman Rollback?

| Durum | Aksiyon |
|-------|---------|
| Kritik hata (site çöktü) | Hemen rollback |
| Major bug (özellik çalışmıyor) | 30 dk içinde karar |
| Minor bug (görsel bozukluk) | Hotfix tercih edilir |

### Nasıl Rollback?

1. Önceki stabil versiyon belirlenir
2. Deploy komutu önceki versiyona çalıştırılır
3. Rollback sonrası smoke test yapılır
4. Post-mortem dokümanı oluşturulur

---

## 5. Post-Deploy Kontrol

| # | Kontrol | Süre |
|---|---------|------|
| 1 | Ana sayfa açılıyor | 1 dk |
| 2 | Login/logout çalışıyor | 2 dk |
| 3 | Kritik akışlar test edildi | 5 dk |
| 4 | Console'da hata yok | 1 dk |
| 5 | Mobilde görünüm kontrol | 2 dk |

---

## 6. Do / Don't

### ✅ Do

- Staging'de test et
- Checklist doldur
- Onay al
- Post-deploy kontrol yap
- Hata durumunda hızlı rollback

### ❌ Don't

- Test etmeden deploy etme
- Cuma akşamı deploy etme
- Onaysız production'a gitme
- Rollback planı olmadan deploy etme
- Panikle hotfix yazma

---

## Referanslar

- [Production Readiness Checklist](./PRODUCTION_READINESS.md)
- [UI Governance](./UI_GOVERNANCE.md)
