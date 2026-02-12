import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminApi } from '../api';
import { useSEO } from '../hooks/useSEO';
import Breadcrumb from '../components/Breadcrumb';

interface LicenseRecord {
    id: string;
    operator_id: string;
    operator_email: string;
    company_name: string;
    license_type: string;
    license_number: string;
    document_url: string | null;
    status: string;
    submitted_at: string;
}

export default function AdminVerification() {
    const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useSEO({ title: 'Operatör Doğrulama - Admin', noIndex: true });

    const loadLicenses = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('operator_licenses')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLicenses(data || []);
        } catch (err) {
            console.error('Lisanslar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadLicenses();
    }, [loadLicenses]);

    const handleVerify = async (operatorId: string, approved: boolean) => {
        try {
            setProcessingId(operatorId);
            if (approved) {
                await adminApi.verifyLicense(operatorId);
            } else {
                await adminApi.rejectLicense(operatorId);
            }
            await loadLicenses();
        } catch (err) {
            console.error('İşlem başarısız:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const statusColors: Record<string, { bg: string; color: string; label: string }> = {
        pending: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: '⏳ Bekliyor' },
        approved: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: '✓ Onaylı' },
        rejected: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: '✕ Reddedildi' },
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <ShieldCheck size={28} color="var(--primary-teal)" /> Operatör Doğrulama
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    TÜRSAB & Bakanlık belgelerini inceleyin ve operatörleri doğrulayın
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { value: 'pending', label: 'Bekleyen', icon: '⏳' },
                    { value: 'approved', label: 'Onaylanan', icon: '✅' },
                    { value: 'rejected', label: 'Reddedilen', icon: '❌' },
                    { value: 'all', label: 'Tümü', icon: '📋' },
                ].map(tab => (
                    <motion.button
                        key={tab.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatusFilter(tab.value)}
                        style={{
                            padding: '0.625rem 1.25rem',
                            borderRadius: '8px',
                            border: statusFilter === tab.value ? '2px solid var(--primary-teal)' : '1px solid var(--border-color)',
                            background: statusFilter === tab.value ? 'rgba(20,184,166,0.1)' : 'var(--bg-secondary)',
                            color: statusFilter === tab.value ? 'var(--primary-teal)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: statusFilter === tab.value ? 600 : 400,
                            fontSize: '0.85rem',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </motion.button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    Yükleniyor...
                </div>
            ) : licenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    Bu kategoride doğrulama talebi bulunamadı
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                        {licenses.map((lic, idx) => {
                            const st = statusColors[lic.status] || statusColors.pending;
                            return (
                                <motion.div
                                    key={lic.id}
                                    className="card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                                >
                                    {/* Left: Info */}
                                    <div style={{ flex: '1 1 300px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                            {lic.company_name || lic.operator_email}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                            {lic.operator_email}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FileText size={14} /> {lic.license_type || 'Belge'}
                                            </span>
                                            {lic.license_number && (
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    No: {lic.license_number}
                                                </span>
                                            )}
                                            <span style={{
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '50px',
                                                background: st.bg,
                                                color: st.color,
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                            }}>
                                                {st.label}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
                                            Gönderilme: {new Date(lic.submitted_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {lic.document_url && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setPreviewUrl(lic.document_url)}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                    padding: '0.5rem 1rem', borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
                                                }}
                                            >
                                                <Eye size={14} /> Belgeyi Gör
                                            </motion.button>
                                        )}
                                        {lic.status === 'pending' && (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleVerify(lic.operator_id, true)}
                                                    disabled={processingId === lic.operator_id}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                        padding: '0.5rem 1rem', borderRadius: '8px',
                                                        border: 'none', background: 'rgba(16,185,129,0.15)',
                                                        color: '#10B981', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                                        opacity: processingId === lic.operator_id ? 0.5 : 1,
                                                    }}
                                                >
                                                    <CheckCircle size={14} /> Onayla
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleVerify(lic.operator_id, false)}
                                                    disabled={processingId === lic.operator_id}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                        padding: '0.5rem 1rem', borderRadius: '8px',
                                                        border: 'none', background: 'rgba(239,68,68,0.15)',
                                                        color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                                        opacity: processingId === lic.operator_id ? 0.5 : 1,
                                                    }}
                                                >
                                                    <XCircle size={14} /> Reddet
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Document Preview Modal */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.7)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '2rem',
                        }}
                        onClick={() => setPreviewUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-primary)', borderRadius: '16px',
                                maxWidth: '800px', width: '100%', maxHeight: '80vh',
                                overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <h3 style={{ margin: 0 }}>📄 Belge Önizleme</h3>
                                <button onClick={() => setPreviewUrl(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>
                            </div>
                            <div style={{ padding: '1rem', height: '60vh' }}>
                                <iframe
                                    src={previewUrl}
                                    title="Belge Önizleme"
                                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
