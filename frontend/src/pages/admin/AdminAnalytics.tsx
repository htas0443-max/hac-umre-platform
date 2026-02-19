import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Building2, Award } from 'lucide-react';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';

interface AgencyStats {
    agency_id: string;
    agency_name: string;
    total_tours: number;
    approved_tours: number;
    pending_tours: number;
    rejected_tours: number;
    last_activity: string;
}

export default function AdminAnalytics() {
    useSEO({ title: 'Ajanta Analytics — Admin', noIndex: true });

    const [agencies, setAgencies] = useState<AgencyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await adminApi.getAgencyAnalytics();
                setAgencies(data.agencies || []);
            } catch {
                setAgencies([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const maxTours = Math.max(...agencies.map(a => a.total_tours), 1);
    const maxApproved = Math.max(...agencies.map(a => a.approved_tours), 1);

    const formatDate = (d: string) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Yükleniyor...
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '1.5rem' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <BarChart3 size={28} style={{ color: 'var(--primary)' }} />
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Ajanta Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                        {agencies.length} ajanta kayıtlı
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Building2 size={18} style={{ color: '#3b82f6' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toplam Ajanta</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{agencies.length}</div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={18} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toplam Tur</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{agencies.reduce((s, a) => s + a.total_tours, 0)}</div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Award size={18} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Onaylı Tur</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{agencies.reduce((s, a) => s + a.approved_tours, 0)}</div>
                </div>
            </div>

            {/* Bar Chart: Total Tours per Agency */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Ajanta Bazlı Toplam Tur</h2>
                {agencies.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Veri bulunamadı</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {agencies
                            .sort((a, b) => b.total_tours - a.total_tours)
                            .map((agency, i) => (
                                <motion.div
                                    key={agency.agency_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                >
                                    <div style={{ width: '140px', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {agency.agency_name || 'İsimsiz'}
                                    </div>
                                    <div style={{ flex: 1, height: '28px', background: 'var(--bg)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(agency.total_tours / maxTours) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                            style={{
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                                borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                paddingRight: '8px',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>
                                                {agency.total_tours}
                                            </span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Bar Chart: Approved Tours */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Onaylı Tur Dağılımı</h2>
                {agencies.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Veri bulunamadı</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {agencies
                            .sort((a, b) => b.approved_tours - a.approved_tours)
                            .map((agency, i) => (
                                <motion.div
                                    key={agency.agency_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                >
                                    <div style={{ width: '140px', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {agency.agency_name || 'İsimsiz'}
                                    </div>
                                    <div style={{ flex: 1, height: '28px', background: 'var(--bg)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(agency.approved_tours / maxApproved) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                            style={{
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                                                borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                paddingRight: '8px',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>
                                                {agency.approved_tours}
                                            </span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Detail Table: Most Active Agencies */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>En Aktif Ajantalar</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '0.6rem', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '0.6rem', textAlign: 'left' }}>Ajanta</th>
                                <th style={{ padding: '0.6rem', textAlign: 'center' }}>Toplam</th>
                                <th style={{ padding: '0.6rem', textAlign: 'center' }}>Onaylı</th>
                                <th style={{ padding: '0.6rem', textAlign: 'center' }}>Bekleyen</th>
                                <th style={{ padding: '0.6rem', textAlign: 'center' }}>Reddedilen</th>
                                <th style={{ padding: '0.6rem', textAlign: 'left' }}>Son Aktivite</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agencies
                                .sort((a, b) => b.total_tours - a.total_tours)
                                .map((agency, i) => (
                                    <tr key={agency.agency_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </td>
                                        <td style={{ padding: '0.6rem', fontWeight: 500 }}>{agency.agency_name || 'İsimsiz'}</td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{agency.total_tours}</td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center', color: '#22c55e' }}>{agency.approved_tours}</td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center', color: '#f59e0b' }}>{agency.pending_tours}</td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center', color: '#ef4444' }}>{agency.rejected_tours}</td>
                                        <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(agency.last_activity)}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
