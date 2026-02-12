import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../api';
import { useSEO } from '../hooks/useSEO';

export default function AdminOperatorPerformance() {
    useSEO({ title: 'Operatör Performans — Admin', noIndex: true });

    const [operators, setOperators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await adminApi.getOperatorPerformance();
                setOperators(res.operators || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const rateColor = (r: number) => r >= 80 ? '#22c55e' : r >= 50 ? '#eab308' : '#ef4444';

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">📊 Operatör Performansı</h1>
                <p className="admin-page-subtitle">Tur onay oranı, puan ve istatistikler</p>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Toplam Operatör</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{operators.length}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ort. Onay Oranı</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
                        {operators.length ? Math.round(operators.reduce((a, b) => a + b.approval_rate, 0) / operators.length) : 0}%
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Toplam Tur</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>
                        {operators.reduce((a, b) => a + b.total_tours, 0)}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Operatör</th>
                        <th style={thStyle}>Firma</th>
                        <th style={thStyle}>Toplam Tur</th>
                        <th style={thStyle}>Onaylanan</th>
                        <th style={thStyle}>Reddedilen</th>
                        <th style={thStyle}>Onay Oranı</th>
                        <th style={thStyle}>Puan</th>
                    </tr></thead>
                    <tbody>
                        {operators.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Operatör bulunamadı</td></tr>
                        ) : operators.map((op, i) => (
                            <tr key={op.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ ...tdStyle, fontWeight: 700, color: '#9ca3af' }}>{i + 1}</td>
                                <td style={{ ...tdStyle, fontSize: '12px' }}>{op.email}</td>
                                <td style={tdStyle}>{op.company_name || '—'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{op.total_tours}</td>
                                <td style={{ ...tdStyle, textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{op.approved_tours}</td>
                                <td style={{ ...tdStyle, textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{op.rejected_tours}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{
                                        fontWeight: 700, fontSize: '14px', color: rateColor(op.approval_rate),
                                        padding: '2px 8px', borderRadius: '6px',
                                        background: op.approval_rate >= 80 ? '#dcfce7' : op.approval_rate >= 50 ? '#fef9c3' : '#fee2e2',
                                    }}>
                                        {op.approval_rate}%
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    {op.avg_rating > 0 ? (
                                        <span style={{ fontWeight: 600 }}>⭐ {op.avg_rating}</span>
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
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

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' };
