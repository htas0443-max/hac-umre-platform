"""Mock LlmChat for development without real API - Updated to match ai_service.py interface"""
from typing import List, Any, Optional


class UserMessage:
    """Mock UserMessage class - supports both 'text' and 'content' params"""
    def __init__(self, text: str = None, content: str = None):
        # Support both 'text' (used by ai_service.py) and 'content' (legacy)
        self.content = text or content or ""
        self.text = self.content
        self.role = "user"


class LlmChat:
    """Mock LlmChat class for development - matches ai_service.py interface"""
    
    def __init__(self, api_key: str, session_id: str = None, system_message: str = None, model: str = "gpt-4"):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model = model
        self.provider = "openai"
        self.messages = []
    
    def with_model(self, provider: str, model: str):
        """Chain method to set provider and model"""
        self.provider = provider
        self.model = model
        return self
    
    def add_message(self, message: UserMessage):
        """Add a message to the conversation"""
        self.messages.append(message)
    
    async def send_message(self, message: UserMessage) -> str:
        """Send a message and get AI response - matches ai_service.py interface"""
        self.messages.append(message)
        return await self.send_async()
    
    async def send_async(self) -> str:
        """Mock async send - returns a helpful demo response"""
        if not self.messages:
            return "No messages to process."
        
        last_message = self.messages[-1].content if self.messages else ""
        
        # Check for comparison requests
        if "karşılaştır" in last_message.lower() or "compare" in last_message.lower():
            return '''## Tur Karşılaştırma Sonucu

🎯 **Demo Modu Aktif** - Gerçek AI karşılaştırması için `emergentintegrations` paketi gereklidir.

### Genel Değerlendirme

Bu turlar arasında seçim yaparken aşağıdaki kriterleri göz önünde bulundurmanızı öneririm:

| Kriter | Önem | Açıklama |
|--------|------|----------|
| 💰 Fiyat | Yüksek | Bütçenize uygun tour seçin |
| 🏨 Konaklama | Yüksek | Kabe'ye yakınlık önemli |
| 🚌 Ulaşım | Orta | Rahat transfer imkanları |
| 📋 Hizmetler | Orta | Rehberlik ve vize dahil mi? |

### Öneri
Her iki turun da avantajları var. Önceliklerinize göre karar verin.

*Demo modunda çalışıyor - Gerçek AI için paketi yükleyin*'''
        
        # General chat response
        return f'''Merhaba! 👋 Ben Hac & Umre AI Danışmanınızım.

🎯 **Demo Modu Aktif** - Şu anda mock yanıtlar veriyorum.

### Size Nasıl Yardımcı Olabilirim?

📍 **Tur Karşılaştırma**
   - Farklı turları analiz edebilir
   - Fiyat/kalite değerlendirmesi yapabilirim

📍 **Tur Önerileri**
   - Bütçenize göre tur önerebilirim
   - Tarih ve süreye göre filtreleme

📍 **Genel Bilgiler**
   - Hac ve Umre farkları
   - Vize süreçleri
   - Hazırlık tavsiyeleri

**Sorununuz:** "{last_message[:100]}..."

Gerçek AI yanıtları için `emergentintegrations` paketinin yüklenmesi gerekiyor.

---
*Demo modunda çalışıyor • Provider: {self.provider}*'''
    
    def send(self) -> str:
        """Synchronous send wrapper"""
        import asyncio
        return asyncio.run(self.send_async())
