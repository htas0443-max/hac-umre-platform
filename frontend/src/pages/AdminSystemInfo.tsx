import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../api';
import { useSEO } from '../hooks/useSEO';

export default function AdminSystemInfo() {
    useSEO({ title: 'Sistem Bilgisi — Admin', noIndex: true });

    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await adminApi.getSystemInfo();
                setInfo(res);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>;
    if (!info) return <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Bilgi alınamadı</div>;

    const tableRows = Object.entries(info.tables as Record<string, number>);

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">💾 Sistem Bilgisi</h1>
                <p className="admin-page-subtitle">Veritabanı istatistikleri ve ortam bilgileri</p>
            </div>

            {/* Environment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={cardStyle}>
                    <label style={labelStyle}>Supabase</label>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>{info.supabase_url}</div>
                </div>
                <div style={cardStyle}>
                    <label style={labelStyle}>Ortam</label>
                    <div style={{ fontSize: '16px', fontWeight: 600, textTransform: 'uppercase', color: info.environment === 'production' ? '#22c55e' : '#f97316' }}>
                        {info.environment}
                    </div>
                </div>
                <div style={cardStyle}>
                    <label style={labelStyle}>Sunucu Zamanı</label>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {new Date(info.server_time).toLocaleString('tr-TR')}
                    </div>
                </div>
            </div>

            {/* Table Counts */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>📊 Tablo Kayıt Sayıları</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {tableRows.map(([name, count]) => (
                        <div key={name} style={{
                            padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb',
                            background: count === -1 ? '#fef2f2' : '#f9fafb',
                        }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>
                                {name}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: count === -1 ? '#ef4444' : '#374151' }}>
                                {count === -1 ? 'N/A' : count.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Production Checklist */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px', border: '1px solid #bbf7d0', marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#166534', fontWeight: 600 }}>
                    🔔 Supabase Backup Bilgisi
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                    Supabase Pro plan otomatik günlük backup sağlar.
                    Dashboard → Settings → Database → Backups bölümünden kontrol edebilirsiniz.
                    Point-in-time recovery (PITR) ile son 7 güne kadar geri dönüş mümkündür.
                </p>
            </div>
        </motion.div>
    );
}

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' };
