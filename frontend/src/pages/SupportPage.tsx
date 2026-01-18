import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ticketsApi } from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = [
    { id: 'payment', label: 'Ödeme & Fatura', icon: '💳' },
    { id: 'reservation', label: 'Rezervasyon', icon: '📅' },
    { id: 'technical', label: 'Teknik Sorun', icon: '🔧' },
    { id: 'tour', label: 'Tur Bilgisi', icon: '🎫' },
    { id: 'complaint', label: 'Şikayet & Öneri', icon: '📝' },
    { id: 'general', label: 'Genel Soru', icon: '❓' },
];

const FAQ = [
    { q: 'Rezervasyonumu nasıl iptal ederim?', a: 'Rezervasyon iptali için operatör ile iletişime geçin veya destek talebi oluşturun. İptal koşulları tur sözleşmesinde belirtilmiştir.' },
    { q: 'Ödeme yöntemleri nelerdir?', a: 'Kredi kartı, havale/EFT ve kapıda ödeme seçenekleri mevcuttur. Taksit seçenekleri için bankanızla iletişime geçin.' },
    { q: 'Vize işlemleri için ne gerekli?', a: 'Pasaport (min 6 ay geçerli), biyometrik fotoğraf ve başvuru formu gereklidir. Detaylar tur bilgisinde yer alır.' },
    { q: 'Fatura nasıl alırım?', a: 'Ödeme sonrası faturanız e-posta adresinize gönderilir. Kurumsal fatura için rezervasyon sırasında şirket bilgilerinizi girin.' },
    { q: 'Tur tarihlerinde değişiklik yapabilir miyim?', a: 'Tur başlangıcından en az 15 gün önce değişiklik talebi yapabilirsiniz. Operatörün onayı ve müsaitlik durumuna bağlıdır.' },
    { q: 'Uçuş bilgilerimi nereden görebilirim?', a: 'Uçuş bilgileriniz rezervasyon onayından sonra e-posta ile gönderilir ve hesabınızdan da görüntüleyebilirsiniz.' },
    { q: 'Sağlık şartları nelerdir?', a: 'Meningokok aşısı zorunludur. Kronik hastalığı olanların doktor raporu getirmesi önerilir.' },
    { q: 'Çocuklar için indirim var mı?', a: '2-12 yaş arası çocuklar için özel fiyatlandırma uygulanır. 2 yaş altı bebekler için ücret alınmaz (koltuk hariç).' },
];

export default function SupportPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !subject.trim() || description.trim().length < 20) {
            setError('Lütfen tüm alanları doldurun (açıklama en az 20 karakter)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await ticketsApi.createTicket({
                category: selectedCategory,
                subject: subject.trim(),
                description: description.trim(),
            });
            setSuccess(result.id);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Talep oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    // Success screen
    if (success) {
        return (
            <motion.div
                style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ marginBottom: '1rem' }}>Talebiniz Alındı!</h2>
                    <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        Ticket No: <strong>#{success}</strong>
                    </p>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                        Tahmini Yanıt: 24 saat içinde
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/support/tickets" className="btn btn-primary">
                            📋 Taleplerime Git
                        </Link>
                        <button onClick={() => { setSuccess(null); setShowForm(false); }} className="btn btn-outline">
                            Yeni Talep
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{ maxWidth: '800px', margin: '2rem auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>🎫 Destek Merkezi</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Size nasıl yardımcı olabiliriz?
                </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                <motion.div
                    className="card"
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setExpandedFaq(expandedFaq === -1 ? null : -1)}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
                    <div style={{ fontWeight: 600 }}>SSS</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sık Sorulanlar</div>
                </motion.div>

                <motion.div
                    className="card"
                    style={{ textAlign: 'center', cursor: 'pointer', background: 'var(--primary-teal)', color: 'white' }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => user ? setShowForm(true) : navigate('/login')}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                    <div style={{ fontWeight: 600 }}>Yeni Talep</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Ticket Oluştur</div>
                </motion.div>

                <Link to="/support/tickets" style={{ textDecoration: 'none' }}>
                    <motion.div
                        className="card"
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <div style={{ fontWeight: 600 }}>Taleplerim</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Geçmiş</div>
                    </motion.div>
                </Link>
            </div>

            {/* FAQ Accordion */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔍 Sık Sorulan Sorular</h3>
                {FAQ.map((item, index) => (
                    <div key={index} style={{ borderBottom: index < FAQ.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <button
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            style={{
                                width: '100%',
                                padding: '1rem 0',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '1rem',
                            }}
                        >
                            <span>{item.q}</span>
                            <span>{expandedFaq === index ? '▼' : '▶'}</span>
                        </button>
                        <AnimatePresence>
                            {expandedFaq === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden', paddingBottom: '1rem', color: 'var(--text-secondary)' }}
                                >
                                    {item.a}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Ticket Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <h3 style={{ marginBottom: '1.5rem' }}>💬 Destek Talebi Oluştur</h3>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Category Selection */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Kategori *</label>
                                <div className="grid grid-3" style={{ gap: '0.75rem' }}>
                                    {CATEGORIES.map((cat) => (
                                        <motion.button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`card ${selectedCategory === cat.id ? 'selected' : ''}`}
                                            style={{
                                                textAlign: 'center',
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                border: selectedCategory === cat.id ? '2px solid var(--primary-teal)' : '1px solid var(--border-color)',
                                                background: selectedCategory === cat.id ? 'rgba(13, 148, 136, 0.05)' : 'white',
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cat.icon}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{cat.label}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="subject">Konu *</label>
                                <input
                                    type="text"
                                    id="subject"
                                    className="form-input"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Kısa bir başlık yazın"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Açıklama * (min 20 karakter)</label>
                                <textarea
                                    id="description"
                                    className="form-input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Sorununuzu detaylı açıklayın..."
                                    rows={5}
                                    required
                                />
                                <div style={{ fontSize: '0.8rem', color: description.length >= 20 ? 'var(--primary-teal)' : 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {description.length}/1000 karakter {description.length < 20 && `(min ${20 - description.length} daha)`}
                                </div>
                            </div>

                            {/* Submit */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-outline"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={loading || !selectedCategory || !subject.trim() || description.length < 20}
                                >
                                    {loading ? '⏳ Gönderiliyor...' : '📤 Gönder'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA */}
            {!showForm && (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <p style={{ marginBottom: '1rem' }}>Sorunun cevabını bulamadın mı?</p>
                    <button
                        onClick={() => user ? setShowForm(true) : navigate('/login')}
                        className="btn btn-primary"
                    >
                        💬 Destek Talebi Oluştur
                    </button>
                </div>
            )}
        </motion.div>
    );
}
