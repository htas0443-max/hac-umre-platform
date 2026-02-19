import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';

interface AuditLog {
    id: number;
    user_id: string;
    role: string;
    action: string;
    entity: string;
    entity_id: string;
    details: Record<string, unknown>;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'tour.create': { label: 'Tur Oluşturma', color: '#22c55e' },
    'tour.update': { label: 'Tur Güncelleme', color: '#3b82f6' },
    'tour.delete': { label: 'Tur Silme', color: '#ef4444' },
    'tour.approve': { label: 'Tur Onayı', color: '#10b981' },
    'tour.reject': { label: 'Tur Reddi', color: '#f59e0b' },
    'csv.import': { label: 'CSV Import', color: '#8b5cf6' },
    'login.failed': { label: 'Başarısız Giriş', color: '#ef4444' },
    'login.success': { label: 'Başarılı Giriş', color: '#22c55e' },
};

const ROLE_LABELS: Record<string, string> = {
    admin: '🛡️ Admin',
    operator: '🏢 Ajanta',
    user: '👤 Kullanıcı',
};

export default function AdminAuditLog() {
    useSEO({ title: 'Audit Log — Admin', noIndex: true });

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const limit = 20;

    // Filters
    const [filterRole, setFilterRole] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                skip: page * limit,
                limit,
            };
            if (filterRole) params.role = filterRole;
            if (filterAction) params.action = filterAction;
            if (filterDateFrom) params.date_from = filterDateFrom;
            if (filterDateTo) params.date_to = filterDateTo;

            const data = await adminApi.getAuditLogs(params);
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, filterRole, filterAction, filterDateFrom, filterDateTo]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getActionBadge = (action: string) => {
        const info = ACTION_LABELS[action] || { label: action, color: '#6b7280' };
        return (
            <span
                style={{
                    background: `${info.color}20`,
                    color: info.color,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                }}
            >
                {info.label}
            </span>
        );
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '1.5rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={28} style={{ color: 'var(--primary)' }} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Audit Log</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                            Toplam {total} kayıt
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadLogs}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', borderRadius: '8px',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        cursor: 'pointer', fontSize: '0.85rem',
                    }}
                >
                    <RefreshCw size={16} /> Yenile
                </button>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: '0.75rem', marginBottom: '1rem',
                flexWrap: 'wrap', alignItems: 'flex-end',
            }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Rol</label>
                    <select
                        value={filterRole}
                        onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)' }}
                    >
                        <option value="">Tümü</option>
                        <option value="admin">Admin</option>
                        <option value="operator">Ajanta</option>
                        <option value="user">Kullanıcı</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>İşlem</label>
                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)' }}
                    >
                        <option value="">Tümü</option>
                        {Object.entries(ACTION_LABELS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Başlangıç</label>
                    <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bitiş</label>
                    <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--surface)' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Tarih</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Rol</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>İşlem</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Kayıt</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>IP</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>User ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıt bulunamadı</td></tr>
                        ) : logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                                <td style={{ padding: '0.6rem 0.75rem' }}>{ROLE_LABELS[log.role] || log.role}</td>
                                <td style={{ padding: '0.6rem 0.75rem' }}>{getActionBadge(log.action)}</td>
                                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {log.entity && `${log.entity}#${log.entity_id}`}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip_address}</td>
                                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {log.user_id?.slice(0, 8)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
