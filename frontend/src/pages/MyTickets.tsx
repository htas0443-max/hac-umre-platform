import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Inbox, MessageCircle } from 'lucide-react';
import { ticketsApi } from '../api';
import type { Ticket } from '../types';
import StatusBadge from '../components/StatusBadge';

const STATUS_TABS = [
    { value: '', label: 'Tümü' },
    { value: 'open', label: 'Açık' },
    { value: 'pending', label: 'Bekliyor' },
    { value: 'resolved', label: 'Çözüldü' },
];

const CATEGORY_LABELS: Record<string, string> = {
    payment: '💳 Ödeme',
    reservation: '📅 Rezervasyon',
    technical: '🔧 Teknik',
    tour: '🎫 Tur',
    complaint: '📝 Şikayet',
    general: '❓ Genel',
};

export default function MyTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        loadTickets();
    }, [activeTab]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketsApi.getMyTickets(activeTab || undefined);
            setTickets(data.tickets || []);
        } catch (err: any) {
            setError('Talepler yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Az önce';
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={24} color="var(--primary-teal)" /> Destek Taleplerim</h1>
                <div className="grid grid-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card skeleton-card" style={{
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            height: '120px'
                        }} />
                    ))}
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={24} color="var(--primary-teal)" /> Destek Taleplerim</h1>
                <Link to="/support" className="btn btn-primary btn-small">
                    + Yeni Talep
                </Link>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`btn btn-small ${activeTab === tab.value ? 'btn-primary' : 'btn-outline'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
            )}

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <motion.div
                    className="card"
                    style={{ textAlign: 'center', padding: '3rem' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div style={{ marginBottom: '1rem' }}><Inbox size={48} color="var(--text-muted)" /></div>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Henüz destek talebiniz yok.
                    </p>
                    <Link to="/support" className="btn btn-primary">
                        <MessageCircle size={16} style={{ marginRight: '0.5rem' }} /> Yeni Talep Oluştur
                    </Link>
                </motion.div>
            ) : (
                <motion.div
                    className="grid"
                    style={{ gap: '1rem' }}
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                    {tickets.map((ticket) => (
                        <motion.div
                            key={ticket.id}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                            }}
                        >
                            <Link to={`/support/tickets/${ticket.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <motion.div
                                    className="card"
                                    style={{ cursor: 'pointer' }}
                                    whileHover={{ scale: 1.01, y: -2 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>#{ticket.id}</span>
                                            <h3 style={{ margin: '0.25rem 0' }}>{ticket.subject}</h3>
                                        </div>
                                        <StatusBadge status={ticket.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                                        <span>•</span>
                                        <span>{formatDate(ticket.created_at)}</span>
                                    </div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
