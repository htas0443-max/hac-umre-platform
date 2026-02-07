# 📋 Tur Şirketi Belge ve Metadata Şeması

> **Amaç:** Sahte belge yüklemeyi zorlaştırmak, doğrulama temelini oluşturmak

---

## Genel Kurallar

| Kural | Açıklama |
|-------|----------|
| Zorunlu belgeler tamamlanmadan ilan yayınlanmaz | ✅ |
| Belge adı/numarası kullanıcıya gösterilmez | ✅ |
| TÜRSAB belgesi kritik olarak işaretlenir | ✅ |
| Tüm belgeler arasında ünvan tutarlılığı kontrol edilir | ✅ |

---

## 1. TÜRSAB İşletme Belgesi

**Kritiklik:** 🔴 Kritik (zorunlu)

### A) Metadata Alanları

| Alan Adı | Tip | Zorunlu | Açıklama |
|----------|-----|---------|----------|
| `tursab_no` | Sayı | ✅ | TÜRSAB belge numarası |
| `firma_unvani` | Metin | ✅ | Şirket resmi ünvanı |
| `belge_tarihi` | Tarih | ✅ | Belge düzenlenme tarihi |
| `gecerlilik_tarihi` | Tarih | ✅ | Belge son geçerlilik tarihi |
| `belge_dosyasi` | Dosya | ✅ | PDF/JPG formatında |

### B) Doğrulama Kuralları

| Kural | Kontrol |
|-------|---------|
| `tursab_no` formatı | 4-6 haneli sayı |
| `gecerlilik_tarihi` | Bugünden ileri olmalı |
| `firma_unvani` | Vergi levhasıyla eşleşmeli |
| Dosya boyutu | Max 5MB |
| Dosya formatı | PDF, JPG, PNG |

### C) Kullanıcıya Gösterilecek Açıklama

> "TÜRSAB tarafından verilen işletme belgenizi yükleyiniz. Belge geçerlilik tarihi güncel olmalıdır."

---

## 2. Vergi Levhası

**Kritiklik:** 🟠 Yüksek (zorunlu)

### A) Metadata Alanları

| Alan Adı | Tip | Zorunlu | Açıklama |
|----------|-----|---------|----------|
| `vergi_no` | Metin | ✅ | 10 veya 11 haneli VKN/TCKN |
| `firma_unvani` | Metin | ✅ | Vergi levhasındaki ünvan |
| `vergi_dairesi` | Metin | ✅ | Bağlı vergi dairesi |
| `belge_yili` | Sayı | ✅ | Hangi yıla ait |
| `belge_dosyasi` | Dosya | ✅ | PDF/JPG formatında |

### B) Doğrulama Kuralları

| Kural | Kontrol |
|-------|---------|
| `vergi_no` formatı | 10 hane (tüzel) veya 11 hane (gerçek) |
| `belge_yili` | Güncel yıl veya bir önceki yıl |
| `firma_unvani` | TÜRSAB belgesiyle eşleşmeli |
| Dosya boyutu | Max 5MB |

### C) Kullanıcıya Gösterilecek Açıklama

> "Şirketinize ait güncel vergi levhasını yükleyiniz. Vergi numaranızın okunabilir olması gerekmektedir."

---

## 3. İmza Sirküleri

**Kritiklik:** 🟡 Orta (zorunlu)

### A) Metadata Alanları

| Alan Adı | Tip | Zorunlu | Açıklama |
|----------|-----|---------|----------|
| `noter_tarihi` | Tarih | ✅ | Noter onay tarihi |
| `yetkili_adi` | Metin | ✅ | İmza yetkili kişi |
| `firma_unvani` | Metin | ✅ | Sirkülerdeki ünvan |
| `belge_dosyasi` | Dosya | ✅ | PDF/JPG formatında |

### B) Doğrulama Kuralları

| Kural | Kontrol |
|-------|---------|
| `noter_tarihi` | Son 5 yıl içinde olmalı |
| `firma_unvani` | Diğer belgelerle eşleşmeli |
| Dosya boyutu | Max 5MB |

### C) Kullanıcıya Gösterilecek Açıklama

> "Şirketinizin noter onaylı imza sirkülerini yükleyiniz. Son 5 yıl içinde düzenlenmiş olmalıdır."

---

## Çapraz Doğrulama Kuralları

| Kontrol | Belgeler | Kural |
|---------|----------|-------|
| Firma Ünvanı | Tümü | Üç belgede aynı olmalı |
| Vergi No | TÜRSAB + Vergi Levhası | Eşleşmeli (mevcutsa) |
| Geçerlilik | TÜRSAB | Güncel olmalı |

---

## Belge Durumları

| Durum | Açıklama | İlan İzni |
|-------|----------|-----------|
| `pending` | Yüklendi, inceleme bekliyor | ❌ |
| `approved` | Onaylandı | ✅ |
| `rejected` | Reddedildi | ❌ |
| `expired` | Süresi doldu | ❌ |

---

## Özet

| Belge | Kritiklik | Zorunlu | Çapraz Kontrol |
|-------|-----------|---------|----------------|
| TÜRSAB | 🔴 Kritik | ✅ | Ünvan, vergi no |
| Vergi Levhası | 🟠 Yüksek | ✅ | Ünvan |
| İmza Sirküleri | 🟡 Orta | ✅ | Ünvan |
