# Hac & Umre Tur Karşılaştırma Platformu — Plan

## Objectives
- AI destekli, TypeScript tabanlı, Hac/Umre turlarını karşılaştırma ve öneri sunma platformu oluşturmak.
- Çoklu veri girişi (Admin paneli, Harici API, Excel/CSV import) ve kapsamlı karşılaştırma kriterleri (fiyat, tarih, süre, otel, hizmetler, vize, ulaşım, rehber).
- Çoklu AI sağlayıcı desteği (OpenAI GPT-5, Claude Sonnet 4, Gemini 2.5 Pro) — Emergent LLM Key aracılığıyla.
- Kullanıcı yönetimi (kayıt/giriş), kullanıcı dostu karşılaştırma arayüzü ve AI chatbot entegrasyonu.
- Teknoloji: Backend FastAPI (Python), Frontend React + TypeScript, MongoDB, shadcn/ui.

## Implementation Steps

### Teknik Mimari ve Kısıtlar
- Backend → MongoDB: MONGO_URL (env). Backend 0.0.0.0:8001.
- Frontend → Backend: REACT_APP_BACKEND_URL + "/api" prefix zorunlu.
- LLM: Emergent LLM Key kullan, sağlayıcı seçimi ve geriye-dönük fallback.
- Dosya yükleme: CSV (FastAPI UploadFile). Büyük dosyalar için satır-satır işleme kuyruğu (Phase 2+).
- Modelleme (Mongo):
  - users: {email, password_hash, role, created_at}
  - tours: {title, operator, price, currency, start_date, end_date, duration, hotel, services[], visa, transport, guide, itinerary[], rating, source, created_by}
  - comparisons: {user_id, tour_ids[], criteria[], ai_provider, result, created_at}
  - chats: {user_id, message, context_tour_ids[], ai_provider, answer, created_at}
  - import_jobs: {user_id, filename, mapping, status, stats, created_at}

---

### Phase 1 — Core POC (REQUIRED)
Amaç: LLM entegrasyonunu (OpenAI/Claude/Gemini) tek bir servis üzerinden çalışır hâle getirip tur karşılaştırma ve chatbot yanıtlarını doğrulamak.

1) Entegrasyon Playbook & Kurulum
- integration_playbook_expert_v2: OpenAI, Anthropic, Google (text generation) için entegrasyon yönergesi al.
- emergent_integrations_manager: EMERGENT_LLM_KEY doğrula.
- Gerekirse web_search_tool_v2: model adları/parametrelerin güncel kullanımı.

2) test_core.py (tek script, izole)
- Fonksiyonlar:
  - test_compare_tours(model): 2 örnek tur JSON → kıyaslama promptu → yapılandırılmış çıktı (JSON + özet).
  - test_chatbot(model): Domain Q&A (“Yaşlılar için uygun mu?”, “Vize dahil mi?”) → makul yanıt.
  - test_csv_parse_small(): Küçük CSV okuma → şema validasyonu.
- Sağlayıcı rotasyonu: [openai, claude, gemini] sırayla çağır, başarısızlıkta fallback.

3) Başarı Kriterleri (Phase 1)
- Her 3 sağlayıcıdan da (en az 1) anlamlı yanıt (>200 karakter, hatasız JSON yapısı) alınması.
- Karşılaştırma sonucunda kriter-bazlı kısa özet + tabloya dönüştürülebilir yapı.
- Chatbot’un en az 3 farklı domain sorusuna doğru bağlamsal cevap vermesi.
- CSV parse ve şema kontrolünün hatasız çalışması.

4) Phase 1 User Stories
- (US1) Admin olarak iki tur JSON’u verip AI’dan kıyaslama çıktısı alabilirim.
- (US2) Admin olarak sağlayıcıyı (OpenAI/Claude/Gemini) seçip sonucu karşılaştırabilirim.
- (US3) Admin olarak “vize dahil mi, konfor seviyesi?” gibi sorular sorup doğru cevap alabilirim.
- (US4) Admin olarak küçük bir CSV dosyasını okuyup alan eşleşmesini doğrulayabilirim.
- (US5) Sağlayıcı hata verirse sistem otomatik fallback yaparak yine sonuç döndürür.
- (US6) Yanıtlar JSON + özet formatında ve keyifli okunur.

5) Test ve Düzeltme
- test_core.py çalıştır → hata varsa düzelt → tekrar çalıştır (başarıya kadar).

---

### Phase 2 — Ana Uygulama Geliştirme
Amaç: POC doğrulandığında tam uygulamayı inşa et.

**STATUS: ✅ TAMAMLANDI**

**Tamamlanan Özellikler:**
- ✅ Backend API (Auth, Tours CRUD, Compare, Chat, Import)
- ✅ Frontend TypeScript React (Vite)
- ✅ Operator ilan verme sistemi
- ✅ Admin onay sistemi
- ✅ E2E Testing (100% başarı)

**Test Sonuçları:**
- Backend: 14/14 test geçti (100%)
- Frontend: Tüm UI akışları çalışıyor (100%)
- AI Integration: OpenAI ve Claude çalışıyor

---

### Phase 3 — UX/UI İyileştirmeler ve Deployment Hazırlığı

**STATUS: ✅ TAMAMLANDI**

**Tamamlanan İyileştirmeler:**

1. **Vite Migration:**
   - Create React App → Vite
   - 3-5x daha hızlı HMR
   - TypeScript full support
   - Modern build optimizations

2. **Framer Motion Animasyonları:**
   - Page transitions (fade, slide, scale)
   - Card hover effects (3D transforms)
   - Button micro-interactions
   - Form stagger animations
   - Loading states (skeleton, spinner)
   - List stagger effects

3. **Advanced CSS Animasyonları (400+ satır):**
   - 3D Transforms: flip3D, rotate3D, tilt-hover
   - Gradients: gradientShift, golden-shine
   - Particles: floating, sparkle, confetti
   - Glows: neonGlow, pulse-ring, heartbeat
   - Premium effects: premium-card, shadow-lift
   - Loading: spinner-multi, dots-loading

4. **Vercel Deployment Hazırlığı:**
   - vercel.json konfigürasyonu
   - DEPLOYMENT_GUIDE.md (detaylı kılavuz)
   - README.md (proje dokümantasyonu)
   - .env.example templates
   - .vercelignore

5. **Son Test (Iteration 2):**
   - Backend: 100% (14/14 test)
   - Frontend: 100% (tüm UI akışları)
   - Operator features: 100%
   - Admin features: 100%
   - Animations: 100%
   - Mobile: 100%

**Dosyalar:**
- `/app/vercel.json` - Vercel deployment config
- `/app/DEPLOYMENT_GUIDE.md` - Deployment kılavuzu
- `/app/README.md` - Proje dokümantasyonu
- `/app/frontend/vite.config.ts` - Vite yapılandırması
- `/app/frontend/src/styles/advanced-animations.css` - Gelişmiş animasyonlar
- `/app/test_reports/iteration_2.json` - Son test raporu

---

### Phase 4 — İyileştirmeler (Opsiyonel)
- Harici tur API entegrasyonu (playbook + POC, rate limit cache).
- Çoklu dil/para birimi (TRY, SAR, USD), canlı kur dönüşümü.
- Gelişmiş kıyaslama: ağırlıklı kriterler, kullanıcı öncelik profili.
- İnceleme/Yorumlar, operatör doğrulama, denetim günlükleri.
- Task queue (RQ/Celery) ile büyük importlar ve yoğun AI işlemleri.

---

## Next Actions (Hemen)
1) Phase 1 başlat: Entegrasyon playbook’larını al, EMERGENT_LLM_KEY’i doğrula.
2) test_core.py yaz: compare_tours, chatbot, csv_parse fonksiyonları; sağlayıcı rotasyonu + fallback.
3) test_core.py çalıştır ve hataları gider (başarıya kadar).
4) Phase 2 geliştirmesine başla: 20–30 dakikalık geliştirme bildirimi + design_agent ile UI rehberi al.
5) Uygulama tamamlandığında testing_agent_v3 ile E2E test yap, bulguları düzelt ve yeniden test et.

## Success Criteria (Genel)
- Phase 1: 3 sağlayıcıdan en az birinde başarılı, yapısal ve anlamlı AI çıktıları + CSV parse doğrulandı.
- Phase 2: Tüm ana akışlar (Auth, Tour CRUD, Compare, Chatbot, CSV Import) hatasız çalışıyor; /api prefix ve env kullanımına tam uyum; FE- BE entegrasyonu sorunsuz.
- E2E testler (testing_agent_v3) kritik akışlarda yeşil; küçük hatalar giderildi.
- UI/UX: Yükleme ve hata durumları belirgin; data-testid etiketleri mevcut; 10x daha iyi kullanıcı deneyimi.
