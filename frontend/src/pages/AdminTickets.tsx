import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Inbox } from 'lucide-react';
import { ticketsApi } from '../api';
import { useSEO } from '../hooks/useSEO';
import type { Ticket as TicketType } from '../types';
import StatusBadge from '../components/StatusBadge';
import Breadcrumb from '../components/Breadcrumb';

const STATUS_TABS = [
    { value: '', label: 'Tümü', icon: '📋' },
    { value: 'open', label: 'Açık', icon: '🟢' },
    { value: 'pending', label: 'Bekliyor', icon: '🟡' },
    { value: 'resolved', label: 'Çözüldü', icon: '⚫' },
];

const CATEGORY_LABELS: Record<string, string> = {
    payment: '💳 Ödeme',
    reservation: '📅 Rezervasyon',
    technical: '🔧 Teknik',
    tour: '🎫 Tur',
    complaint: '📝 Şikayet',
    general: '❓ Genel',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: '#6B7280',
    normal: '#3B82F6',
    high: '#F97316',
    urgent: '#EF4444',
};

export default function AdminTickets() {
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ open: 0, pending: 0, resolved: 0, total: 0 });

    // SEO: noindex - admin ticket listesi indexlenmemeli
    useSEO({ title: 'Destek Talepleri', noIndex: true });

    useEffect(() => {
        loadTickets();
    }, [activeTab]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketsApi.getAllTickets({ status: activeTab || undefined });
            const ticketsList = data.tickets || [];
            setTickets(ticketsList);

            // Calculate stats
            const open = ticketsList.filter((t: TicketType) => t.status === 'open').length;
            const pending = ticketsList.filter((t: TicketType) => t.status === 'pending').length;
            const resolved = ticketsList.filter((t: TicketType) => t.status === 'resolved').length;
            setStats({ open, pending, resolved, total: ticketsList.length });
        } catch (err: any) {
            setError('Talepler yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t =>
        !searchQuery ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toString().includes(searchQuery)
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Az önce';
        if (diffHours < 24) return `${diffHours}sa önce`;
        if (diffDays < 7) return `${diffDays}g önce`;
        return date.toLocaleDateString('tr-TR');
    };

    if (loading && tickets.length === 0) {
        return (
            <div style={{ margin: '2rem auto', maxWidth: '1200px' }}>
                <Breadcrumb />
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ticket size={24} color="var(--primary-teal)" /> Destek Talepleri</h1>
                <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card skeleton-card" style={{
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            height: '100px'
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            style={{ margin: '2rem auto', maxWidth: '1200px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Breadcrumb />

            <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ticket size={24} color="var(--primary-teal)" /> Destek Talepleri</h1>

            {/* Stats Cards */}
            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Açık', value: stats.open, color: '#10B981', icon: '🟢' },
                    { label: 'Bekliyor', value: stats.pending, color: '#F59E0B', icon: '🟡' },
                    { label: 'Çözüldü', value: stats.resolved, color: '#6B7280', icon: '⚫' },
                    { label: 'Toplam', value: stats.total, color: '#3B82F6', icon: '📊' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        className="card"
                        style={{ textAlign: 'center' }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Ticket no veya konu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ margin: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`btn btn-small ${activeTab === tab.value ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
            )}

            {/* Tickets Table */}
            {filteredTickets.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ marginBottom: '1rem' }}><Inbox size={48} color="var(--text-muted)" /></div>
                    <p>Talep bulunamadı.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>ID</th>
                                <th style={{ padding: '1rem' }}>Konu</th>
                                <th style={{ padding: '1rem' }}>Kategori</th>
                                <th style={{ padding: '1rem' }}>Durum</th>
                                <th style={{ padding: '1rem' }}>Öncelik</th>
                                <th style={{ padding: '1rem' }}>Tarih</th>
                                <th style={{ padding: '1rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr
                                    key={ticket.id}
                                    style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        background: ticket.priority === 'urgent' ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>#{ticket.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{ticket.subject}</div>
                                        {ticket.user_email && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.user_email}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{CATEGORY_LABELS[ticket.category] || ticket.category}</td>
                                    <td style={{ padding: '1rem' }}><StatusBadge status={ticket.status} /></td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: 'white',
                                            background: PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.normal
                                        }}>
                                            {ticket.priority.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {formatDate(ticket.created_at)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link to={`/admin/tickets/${ticket.id}`} className="btn btn-small btn-outline">
                                            İncele →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
}
