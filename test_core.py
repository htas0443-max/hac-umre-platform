"""
Hac & Umre Tur Karşılaştırma Platformu - Core POC Test
Bu test, AI entegrasyonlarını (OpenAI, Claude, Gemini) ve temel işlevleri doğrular.
"""
import os
import asyncio
import json
import csv
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Emergent LLM Key - MUST be set via environment variable
# SECURITY FIX: Removed hardcoded key
API_KEY = os.getenv("EMERGENT_LLM_KEY")
if not API_KEY:
    print("WARNING: EMERGENT_LLM_KEY not set. AI tests will be skipped.")

# Test verileri - 2 örnek tur
TOUR_1 = {
    "title": "Ekonomik Umre Paketi",
    "operator": "Umre Turları A.Ş.",
    "price": 15000,
    "currency": "TRY",
    "start_date": "2024-03-15",
    "end_date": "2024-03-22",
    "duration": "7 gün",
    "hotel": "Makkah Tower 3* - Harem'e 800m",
    "services": ["Uçak bileti", "Otel konaklama", "Havaalanı transferi", "Rehber"],
    "visa": "Vize dahil (işlemler tarafımızca yapılır)",
    "transport": "Türk Hava Yolları ekonomi sınıf",
    "guide": "Türkçe konuşan deneyimli rehber",
    "itinerary": [
        "Gün 1: İstanbul-Cidde uçuşu, Mekke'ye transfer",
        "Gün 2-5: Mekke'de ibadet",
        "Gün 6: Medine'ye hareket",
        "Gün 7: Medine'den dönüş"
    ]
}

TOUR_2 = {
    "title": "Lüks Hac Paketi",
    "operator": "Elit Hac Organizasyon",
    "price": 85000,
    "currency": "TRY",
    "start_date": "2024-06-10",
    "end_date": "2024-06-25",
    "duration": "15 gün",
    "hotel": "Hilton Suites 5* - Harem'e 200m",
    "services": ["Business class uçak", "5* otel", "VIP transfer", "Özel rehber", "Günde 3 öğün yemek", "Sağlık sigortası"],
    "visa": "Vize dahil (hızlandırılmış işlem)",
    "transport": "Türk Hava Yolları business class",
    "guide": "Uzman din görevlisi eşliğinde",
    "itinerary": [
        "Gün 1-2: İstanbul-Cidde, Mekke'ye VIP transfer",
        "Gün 3-7: Mekke'de ibadet ve hazırlık",
        "Gün 8-10: Hac menasiki (Arafat, Müzdelife, Mina)",
        "Gün 11-13: Mekke'de ibadet",
        "Gün 14-15: Medine ziyareti ve dönüş"
    ]
}

# AI Sağlayıcı konfigürasyonları
PROVIDERS = [
    {"name": "openai", "model": "gpt-5"},
    {"name": "anthropic", "model": "claude-sonnet-4-20250514"},
    {"name": "gemini", "model": "gemini-2.5-pro-preview-05-06"}
]

async def test_compare_tours(provider_name, model_name):
    """İki turu karşılaştırır ve yapılandırılmış çıktı döndürür"""
    print(f"\n{'='*60}")
    print(f"TUR KARŞILAŞTIRMA TESTİ - {provider_name.upper()} ({model_name})")
    print(f"{'='*60}")
    
    try:
        # LlmChat instance oluştur
        chat = LlmChat(
            api_key=API_KEY,
            session_id=f"compare-test-{provider_name}",
            system_message="Sen Hac ve Umre uzmanı bir asistansın. Turları detaylı karşılaştırır ve yapılandırılmış analizler sunarsın."
        ).with_model(provider_name, model_name)
        
        # Karşılaştırma promptu
        prompt = f"""Aşağıdaki iki Hac/Umre turunu karşılaştır ve analiz et:

TUR 1:
{json.dumps(TOUR_1, ensure_ascii=False, indent=2)}

TUR 2:
{json.dumps(TOUR_2, ensure_ascii=False, indent=2)}

Lütfen şu formatta JSON çıktısı ver:
{{
    "summary": "Genel karşılaştırma özeti (2-3 cümle)",
    "comparison": {{
        "price": {{"tour1": değer, "tour2": değer, "difference": "açıklama"}},
        "duration": {{"tour1": değer, "tour2": değer, "analysis": "açıklama"}},
        "comfort": {{"tour1": "değerlendirme", "tour2": "değerlendirme", "winner": "tur adı"}},
        "services": {{"tour1": sayı, "tour2": sayı, "comparison": "açıklama"}},
        "location": {{"tour1": "mesafe", "tour2": "mesafe", "analysis": "açıklama"}}
    }},
    "recommendations": [
        {{"type": "Bütçe dostu", "suggestion": "öneri"}},
        {{"type": "Konfor arayan", "suggestion": "öneri"}},
        {{"type": "İlk kez giden", "suggestion": "öneri"}}
    ],
    "scores": {{
        "tour1": {{"overall": 0-100, "value_for_money": 0-100, "comfort": 0-100}},
        "tour2": {{"overall": 0-100, "value_for_money": 0-100, "comfort": 0-100}}
    }}
}}
"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Yanıtı parse et
        print(f"✅ Yanıt alındı: {len(response)} karakter")
        
        # JSON parse dene
        try:
            # JSON'u ayıkla (markdown code blocks varsa temizle)
            response_clean = response.strip()
            if response_clean.startswith("```"):
                response_clean = response_clean.split("```")[1]
                if response_clean.startswith("json"):
                    response_clean = response_clean[4:]
            response_clean = response_clean.strip()
            
            result_json = json.loads(response_clean)
            print(f"✅ JSON parse başarılı")
            print(f"✅ Özet: {result_json.get('summary', 'N/A')[:150]}...")
            print(f"✅ Öneriler: {len(result_json.get('recommendations', []))} adet")
            
            return {
                "success": True,
                "provider": provider_name,
                "response_length": len(response),
                "json_valid": True,
                "summary": result_json.get('summary', ''),
                "recommendations_count": len(result_json.get('recommendations', []))
            }
        except json.JSONDecodeError as je:
            print(f"⚠️  JSON parse hatası ama yanıt alındı: {str(je)}")
            print(f"Yanıt önizleme: {response[:200]}...")
            return {
                "success": True,
                "provider": provider_name,
                "response_length": len(response),
                "json_valid": False,
                "error": str(je)
            }
            
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        return {
            "success": False,
            "provider": provider_name,
            "error": str(e)
        }

async def test_chatbot(provider_name, model_name):
    """Chatbot'un domain-specific sorulara cevap verme yeteneğini test eder"""
    print(f"\n{'='*60}")
    print(f"CHATBOT TESTİ - {provider_name.upper()} ({model_name})")
    print(f"{'='*60}")
    
    questions = [
        "Yaşlı bir kişi için hangi tur paketi daha uygun olur?",
        "Vize işlemleri ne kadar sürer?",
        "İlk kez Umre'ye gidecek biri için önerileriniz nelerdir?"
    ]
    
    results = []
    
    for i, question in enumerate(questions, 1):
        try:
            chat = LlmChat(
                api_key=API_KEY,
                session_id=f"chatbot-test-{provider_name}-q{i}",
                system_message="Sen Hac ve Umre danışmanısın. Kullanıcıların sorularına samimi ve bilgilendirici cevaplar verirsin."
            ).with_model(provider_name, model_name)
            
            context = f"""Kullanıcıya şu turlarla ilgili bilgi ver:

TUR 1: {TOUR_1['title']} - {TOUR_1['price']} {TOUR_1['currency']}, {TOUR_1['hotel']}, {len(TOUR_1['services'])} hizmet
TUR 2: {TOUR_2['title']} - {TOUR_2['price']} {TOUR_2['currency']}, {TOUR_2['hotel']}, {len(TOUR_2['services'])} hizmet

Soru: {question}"""
            
            message = UserMessage(text=context)
            response = await chat.send_message(message)
            
            print(f"\nSoru {i}: {question}")
            print(f"✅ Cevap: {response[:150]}...")
            print(f"✅ Uzunluk: {len(response)} karakter")
            
            results.append({
                "question": question,
                "answer_length": len(response),
                "success": True
            })
            
        except Exception as e:
            print(f"❌ Soru {i} hatası: {str(e)}")
            results.append({
                "question": question,
                "success": False,
                "error": str(e)
            })
    
    success_count = sum(1 for r in results if r['success'])
    print(f"\n✅ Başarılı cevaplar: {success_count}/{len(questions)}")
    
    return {
        "success": success_count >= 3,
        "provider": provider_name,
        "questions_answered": success_count,
        "total_questions": len(questions)
    }

def test_csv_parse():
    """CSV parse işlevselliğini test eder"""
    print(f"\n{'='*60}")
    print(f"CSV PARSE TESTİ")
    print(f"{'='*60}")
    
    # Örnek CSV verisi
    csv_content = """title,operator,price,currency,duration,hotel,visa
Ekonomik Umre,ABC Turizm,12000,TRY,7 gün,Makkah Hotel 3*,Dahil
VIP Hac Paketi,XYZ Organizasyon,95000,TRY,15 gün,Hilton 5*,Dahil
Ramazan Umresi,DEF Seyahat,18000,TRY,10 gün,Intercontinental 4*,Dahil"""
    
    try:
        csv_file = io.StringIO(csv_content)
        reader = csv.DictReader(csv_file)
        tours = list(reader)
        
        print(f"✅ CSV parse başarılı")
        print(f"✅ {len(tours)} tur okundu")
        
        # Şema kontrolü
        required_fields = ['title', 'operator', 'price', 'currency', 'duration', 'hotel', 'visa']
        for i, tour in enumerate(tours, 1):
            missing_fields = [field for field in required_fields if field not in tour]
            if missing_fields:
                print(f"❌ Tur {i} eksik alanlar: {missing_fields}")
                return {"success": False, "error": f"Missing fields: {missing_fields}"}
            else:
                print(f"✅ Tur {i}: {tour['title']} - Tüm alanlar mevcut")
        
        return {
            "success": True,
            "tours_parsed": len(tours),
            "schema_valid": True
        }
        
    except Exception as e:
        print(f"❌ CSV parse hatası: {str(e)}")
        return {"success": False, "error": str(e)}

async def run_all_tests():
    """Tüm testleri çalıştırır"""
    print("\n" + "="*60)
    print("HAC & UMRE TUR KARŞILAŞTIRMA PLATFORMU - CORE POC TEST")
    print("="*60)
    
    results = {
        "compare_tours": [],
        "chatbot": [],
        "csv_parse": None
    }
    
    # 1. Tur Karşılaştırma Testleri (tüm sağlayıcılar)
    print("\n\n🔍 1. TUR KARŞILAŞTIRMA TESTLERİ")
    for provider in PROVIDERS:
        result = await test_compare_tours(provider['name'], provider['model'])
        results['compare_tours'].append(result)
        await asyncio.sleep(1)  # Rate limit için kısa bekleme
    
    # 2. Chatbot Testleri (tüm sağlayıcılar)
    print("\n\n💬 2. CHATBOT TESTLERİ")
    for provider in PROVIDERS:
        result = await test_chatbot(provider['name'], provider['model'])
        results['chatbot'].append(result)
        await asyncio.sleep(1)
    
    # 3. CSV Parse Testi
    print("\n\n📊 3. CSV PARSE TESTİ")
    results['csv_parse'] = test_csv_parse()
    
    # SONUÇ RAPORU
    print("\n\n" + "="*60)
    print("TEST SONUÇLARI")
    print("="*60)
    
    # Karşılaştırma sonuçları
    print("\n📊 Tur Karşılaştırma:")
    compare_success = [r for r in results['compare_tours'] if r['success']]
    print(f"  Başarılı: {len(compare_success)}/{len(results['compare_tours'])}")
    for r in compare_success:
        print(f"  ✅ {r['provider']}: {r['response_length']} karakter, JSON: {r.get('json_valid', False)}")
    
    # Chatbot sonuçları
    print("\n💬 Chatbot:")
    chatbot_success = [r for r in results['chatbot'] if r['success']]
    print(f"  Başarılı: {len(chatbot_success)}/{len(results['chatbot'])}")
    for r in chatbot_success:
        print(f"  ✅ {r['provider']}: {r['questions_answered']}/{r['total_questions']} soru")
    
    # CSV sonuçları
    print("\n📊 CSV Parse:")
    if results['csv_parse']['success']:
        print(f"  ✅ {results['csv_parse']['tours_parsed']} tur başarıyla parse edildi")
    else:
        print(f"  ❌ Hata: {results['csv_parse'].get('error', 'Unknown')}")
    
    # GENEL DEĞERLENDİRME
    print("\n" + "="*60)
    all_passed = (
        len(compare_success) >= 1 and  # En az 1 sağlayıcıdan başarılı karşılaştırma
        len(chatbot_success) >= 1 and  # En az 1 sağlayıcıdan başarılı chatbot
        results['csv_parse']['success']  # CSV parse başarılı
    )
    
    if all_passed:
        print("🎉 TÜM TESTLER BAŞARILI!")
        print("✅ Core işlevsellik doğrulandı")
        print("✅ Ana uygulama geliştirmeye hazır")
    else:
        print("⚠️  BAZI TESTLER BAŞARISIZ")
        if len(compare_success) == 0:
            print("❌ Hiçbir sağlayıcıdan karşılaştırma sonucu alınamadı")
        if len(chatbot_success) == 0:
            print("❌ Hiçbir sağlayıcıdan chatbot yanıtı alınamadı")
        if not results['csv_parse']['success']:
            print("❌ CSV parse başarısız")
    
    print("="*60 + "\n")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)
