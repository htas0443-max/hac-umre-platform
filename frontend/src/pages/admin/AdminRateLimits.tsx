import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';

export default function AdminRateLimits() {
    useSEO({ title: 'Rate Limiting — Admin', noIndex: true });

    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [blockedOnly, setBlockedOnly] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [statsRes, logsRes] = await Promise.all([
                    adminApi.getRateLimitStats(),
                    adminApi.getRateLimitLogs({ page: 0, blocked_only: blockedOnly }),
                ]);
                setStats(statsRes);
                setLogs(logsRes.data || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, [blockedOnly]);

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">🔒 Rate Limiting Dashboard</h1>
                <p className="admin-page-subtitle">Son 24 saat istek ve engelleme istatistikleri</p>
            </div>

            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'Toplam İstek', value: stats.total_requests_24h, color: '#3b82f6' },
                        { label: 'Engellenen', value: stats.blocked_24h, color: '#ef4444' },
                        { label: 'Benzersiz IP', value: stats.unique_blocked_ips, color: '#f97316' },
                        { label: 'Engel Oranı', value: `${stats.block_rate}%`, color: stats.block_rate > 5 ? '#ef4444' : '#22c55e' },
                    ].map(c => (
                        <div key={c.label} style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{c.label}</p>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: c.color }}>{c.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Offenders */}
            {stats?.top_offenders?.length > 0 && (
                <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '16px 20px', border: '1px solid #fca5a5', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#991b1b', fontWeight: 600 }}>🚨 En Çok Engellenen IP'ler</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {stats.top_offenders.map((o: any) => (
                            <span key={o.ip} style={{ padding: '4px 10px', borderRadius: '8px', background: '#fee2e2', fontSize: '12px', fontFamily: 'monospace', color: '#991b1b' }}>
                                {o.ip} ({o.count}x)
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Logs */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>📋 Son Loglar</h3>
                    <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={blockedOnly} onChange={e => setBlockedOnly(e.target.checked)} />
                        Sadece engellenen
                    </label>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                            <th style={thStyle}>Zaman</th><th style={thStyle}>IP</th><th style={thStyle}>Endpoint</th><th style={thStyle}>Durum</th><th style={thStyle}>Neden</th>
                        </tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Yükleniyor...</td></tr> :
                                logs.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Kayıt yok</td></tr> :
                                    logs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6', background: log.blocked ? 'rgba(254,226,226,0.3)' : 'transparent' }}>
                                            <td style={tdStyle}>{formatDate(log.created_at)}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{log.ip_address}</td>
                                            <td style={{ ...tdStyle, fontSize: '12px' }}>{log.endpoint || '—'}</td>
                                            <td style={tdStyle}>{log.blocked ? <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ ENGELLENDİ</span> : <span style={{ color: '#22c55e' }}>✅</span>}</td>
                                            <td style={{ ...tdStyle, fontSize: '12px', color: '#888' }}>{log.reason || '—'}</td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' };
