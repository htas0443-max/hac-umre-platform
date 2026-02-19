import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toursApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import Breadcrumb from '../../components/Breadcrumb';

type ReportType = 'tours' | 'users' | 'reviews';

export default function AdminReports() {
    const [exporting, setExporting] = useState<ReportType | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useSEO({ title: 'Raporlama - Admin', noIndex: true });

    const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
        const bom = '\uFEFF';
        const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportTours = async () => {
        try {
            setExporting('tours');
            const result = await toursApi.getAll({ limit: 9999 } as any);
            const tours = result.tours || [];
            const headers = ['Başlık', 'Operatör', 'Fiyat', 'Durum', 'Tarih', 'Süre'];
            const rows = tours.map((t: any) => [
                `"${(t.title || '').replace(/"/g, '""')}"`,
                `"${(t.operator || '').replace(/"/g, '""')}"`,
                t.price?.toString() || '0',
                t.status || 'pending',
                t.departure_date || '',
                t.duration || '',
            ]);
            downloadCSV('turlar', headers, rows);
        } catch (err) {
            console.error('Tur raporu oluşturulamadı:', err);
        } finally {
            setExporting(null);
        }
    };

    const exportUsers = async () => {
        try {
            setExporting('users');
            let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (dateFrom) query = query.gte('created_at', dateFrom);
            if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
            const { data } = await query;
            const users = data || [];
            const headers = ['E-posta', 'Rol', 'Firma', 'Durum', 'Kayıt Tarihi'];
            const rows = users.map((u: any) => [
                u.email || '',
                u.role || '',
                `"${(u.company_name || '').replace(/"/g, '""')}"`,
                u.is_active !== false ? 'Aktif' : 'Engelli',
                u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '',
            ]);
            downloadCSV('kullanicilar', headers, rows);
        } catch (err) {
            console.error('Kullanıcı raporu oluşturulamadı:', err);
        } finally {
            setExporting(null);
        }
    };

    const exportReviews = async () => {
        try {
            setExporting('reviews');
            const { data } = await supabase
                .from('operator_reviews')
                .select('*')
                .order('created_at', { ascending: false });
            const reviews = data || [];
            const headers = ['Operatör', 'Puan', 'Başlık', 'Yorum', 'Durum', 'Tarih'];
            const rows = reviews.map((r: any) => [
                `"${(r.operator_name || '').replace(/"/g, '""')}"`,
                r.rating?.toString() || '',
                `"${(r.title || '').replace(/"/g, '""')}"`,
                `"${(r.comment || '').replace(/"/g, '""')}"`,
                r.status || '',
                r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR') : '',
            ]);
            downloadCSV('yorumlar', headers, rows);
        } catch (err) {
            console.error('Yorum raporu oluşturulamadı:', err);
        } finally {
            setExporting(null);
        }
    };

    const reports = [
        {
            type: 'tours' as ReportType,
            title: 'Tur Raporu',
            description: 'Tüm turları başlık, fiyat, durum ve tarih bilgileriyle dışa aktar',
            icon: '✈️',
            color: '#3B82F6',
            action: exportTours,
        },
        {
            type: 'users' as ReportType,
            title: 'Kullanıcı Raporu',
            description: 'Kayıtlı kullanıcıları e-posta, rol ve durum bilgileriyle dışa aktar',
            icon: '👥',
            color: '#10B981',
            action: exportUsers,
        },
        {
            type: 'reviews' as ReportType,
            title: 'Yorum Raporu',
            description: 'Tüm firma değerlendirmelerini puan ve yorum detaylarıyla dışa aktar',
            icon: '⭐',
            color: '#F59E0B',
            action: exportReviews,
        },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FileSpreadsheet size={28} color="var(--primary-teal)" /> Raporlama & Dışa Aktarma
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Platform verilerini CSV formatında dışa aktarın
                </p>
            </div>

            {/* Date Filter */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Calendar size={18} color="var(--text-secondary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tarih Aralığı:</span>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '8px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '0.85rem',
                    }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>—</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem', borderRadius: '8px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '0.85rem',
                    }}
                />
            </div>

            {/* Report Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {reports.map((report, idx) => (
                    <motion.div
                        key={report.type}
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            borderTop: `3px solid ${report.color}`,
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{report.icon}</div>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{report.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.25rem', flex: 1, lineHeight: 1.5 }}>
                            {report.description}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={report.action}
                            disabled={exporting === report.type}
                            className="btn btn-primary"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem', width: '100%',
                                opacity: exporting === report.type ? 0.6 : 1,
                            }}
                        >
                            <Download size={16} />
                            {exporting === report.type ? 'İndiriliyor...' : 'CSV İndir'}
                        </motion.button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
