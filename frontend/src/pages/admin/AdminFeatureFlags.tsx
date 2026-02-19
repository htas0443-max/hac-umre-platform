import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api';
import { invalidateFeatureFlags } from '../../hooks/useFeature';
import { useSEO } from '../../hooks/useSEO';

interface FeatureFlag {
    id: string;
    key: string;
    enabled: boolean;
    description: string;
    updated_by: string | null;
    updated_at: string;
}

export default function AdminFeatureFlags() {
    useSEO({ title: 'Feature Flags — Admin', noIndex: true });

    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const fetchFlags = async () => {
        try {
            setLoading(true);
            const result = await adminApi.getFeatureFlags();
            setFlags(result.flags || []);
        } catch (err) {
            console.error('Feature flags fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFlags(); }, []);

    const handleToggle = async (key: string) => {
        try {
            setToggling(key);
            const result = await adminApi.toggleFeatureFlag(key);
            setFlags(prev =>
                prev.map(f => f.key === key ? { ...f, enabled: result.enabled } : f)
            );
            // Cache invalidate — useFeature hook sonraki çağrıda yeni veri alır
            invalidateFeatureFlags();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Flag güncellenemedi';
            alert(msg);
        } finally {
            setToggling(null);
        }
    };

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
                <h1 className="admin-page-title">🚩 Feature Flags</h1>
                <p className="admin-page-subtitle">Platform özelliklerini anlık olarak aç/kapat</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Yükleniyor...</div>
            ) : flags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Henüz feature flag tanımlanmamış.</div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {flags.map(flag => (
                        <motion.div
                            key={flag.key}
                            layout
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '20px 24px', borderRadius: '12px', border: '1px solid #e5e7eb',
                                background: '#fff', transition: 'box-shadow 0.2s',
                                boxShadow: flag.enabled ? '0 0 0 2px rgba(34,197,94,0.2)' : 'none',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{
                                        fontFamily: 'monospace', fontWeight: 600, fontSize: '15px',
                                        color: flag.enabled ? '#166534' : '#991b1b',
                                    }}>
                                        {flag.key}
                                    </span>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                                        background: flag.enabled ? '#dcfce7' : '#fee2e2',
                                        color: flag.enabled ? '#166534' : '#991b1b',
                                    }}>
                                        {flag.enabled ? 'AKTİF' : 'KAPALI'}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                                    {flag.description || 'Açıklama yok'}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                                    Son güncelleme: {formatDate(flag.updated_at)}
                                </p>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={() => handleToggle(flag.key)}
                                disabled={toggling === flag.key}
                                style={{
                                    width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                                    background: flag.enabled ? '#22c55e' : '#d1d5db',
                                    cursor: toggling === flag.key ? 'wait' : 'pointer',
                                    position: 'relative', transition: 'background 0.3s',
                                    opacity: toggling === flag.key ? 0.6 : 1,
                                    flexShrink: 0,
                                }}
                                title={flag.enabled ? 'Devre dışı bırak' : 'Aktifleştir'}
                            >
                                <motion.div
                                    animate={{ x: flag.enabled ? 24 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{
                                        width: '22px', height: '22px', borderRadius: '50%',
                                        background: '#fff', position: 'absolute', top: '3px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }}
                                />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
