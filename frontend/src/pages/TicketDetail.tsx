import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ticketsApi } from '../api';
import type { Ticket, TicketMessage } from '../types';
import StatusBadge from '../components/StatusBadge';
import Breadcrumb from '../components/Breadcrumb';

const CATEGORY_LABELS: Record<string, string> = {
    payment: '💳 Ödeme & Fatura',
    reservation: '📅 Rezervasyon',
    technical: '🔧 Teknik Sorun',
    tour: '🎫 Tur Bilgisi',
    complaint: '📝 Şikayet & Öneri',
    general: '❓ Genel Soru',
};

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) loadTicket();
    }, [id]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            const data = await ticketsApi.getById(Number(id));
            setTicket(data.ticket);
            setMessages(data.messages || []);
        } catch (err: any) {
            setError('Talep yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !id) return;

        setSending(true);
        try {
            await ticketsApi.addMessage(Number(id), newMessage.trim());
            setNewMessage('');
            loadTicket(); // Reload to get new message
        } catch (err: any) {
            setError('Mesaj gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <div className="card skeleton-card" style={{
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    height: '300px'
                }} />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <p>{error || 'Talep bulunamadı'}</p>
                    <Link to="/support/tickets" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        ← Taleplerime Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            style={{ maxWidth: '800px', margin: '2rem auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Breadcrumb />

            {/* Ticket Header */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ticket #{ticket.id}</span>
                        <h2 style={{ margin: '0.25rem 0' }}>{ticket.subject}</h2>
                    </div>
                    <StatusBadge status={ticket.status} />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                    <span>📅 {formatDate(ticket.created_at)}</span>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>💬 Mesajlar</h3>

                {messages.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        Henüz yanıt yok. En kısa sürede dönüş yapacağız.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    background: msg.is_admin ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-secondary)',
                                    borderLeft: msg.is_admin ? '3px solid var(--primary-teal)' : '3px solid var(--accent-gold)',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600 }}>
                                        {msg.is_admin ? '🛡️ Destek Ekibi' : '👤 Siz'}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{formatDate(msg.created_at)}</span>
                                </div>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reply Form */}
            {ticket.status !== 'resolved' && (
                <div className="card">
                    <form onSubmit={handleSendMessage}>
                        <label className="form-label">Yanıt Yaz</label>
                        <textarea
                            className="form-input"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                            rows={3}
                            required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={sending || !newMessage.trim()}
                            >
                                {sending ? '⏳ Gönderiliyor...' : '📤 Gönder'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {ticket.status === 'resolved' && (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                    <p>✅ Bu talep çözüldü olarak işaretlendi.</p>
                    <Link to="/support" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                        Yeni Talep Oluştur
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
