import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Pin, Brain, User, Bot, Mic, Square, Volume2, Pause, Bell, BellOff, Send, RefreshCw, Bird, Keyboard } from 'lucide-react';
import { toursApi, aiApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import type { Tour, ChatMessage } from '../../types';

// Web Speech API types declaration
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  useSEO({
    title: 'Hac ve Umre Rehberi | Sık Sorulan Sorular ve Bilgiler',
    description: 'Hac ve Umre hakkında merak edilen soruların cevaplarını bulun. Vize, sağlık şartları, ibadet süreci ve seyahat bilgileri için rehber.',
    canonical: 'https://hacveumreturlari.net/chat',
  });

  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextTours, setContextTours] = useState<Tour[]>([]);
  const [provider, setProvider] = useState('anthropic');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice chat state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR'; // Turkish language

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR'; // Turkish
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Toggle voice recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız ses tanımayı desteklemiyor.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    const tourId = searchParams.get('tour');
    if (tourId) {
      loadTour(tourId);
    }
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTour = async (tourId: string) => {
    try {
      const tour = await toursApi.getById(tourId);
      setContextTours([tour]);

      setMessages([{
        role: 'assistant',
        content: `Merhaba! ${tour.title} turu hakkında sorularınızı cevaplayabilirim. Size nasıl yardımcı olabilirim?`,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Tur yüklenemedi:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.chat(
        input,
        contextTours.map(t => t._id),
        provider
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-speak AI response if voice is enabled
      if (voiceEnabled) {
        speakText(response.answer);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      console.error('Error response:', err.response?.data);

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Hata: ${err.response?.data?.detail || err.message || 'Maalesef bir hata oluştu. Lütfen tekrar deneyin.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="chat-page"
      data-testid="chat-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🕋 Hac Rehberi</h1>
        <p style={{ color: 'var(--neutral-gray-500)', fontSize: '1.125rem' }}>
          Hac ve Umre turları hakkında sorularınıza yanıt alın
        </p>
      </motion.div>

      {/* Context Tours */}
      <AnimatePresence>
        {contextTours.length > 0 && (
          <motion.div
            className="card glass"
            style={{ marginBottom: '2rem', background: 'var(--ai-background)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Pin size={18} color="var(--primary-teal)" /> Bağlam Turları</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {contextTours.map((tour) => (
                <motion.span
                  key={tour._id}
                  className="badge badge-ai"
                  whileHover={{ scale: 1.05 }}
                >
                  {tour.title}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Selection */}
      <motion.div
        className="card"
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={20} color="var(--primary-teal)" /> AI Model Seçimi</h3>
        <div className="chat-provider-grid" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <motion.label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: '12px', background: provider === 'openai' ? 'var(--primary-light)' : 'transparent', border: '2px solid', borderColor: provider === 'openai' ? 'var(--primary-emerald)' : 'var(--neutral-gray-300)', flex: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="chatProvider"
              value="openai"
              checked={provider === 'openai'}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="chat-provider-openai"
              style={{ accentColor: 'var(--primary-emerald)' }}
            />
            <span style={{ fontWeight: 600 }}>OpenAI GPT-5</span>
          </motion.label>
          <motion.label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: '12px', background: provider === 'anthropic' ? 'var(--ai-background)' : 'transparent', border: '2px solid', borderColor: provider === 'anthropic' ? 'var(--ai-primary)' : 'var(--neutral-gray-300)', flex: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="chatProvider"
              value="anthropic"
              checked={provider === 'anthropic'}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="chat-provider-anthropic"
              style={{ accentColor: 'var(--ai-primary)' }}
            />
            <span style={{ fontWeight: 600 }}>Claude Sonnet 4 ⚡ (Hızlı)</span>
          </motion.label>
          <motion.label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: '12px', background: provider === 'kumru' ? 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' : 'transparent', border: '2px solid', borderColor: provider === 'kumru' ? '#dc2626' : 'var(--neutral-gray-300)', flex: 1, color: provider === 'kumru' ? 'white' : 'inherit' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="chatProvider"
              value="kumru"
              checked={provider === 'kumru'}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="chat-provider-kumru"
              style={{ accentColor: '#dc2626' }}
            />
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Bird size={16} /> Kumru 2B (Türkçe AI)</span>
          </motion.label>
        </div>
      </motion.div>

      {/* Chat Messages */}
      <motion.div
        className="card"
        style={{
          marginBottom: '2rem',
          minHeight: '500px',
          maxHeight: '600px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, var(--neutral-white) 0%, var(--neutral-beige) 100%)'
        }}
        data-testid="chat-messages"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {messages.length === 0 && (
          <motion.div
            style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--neutral-gray-500)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ marginBottom: '1rem' }}><MessageCircle size={64} color="var(--text-muted)" /></div>
            <p style={{ fontSize: '1.125rem' }}>Henüz mesaj yok. Aşağıdan sohbete başlayın.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--primary-emerald) 0%, var(--primary-sage) 100%)'
                  : 'var(--neutral-white)',
                color: msg.role === 'user' ? 'var(--neutral-white)' : 'var(--neutral-gray-900)',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                boxShadow: 'var(--shadow-md)',
                border: msg.role === 'assistant' ? '1px solid var(--ai-primary)' : 'none'
              }}
              data-testid={`chat-message-${idx}`}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
                {msg.role === 'user' ? <><User size={14} /> Siz</> : <><Bot size={14} /> AI Asistan</>}
              </div>
              <div style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.75rem' }}>
                {msg.timestamp.toLocaleTimeString('tr-TR')}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'var(--neutral-white)',
              alignSelf: 'flex-start',
              maxWidth: '80%',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--ai-primary)'
            }}
            data-testid="chat-loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Bot size={14} /> AI Asistan</div>
            <motion.div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span>Yazıyor</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              >.</motion.span>
            </motion.div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input */}
      <motion.div
        className="card glass chat-input-card"
        style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Textarea Section */}
        <div className="chat-textarea-wrapper">
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Keyboard size={14} /> Mesajınız</span>
          </label>
          <textarea
            className="form-input chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Mesajınızı yazın veya mikrofon butonuna basarak konuşun..."
            rows={3}
            disabled={loading}
            data-testid="chat-input"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="chat-actions-row">
          {/* Voice Control Buttons */}
          <div className="chat-voice-controls">
            {/* Microphone Button */}
            <motion.button
              onClick={toggleListening}
              className={`btn chat-action-btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              disabled={loading}
              data-testid="voice-record-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: isListening ? '#ef4444' : 'var(--bg-tertiary)',
                border: isListening ? '2px solid #ef4444' : '2px solid var(--border-color)'
              }}
              title={isListening ? 'Kaydı Durdur' : 'Sesli Konuş'}
            >
              {isListening ? <Square size={20} /> : <Mic size={20} />}
            </motion.button>

            {/* Speaker Button (Stop/Play) */}
            <motion.button
              onClick={isSpeaking ? stopSpeaking : () => {
                const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
                if (lastAssistant) speakText(lastAssistant.content);
              }}
              className={`btn chat-action-btn ${isSpeaking ? 'btn-warning' : 'btn-secondary'}`}
              disabled={loading || messages.filter(m => m.role === 'assistant').length === 0}
              data-testid="voice-speak-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: isSpeaking ? '#f59e0b' : 'var(--bg-tertiary)',
                border: isSpeaking ? '2px solid #f59e0b' : '2px solid var(--border-color)'
              }}
              title={isSpeaking ? 'Sesi Durdur' : 'Son Yanıtı Oku'}
            >
              {isSpeaking ? <Pause size={20} /> : <Volume2 size={20} />}
            </motion.button>

            {/* Voice Toggle */}
            <motion.button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="btn chat-action-btn"
              data-testid="voice-toggle-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: voiceEnabled ? 'var(--primary-teal)' : 'var(--bg-tertiary)',
                border: voiceEnabled ? '2px solid var(--primary-teal)' : '2px solid var(--border-color)',
                color: voiceEnabled ? 'white' : 'inherit'
              }}
              title={voiceEnabled ? 'Otomatik Sesli Yanıt Açık' : 'Otomatik Sesli Yanıt Kapalı'}
            >
              {voiceEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </motion.button>
          </div>

          {/* Send Button */}
          <motion.button
            onClick={handleSend}
            className="btn btn-primary chat-send-btn"
            disabled={loading || !input.trim()}
            data-testid="chat-send-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Gönderiliyor...</> : <><Send size={16} /> Gönder</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
