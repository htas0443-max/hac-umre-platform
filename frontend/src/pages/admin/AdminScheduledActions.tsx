import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import { toast } from 'sonner';

export default function AdminScheduledActions() {
    useSEO({ title: 'Zamanlanmış Aksiyonlar — Admin', noIndex: true });

    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ action_type: 'activate_user', entity: 'user', entity_id: '', scheduled_at: '' });

    const fetchActions = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getScheduledActions(statusFilter);
            setActions(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchActions(); }, [statusFilter]);

    const handleCreate = async () => {
        try {
            await adminApi.createScheduledAction({
                ...form,
                payload: {},
                scheduled_at: new Date(form.scheduled_at).toISOString(),
            });
            toast.success('Zamanlanmış aksiyon oluşturuldu');
            setShowCreate(false);
            setForm({ action_type: 'activate_user', entity: 'user', entity_id: '', scheduled_at: '' });
            fetchActions();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Hata');
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Bu aksiyonu iptal etmek istediğinize emin misiniz?')) return;
        try {
            await adminApi.cancelScheduledAction(id);
            toast.success('Aksiyon iptal edildi');
            fetchActions();
        } catch (err: any) { toast.error('İptal edilemedi'); }
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    };

    const statusBadge = (s: string) => {
        const map: Record<string, { bg: string; color: string; icon: string }> = {
            pending: { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
            executed: { bg: '#dcfce7', color: '#166534', icon: '✅' },
            cancelled: { bg: '#f3f4f6', color: '#374151', icon: '🚫' },
            failed: { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
        };
        const m = map[s] || { bg: '#f3f4f6', color: '#374151', icon: '❓' };
        return <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: m.bg, color: m.color }}>{m.icon} {s}</span>;
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-page">
            <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-page-title">🗓️ Zamanlanmış Aksiyonlar</h1>
                    <p className="admin-page-subtitle">Gelecekte çalışacak otomatik işlemler</p>
                </div>
                <button onClick={() => setShowCreate(true)} style={{ padding: '10px 18px', borderRadius: '10px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    + Yeni Aksiyon
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '95vw' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Yeni Zamanlanmış Aksiyon</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <select value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })} style={inputStyle}>
                                <option value="activate_user">Kullanıcıyı Aktifleştir</option>
                                <option value="suspend_user">Kullanıcıyı Askıya Al</option>
                                <option value="send_notification">Bildirim Gönder</option>
                            </select>
                            <input placeholder="Entity ID (kullanıcı/tur ID)" value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })} style={inputStyle} />
                            <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} style={inputStyle} />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>İptal</button>
                                <button onClick={handleCreate} disabled={!form.entity_id || !form.scheduled_at} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: !form.entity_id || !form.scheduled_at ? 0.5 : 1 }}>Oluştur</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Filter */}
            <div style={{ marginBottom: '16px' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                    <option value="pending">Bekleyen</option>
                    <option value="executed">Tamamlanan</option>
                    <option value="cancelled">İptal Edilen</option>
                    <option value="failed">Başarısız</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                        <th style={thStyle}>Planlanan</th><th style={thStyle}>Tür</th><th style={thStyle}>Entity</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Yükleniyor...</td></tr> :
                            actions.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Kayıt yok</td></tr> :
                                actions.map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={tdStyle}>{formatDate(a.scheduled_at)}</td>
                                        <td style={{ ...tdStyle, fontWeight: 500 }}>{a.action_type}</td>
                                        <td style={{ ...tdStyle, fontSize: '12px', fontFamily: 'monospace' }}>{a.entity}: {a.entity_id || '—'}</td>
                                        <td style={tdStyle}>{statusBadge(a.status)}</td>
                                        <td style={tdStyle}>
                                            {a.status === 'pending' && (
                                                <button onClick={() => handleCancel(a.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}>
                                                    İptal Et
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

const inputStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' };
