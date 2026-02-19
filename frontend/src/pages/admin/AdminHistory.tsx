import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api';
import { useAuth } from '../../AuthContext';
import { useSEO } from '../../hooks/useSEO';

interface AuditRecord {
    id: string;
    user_id: string;
    role: string;
    action: string;
    entity: string;
    entity_id: string;
    details: Record<string, any>;
    previous_data: Record<string, any>;
    new_data: Record<string, any>;
    is_rollback: boolean;
    ip_address: string;
    created_at: string;
}

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
    user_suspended: '🚫 Kullanıcı Askıya Alındı',
    user_activated: '✅ Kullanıcı Aktifleştirildi',
    settings_updated: '⚙️ Ayarlar Güncellendi',
    feature_flag_updated: '🚩 Feature Flag Değiştirildi',
    tour_approved: '✅ Tur Onaylandı',
    tour_rejected: '❌ Tur Reddedildi',
    rollback_user_suspended: '↩️ Suspend Geri Alındı',
    rollback_user_activated: '↩️ Activate Geri Alındı',
    rollback_settings_updated: '↩️ Ayar Geri Alındı',
    rollback_feature_flag_updated: '↩️ Flag Geri Alındı',
};

const ROLLBACK_ELIGIBLE = [
    'user_suspended', 'user_activated',
    'settings_updated', 'feature_flag_updated'
];

export default function AdminHistory() {
    useSEO({ title: 'İşlem Geçmişi — Admin', noIndex: true });

    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Rollback state
    const [rollingBack, setRollingBack] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
            if (filterAction) params.action = filterAction;
            if (filterRole) params.role = filterRole;

            const result = await adminApi.getAuditHistory(params);
            setRecords(result.data || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error('Audit history fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [page, filterAction, filterRole]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const handleRollback = async (auditId: string) => {
        try {
            setRollingBack(auditId);
            await adminApi.rollbackAction(auditId);
            setConfirmId(null);
            fetchHistory();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Rollback başarısız';
            alert(msg);
        } finally {
            setRollingBack(null);
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const canRollback = (record: AuditRecord) =>
        isSuperAdmin &&
        ROLLBACK_ELIGIBLE.includes(record.action) &&
        !record.is_rollback &&
        Object.keys(record.previous_data || {}).length > 0;

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('tr-TR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return iso; }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="admin-page"
        >
            <div className="admin-page-header">
                <h1 className="admin-page-title">🕐 İşlem Geçmişi</h1>
                <p className="admin-page-subtitle">Tüm admin işlemleri ve rollback</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                    value={filterAction}
                    onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                    className="admin-select"
                    style={selectStyle}
                >
                    <option value="">Tüm İşlemler</option>
                    <option value="user_suspended">Kullanıcı Askıya Alındı</option>
                    <option value="user_activated">Kullanıcı Aktifleştirildi</option>
                    <option value="settings_updated">Ayarlar Güncellendi</option>
                    <option value="feature_flag_updated">Feature Flag Değiştirildi</option>
                    <option value="tour.approve">Tur Onaylandı</option>
                </select>

                <select
                    value={filterRole}
                    onChange={e => { setFilterRole(e.target.value); setPage(0); }}
                    className="admin-select"
                    style={selectStyle}
                >
                    <option value="">Tüm Roller</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                </select>

                <button
                    onClick={() => { setFilterAction(''); setFilterRole(''); setPage(0); }}
                    style={clearBtnStyle}
                >
                    Filtreleri Temizle
                </button>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Tarih</th>
                            <th style={thStyle}>İşlem</th>
                            <th style={thStyle}>Rol</th>
                            <th style={thStyle}>Hedef</th>
                            <th style={thStyle}>Detay</th>
                            {isSuperAdmin && <th style={thStyle}>Geri Al</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={isSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Kayıt bulunamadı</td></tr>
                        ) : (
                            records.map(record => (
                                <tr key={record.id} style={{
                                    borderBottom: '1px solid #eee',
                                    background: record.is_rollback ? 'rgba(255,200,200,0.1)' : 'transparent',
                                    opacity: record.is_rollback ? 0.6 : 1
                                }}>
                                    <td style={tdStyle}>{formatDate(record.created_at)}</td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '13px' }}>
                                            {ACTION_LABELS[record.action] || record.action}
                                        </span>
                                        {record.is_rollback && (
                                            <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fecaca', color: '#991b1b', padding: '2px 6px', borderRadius: '8px' }}>
                                                Geri Alındı
                                            </span>
                                        )}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                            background: record.role === 'super_admin' ? '#dbeafe' : '#e0e7ff',
                                            color: record.role === 'super_admin' ? '#1e40af' : '#3730a3',
                                        }}>
                                            {record.role}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            {record.entity}{record.entity_id ? ` #${record.entity_id.slice(0, 8)}` : ''}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        {record.details?.target_email && (
                                            <span style={{ fontSize: '12px' }}>{record.details.target_email}</span>
                                        )}
                                        {record.details?.flag_key && (
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{record.details.flag_key}</span>
                                        )}
                                        {record.details?.changed_keys && (
                                            <span style={{ fontSize: '12px' }}>{record.details.changed_keys.join(', ')}</span>
                                        )}
                                    </td>
                                    {isSuperAdmin && (
                                        <td style={tdStyle}>
                                            {canRollback(record) ? (
                                                confirmId === record.id ? (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => handleRollback(record.id)}
                                                            disabled={rollingBack === record.id}
                                                            style={{ ...rollbackBtnStyle, background: '#dc2626', color: '#fff' }}
                                                        >
                                                            {rollingBack === record.id ? '...' : 'Onayla'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmId(null)}
                                                            style={{ ...rollbackBtnStyle, background: '#e5e7eb', color: '#374151' }}
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmId(record.id)}
                                                        style={rollbackBtnStyle}
                                                    >
                                                        ↩️ Geri Al
                                                    </button>
                                                )
                                            ) : (
                                                <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={pageBtnStyle}
                    >
                        ← Önceki
                    </button>
                    <span style={{ padding: '8px 16px', color: '#666', fontSize: '14px' }}>
                        {page + 1} / {totalPages} ({total} kayıt)
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        style={pageBtnStyle}
                    >
                        Sonraki →
                    </button>
                </div>
            )}

            {/* Rollback Confirmation Modal */}
            <AnimatePresence>
                {confirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                        }}
                        onClick={() => setConfirmId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: '16px', padding: '32px',
                                maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                            }}
                        >
                            <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>⚠️ Geri Alma Onayı</h3>
                            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px' }}>
                                Bu işlemi geri almak istediğinize emin misiniz? Önceki duruma dönülecektir.
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setConfirmId(null)}
                                    style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => handleRollback(confirmId)}
                                    disabled={rollingBack === confirmId}
                                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {rollingBack === confirmId ? 'Geri alınıyor...' : 'Geri Al'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Inline styles
const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '12px 16px', fontSize: '12px',
    fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0',
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '14px', verticalAlign: 'middle',
};

const selectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '13px', background: '#fff', cursor: 'pointer', minWidth: '180px',
};

const clearBtnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
    background: '#f3f4f6', cursor: 'pointer', fontSize: '13px', color: '#374151',
};

const rollbackBtnStyle: React.CSSProperties = {
    padding: '4px 12px', borderRadius: '6px', border: '1px solid #fca5a5',
    background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500,
};

const pageBtnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db',
    background: '#fff', cursor: 'pointer', fontSize: '13px',
};
