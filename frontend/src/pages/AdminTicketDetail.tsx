import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, User, Calendar, MessageCircle, Mail, Shield, Clock, Send } from 'lucide-react';
import { ticketsApi } from '../api';
import { useSEO } from '../hooks/useSEO';
import type { Ticket, TicketMessage } from '../types';
import Breadcrumb from '../components/Breadcrumb';

const CATEGORY_LABELS: Record<string, string> = {
    payment: '💳 Ödeme & Fatura',
    reservation: '📅 Rezervasyon',
    technical: '🔧 Teknik Sorun',
    tour: '🎫 Tur Bilgisi',
    complaint: '📝 Şikayet & Öneri',
    general: '❓ Genel Soru',
};

const STATUS_OPTIONS = [
    { value: 'open', label: 'Açık', color: '#10B981' },
    { value: 'pending', label: 'Bekliyor', color: '#F59E0B' },
    { value: 'resolved', label: 'Çözüldü', color: '#6B7280' },
];

export default function AdminTicketDetail() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // SEO: noindex - admin ticket detay indexlenmemeli
    useSEO({ title: `Ticket #${id || ''}`, noIndex: true });

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

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !id) return;

        setSending(true);
        try {
            await ticketsApi.adminReply(Number(id), replyText.trim());
            setReplyText('');
            loadTicket();
        } catch (err: any) {
            setError('Yanıt gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!id) return;
        setUpdatingStatus(true);
        try {
            await ticketsApi.updateStatus(Number(id), newStatus);
            setTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
        } catch (err: any) {
            setError('Durum güncellenemedi');
        } finally {
            setUpdatingStatus(false);
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
            <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
                <div className="card skeleton-card" style={{
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    height: '400px'
                }} />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div style={{ maxWidth: '900px', margin: '2rem auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ marginBottom: '1rem' }}><XCircle size={48} color="#EF4444" /></div>
                    <p>{error || 'Talep bulunamadı'}</p>
                    <Link to="/admin/tickets" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        ← Taleplere Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            style={{ maxWidth: '900px', margin: '2rem auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Breadcrumb />

            {/* Header with Actions */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ticket #{ticket.id}</span>
                        <h2 style={{ margin: '0.25rem 0' }}>{ticket.subject}</h2>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {ticket.user_email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><User size={14} /> {ticket.user_email} • </span>}
                            {CATEGORY_LABELS[ticket.category] || ticket.category} •
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {formatDate(ticket.created_at)}</span>
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Durum:</span>
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updatingStatus}
                            className="form-input"
                            style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem' }}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Original Message */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Orijinal Talep:
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageCircle size={18} /> Mesajlar ({messages.length})</h3>

                {messages.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        Henüz mesaj yok.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    background: msg.is_admin ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-secondary)',
                                    borderLeft: msg.is_admin ? '3px solid var(--primary-teal)' : '3px solid var(--accent-gold)',
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600 }}>
                                        {msg.is_admin ? <><Shield size={14} style={{ marginRight: '0.25rem' }} /> Destek Ekibi</> : <><User size={14} style={{ marginRight: '0.25rem' }} /> {msg.sender_email || 'Kullanıcı'}</>}
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
            <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={18} /> Yanıt Yaz</h3>

                {/* Template Buttons */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        📋 Hızlı Şablonlar:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            onClick={() => setReplyText(
                                'Platformumuz, tur firmaları ile kullanıcıları buluşturan bir ilan platformudur.\n\n' +
                                'Rezervasyon, ödeme, iptal, vize, uçuş, sağlık şartları ve fatura işlemleri platform tarafından değil, ilgili tur firması tarafından yürütülmektedir.\n\n' +
                                'Detaylı ve güncel bilgi için lütfen ilan sayfasındaki firma ile doğrudan iletişime geçiniz.'
                            )}
                        >
                            🏢 Platform Rolü
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            onClick={() => setReplyText(
                                'Platformumuz, tur firmaları ile kullanıcıları buluşturan bir ilan platformudur.\n\n' +
                                'Rezervasyon, ödeme, iptal, vize, uçuş, sağlık şartları ve fatura işlemleri platform tarafından değil, ilgili tur firması tarafından yürütülmektedir.\n\n' +
                                'Detaylı ve güncel bilgi için lütfen ilan sayfasındaki firma ile doğrudan iletişime geçiniz.\n\n' +
                                'Firmaların doğrulama süreci hakkında bilgi almak için Güven ve Doğrulama sayfamızı inceleyebilirsiniz.'
                            )}
                        >
                            🛡️ Platform + Güven
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            onClick={() => setReplyText(prev =>
                                prev + (prev ? '\n\n' : '') +
                                'Firmaların doğrulama süreci hakkında bilgi almak için Güven ve Doğrulama sayfamızı inceleyebilirsiniz.'
                            )}
                        >
                            ➕ Güven Linki Ekle
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: '#EF4444', borderColor: '#EF4444' }}
                            onClick={() => setReplyText('')}
                        >
                            🗑️ Temizle
                        </button>
                    </div>
                </div>

                <form onSubmit={handleReply}>
                    <textarea
                        className="form-input"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Yanıtınızı yazın..."
                        rows={6}
                        required
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <Link to="/admin/tickets" className="btn btn-outline">
                            ← Listeye Dön
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending || !replyText.trim()}
                        >
                            {sending ? <><Clock size={14} style={{ marginRight: '0.25rem' }} /> Gönderiliyor...</> : <><Send size={14} style={{ marginRight: '0.25rem' }} /> Yanıt Gönder</>}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
