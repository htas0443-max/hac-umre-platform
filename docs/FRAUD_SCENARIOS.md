# 🛡️ Dolandırıcılık Senaryoları ve Sessiz Savunmalar

Platform kalitesini korumak için en olası kötüye kullanım senaryoları ve savunma stratejileri.

---

## Senaryo → Savunma Tablosu

| # | Senaryo | Tipik Davranışlar | Tespit Sinyalleri | Admin Aksiyonu | Otomatik Ceza |
|---|---------|-------------------|-------------------|----------------|---------------|
| **1** | **Sahte Firma** | Gerçek TURSAB numarası olmadan veya başka firmaya ait belgeyle kayıt girişimi | OCR uyumsuzluğu, belge yeniden kullanımı | 72+ saat detaylı inceleme, ek belge talebi | ❌ Hayır |
| **2** | **Hayalet İlan Bombardımanı** | Çok sayıda düşük kaliteli veya kopyala-yapıştır ilan girişi | 10+ düzenleme/saat, aynı metin 3+ ilana | 🟠 "Tekrarlayan içerik" etiketi, manuel onay | ❌ Hayır |
| **3** | **Fiyat Manipülasyonu** | Aşırı düşük fiyat sonra ani artış (bait-and-switch) | 72 saat içinde fiyat değişimi > %100 | 48 saat bekletme, "Aşırı düzenleme" etiketi | ❌ Hayır |
| **4** | **Belge Sahteciliği** | Photoshop'lanmış veya süresi geçmiş belge yükleme | OCR güven skoru düşük, meta veri anormal | 🔴 Kritik kuyruk, resmi kaynak cross-check | ❌ Hayır |
| **5** | **Terk Edilmiş Tur** | İlan yayınla → müşteri topla → tur iptal et | 2+ kez iptal, müşteri şikayeti | "Dikkat" etiketi, 72+ saat onay süresi | ❌ Hayır |

---

## Savunma Felsefesi

| Prensip | Açıklama |
|---------|----------|
| **Sessiz yavaşlatma** | Şüpheli kullanıcıyı engellemek yerine onay süresini uzat |
| **Görünmez etiketler** | Kullanıcı "Dikkat" etiketini görmez, sadece admin görür |
| **Sürtünme arttırma** | Riskli işlemlerde ek belge veya bekleme süresi talep et |
| **Manuel kontrol** | Otomatik ban/ceza yok, her karar admin onayından geçer |
| **Geri alınabilirlik** | Yanlış etiketler kolayca kaldırılabilir |

---

## Senaryo Detayları

### 1. Sahte Firma
- **Davranış:** Başka firmaya ait TURSAB belgesi yükler
- **Sinyal:** OCR'dan çıkan firma adı ≠ kayıt firma adı
- **Aksiyon:** 72+ saat kuyruk, "Belge uyumsuzluğu var" mesajı

### 2. Hayalet İlan Bombardımanı
- **Davranış:** Aynı içerikle çok sayıda ilan açar
- **Sinyal:** Metin benzerliği > %80 ve 3+ ilan
- **Aksiyon:** 🟠 Etiket, tüm ilanlar manuel kuyruğa

### 3. Fiyat Manipülasyonu
- **Davranış:** ₺5.000 ilan açar, sonra ₺15.000'e günceller
- **Sinyal:** Kısa sürede fiyat değişimi > %100
- **Aksiyon:** 48 saat bekletme, aylık limit uyarısı

### 4. Belge Sahteciliği
- **Davranış:** Photoshop'lu veya eski tarihli belge yükler
- **Sinyal:** OCR güven skoru düşük, EXIF anormal
- **Aksiyon:** 🔴 Kritik kuyruk, TURSAB cross-check

### 5. Terk Edilmiş Tur
- **Davranış:** İlan yayınla → müşteri topla → iptal et
- **Sinyal:** 2+ iptal, müşteri şikayeti
- **Aksiyon:** Kalıcı "Dikkat" etiketi, 72+ saat onay

---

*Referans: [abuse_prevention_governance.md](./ABUSE_PREVENTION_GOVERNANCE.md)*
