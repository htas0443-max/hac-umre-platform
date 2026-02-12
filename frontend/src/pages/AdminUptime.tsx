import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../api';
import { useSEO } from '../hooks/useSEO';

interface UptimeStats {
    uptime_24h: number;
    uptime_7d: number;
    uptime_30d: number;
    avg_response_24h: number;
    avg_response_7d: number;
    total_checks_24h: number;
    total_checks_7d: number;
    total_checks_30d: number;
    consecutive_failures: number;
}

interface UptimeLog {
    id: string;
    checked_at: string;
    status: string;
    response_time_ms: number;
    db_ok: boolean;
    auth_ok: boolean;
    error_message: string | null;
    consecutive_failures: number;
}

interface ChartPoint {
    checked_at: string;
    status: string;
    response_time_ms: number;
}

export default function AdminUptime() {
    useSEO({ title: 'Uptime & SLA — Admin', noIndex: true });

    const [stats, setStats] = useState<UptimeStats | null>(null);
    const [logs, setLogs] = useState<UptimeLog[]>([]);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartHours, setChartHours] = useState(24);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes, chartRes] = await Promise.all([
                adminApi.getUptimeStats(),
                adminApi.getUptimeLogs({ page: 0, page_size: 20, ...(statusFilter ? { status_filter: statusFilter } : {}) }),
                adminApi.getUptimeChart(chartHours),
            ]);
            setStats(statsRes);
            setLogs(logsRes.data || []);
            setChartData(chartRes.data || []);
        } catch (err) {
            console.error('Uptime fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [chartHours, statusFilter]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Auto-refresh every 60s
    useEffect(() => {
        const interval = setInterval(fetchAll, 60000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('tr-TR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        } catch { return iso; }
    };

    const uptimeColor = (pct: number) =>
        pct >= 99.9 ? '#22c55e' : pct >= 99 ? '#eab308' : pct >= 95 ? '#f97316' : '#ef4444';

    const statusBadge = (status: string) => (
        <span style={{
            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
            background: status === 'ok' ? '#dcfce7' : '#fee2e2',
            color: status === 'ok' ? '#166534' : '#991b1b',
        }}>
            {status === 'ok' ? '✅ OK' : '❌ ERROR'}
        </span>
    );

    // Simple SVG chart
    const renderChart = () => {
        if (chartData.length < 2) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yeterli veri yok</div>;

        const width = 800;
        const height = 200;
        const padding = { top: 20, right: 20, bottom: 30, left: 50 };

        const maxRT = Math.max(...chartData.map(d => d.response_time_ms || 0), 100);
        const minTime = new Date(chartData[0].checked_at).getTime();
        const maxTime = new Date(chartData[chartData.length - 1].checked_at).getTime();
        const timeRange = maxTime - minTime || 1;

        const points = chartData.map(d => {
            const x = padding.left + ((new Date(d.checked_at).getTime() - minTime) / timeRange) * (width - padding.left - padding.right);
            const y = padding.top + (1 - (d.response_time_ms || 0) / maxRT) * (height - padding.top - padding.bottom);
            return { x, y, status: d.status, rt: d.response_time_ms };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        // Area fill
        const areaPath = linePath +
            ` L ${points[points.length - 1].x} ${height - padding.bottom}` +
            ` L ${points[0].x} ${height - padding.bottom} Z`;

        return (
            <div style={{ overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: '800px', height: 'auto' }}>
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(pct => {
                        const y = padding.top + (1 - pct / 100) * (height - padding.top - padding.bottom);
                        return (
                            <g key={pct}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                                    stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                                <text x={padding.left - 5} y={y + 4} textAnchor="end"
                                    fill="#9ca3af" fontSize="10">{Math.round(maxRT * pct / 100)}ms</text>
                            </g>
                        );
                    })}

                    {/* Area */}
                    <path d={areaPath} fill="url(#chartGradient)" />

                    {/* Line */}
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />

                    {/* Error dots */}
                    {points.filter(p => p.status === 'error').map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ef4444" />
                    ))}

                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        );
    };

    if (loading && !stats) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-page">
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Yükleniyor...</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="admin-page"
        >
            <div className="admin-page-header">
                <h1 className="admin-page-title">📊 Uptime & SLA Monitor</h1>
                <p className="admin-page-subtitle">Sistem durumu ve SLA metrikleri</p>
            </div>

            {/* Current Status Banner */}
            {stats && stats.consecutive_failures > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: stats.consecutive_failures >= 5 ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${stats.consecutive_failures >= 5 ? '#fca5a5' : '#fde68a'}`,
                        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>{stats.consecutive_failures >= 5 ? '🚨' : '⚠️'}</span>
                    <div>
                        <strong style={{ color: stats.consecutive_failures >= 5 ? '#991b1b' : '#92400e' }}>
                            {stats.consecutive_failures >= 5 ? 'CRITICAL' : 'WARNING'}
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>
                            {stats.consecutive_failures} ardışık başarısız health check
                        </p>
                    </div>
                </motion.div>
            )}

            {/* SLA Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'Son 24 Saat', pct: stats.uptime_24h, checks: stats.total_checks_24h, rt: stats.avg_response_24h },
                        { label: 'Son 7 Gün', pct: stats.uptime_7d, checks: stats.total_checks_7d, rt: stats.avg_response_7d },
                        { label: 'Son 30 Gün', pct: stats.uptime_30d, checks: stats.total_checks_30d },
                    ].map(card => (
                        <div key={card.label} style={{
                            background: '#fff', borderRadius: '14px', padding: '20px',
                            border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}>
                            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{card.label}</p>
                            <div style={{ fontSize: '36px', fontWeight: 700, color: uptimeColor(card.pct), lineHeight: 1 }}>
                                {card.pct}%
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                                {card.checks} check
                                {card.rt !== undefined && ` · ${card.rt}ms avg`}
                            </div>
                        </div>
                    ))}

                    <div style={{
                        background: '#fff', borderRadius: '14px', padding: '20px',
                        border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Durum</p>
                        <div style={{ fontSize: '36px', lineHeight: 1 }}>
                            {stats.consecutive_failures === 0 ? '🟢' : stats.consecutive_failures < 5 ? '🟡' : '🔴'}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                            {stats.consecutive_failures === 0 ? 'Tüm sistemler çalışıyor' : `${stats.consecutive_failures} ardışık hata`}
                        </div>
                    </div>
                </div>
            )}

            {/* Response Time Chart */}
            <div style={{
                background: '#fff', borderRadius: '14px', padding: '20px',
                border: '1px solid #e5e7eb', marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>📈 Response Time</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[6, 24, 72, 168].map(h => (
                            <button
                                key={h}
                                onClick={() => setChartHours(h)}
                                style={{
                                    padding: '4px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
                                    background: chartHours === h ? '#3b82f6' : '#fff',
                                    color: chartHours === h ? '#fff' : '#374151',
                                    cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                }}
                            >
                                {h < 24 ? `${h}sa` : `${h / 24}g`}
                            </button>
                        ))}
                    </div>
                </div>
                {renderChart()}
            </div>

            {/* Recent Logs */}
            <div style={{
                background: '#fff', borderRadius: '14px', padding: '20px',
                border: '1px solid #e5e7eb',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🕐 Son Kontroller</h3>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db',
                            fontSize: '12px', cursor: 'pointer',
                        }}
                    >
                        <option value="">Tümü</option>
                        <option value="ok">Başarılı</option>
                        <option value="error">Hatalı</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Zaman</th>
                                <th style={thStyle}>Durum</th>
                                <th style={thStyle}>Süre</th>
                                <th style={thStyle}>DB</th>
                                <th style={thStyle}>Auth</th>
                                <th style={thStyle}>Hata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Henüz veri yok</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} style={{
                                        borderBottom: '1px solid #f3f4f6',
                                        background: log.status === 'error' ? 'rgba(254,226,226,0.3)' : 'transparent',
                                    }}>
                                        <td style={tdStyle}>{formatDate(log.checked_at)}</td>
                                        <td style={tdStyle}>{statusBadge(log.status)}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                fontWeight: 600, fontFamily: 'monospace', fontSize: '13px',
                                                color: (log.response_time_ms || 0) > 1000 ? '#ef4444' : (log.response_time_ms || 0) > 500 ? '#f97316' : '#22c55e',
                                            }}>
                                                {log.response_time_ms}ms
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{log.db_ok ? '✅' : '❌'}</td>
                                        <td style={tdStyle}>{log.auth_ok ? '✅' : '❌'}</td>
                                        <td style={{ ...tdStyle, fontSize: '12px', color: '#ef4444', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.error_message || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Production Checklist */}
            <div style={{
                background: '#f0fdf4', borderRadius: '14px', padding: '20px',
                border: '1px solid #bbf7d0', marginTop: '24px',
            }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#166534' }}>
                    🚀 Production Checklist
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#166534', lineHeight: 1.8 }}>
                    <li>UptimeRobot / BetterStack'e <code>GET /health</code> endpoint ekleyin</li>
                    <li>Telegram webhook URL'i <code>ALERT_WEBHOOK_URL</code> env variable olarak ayarlayın</li>
                    <li>Alert email adresini <code>ALERT_EMAIL</code> env variable olarak ayarlayın</li>
                    <li>Monitoring interval varsayılan 60 saniyedir</li>
                </ul>
            </div>
        </motion.div>
    );
}

// Styles
const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px', fontSize: '11px',
    fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0',
};

const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle',
};
