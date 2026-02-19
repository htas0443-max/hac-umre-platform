import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';

export default function AdminEmailQueue() {
    useSEO({ title: 'Email Kuyruk — Admin', noIndex: true });

    const [emails, setEmails] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const params: any = { page: 0 };
            if (statusFilter) params.status = statusFilter;
            const res = await adminApi.getEmailQueue(params);
            setEmails(res.data || []);
            setStats(res.stats || {});
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchQueue(); }, [statusFilter]);

    const handleRetry = async (id: string) => {
        try {
            await adminApi.retryEmail(id);
            fetchQueue();
        } catch (err: any) { alert(err?.response?.data?.detail || 'Hata'); }
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    };

    const statusBadge = (s: string) => {
        const map: Record<string, { bg: string; color: string; label: string }> = {
            pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Bekliyor' },
            sent: { bg: '#dcfce7', color: '#166534', label: '✅ Gönderildi' },
            failed: { bg: '#fee2e2', color: '#991b1b', label: '❌ Başarısız' },
            retry: { bg: '#dbeafe', color: '#1e40af', label: '🔄 Yeniden' },
        };
        const m = map[s] || { bg: '#f3f4f6', color: '#374151', label: s };
        return <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: m.bg, color: m.color }}>{m.label}</span>;
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">📧 Email Kuyruk</h1>
                <p className="admin-page-subtitle">Email gönderim durumu ve yeniden deneme</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {Object.entries(stats).map(([key, val]) => (
                    <div key={key} style={{ padding: '10px 16px', borderRadius: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700 }}>{val as number}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{key}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ marginBottom: '16px' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                    <option value="">Tüm Durumlar</option>
                    <option value="pending">Bekleyen</option>
                    <option value="sent">Gönderilen</option>
                    <option value="failed">Başarısız</option>
                    <option value="retry">Yeniden Denenecek</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                        <th style={thStyle}>Tarih</th><th style={thStyle}>Alıcı</th><th style={thStyle}>Konu</th><th style={thStyle}>Durum</th><th style={thStyle}>Deneme</th><th style={thStyle}>İşlem</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Yükleniyor...</td></tr> :
                            emails.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Kayıt yok</td></tr> :
                                emails.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={tdStyle}>{formatDate(e.created_at)}</td>
                                        <td style={{ ...tdStyle, fontSize: '12px' }}>{e.to_email}</td>
                                        <td style={{ ...tdStyle, fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject}</td>
                                        <td style={tdStyle}>{statusBadge(e.status)}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{e.attempts}/{e.max_attempts}</td>
                                        <td style={tdStyle}>
                                            {e.status === 'failed' && (
                                                <button onClick={() => handleRetry(e.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: '11px' }}>
                                                    🔄 Yeniden Dene
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' };
