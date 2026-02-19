import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileEdit, Save, Eye, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSEO } from '../../hooks/useSEO';
import Breadcrumb from '../../components/Breadcrumb';

interface CMSPage {
    id: string;
    slug: string;
    title: string;
    content: string;
    updated_at: string;
}

const DEFAULT_PAGES = [
    { slug: 'faq', title: 'Sıkça Sorulan Sorular', icon: '❓' },
    { slug: 'about', title: 'Hakkımızda', icon: 'ℹ️' },
    { slug: 'privacy', title: 'Gizlilik Politikası', icon: '🔒' },
    { slug: 'terms', title: 'Kullanım Koşulları', icon: '📜' },
    { slug: 'contact', title: 'İletişim', icon: '📞' },
];

export default function AdminCMS() {
    const [pages, setPages] = useState<CMSPage[]>([]);
    const [_loading, setLoading] = useState(true);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useSEO({ title: 'İçerik Yönetimi - Admin', noIndex: true });

    const loadPages = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cms_pages')
                .select('*')
                .order('title');

            if (error) throw error;
            setPages(data || []);
        } catch (err) {
            console.error('CMS sayfaları yüklenemedi:', err);
            setPages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPages();
    }, [loadPages]);

    const openEditor = (slug: string) => {
        const page = pages.find(p => p.slug === slug);
        setActiveSlug(slug);
        setEditContent(page?.content || '');
        setPreviewMode(false);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!activeSlug) return;
        try {
            setSaving(true);
            const existing = pages.find(p => p.slug === activeSlug);
            const pageTitle = DEFAULT_PAGES.find(p => p.slug === activeSlug)?.title || activeSlug;

            if (existing) {
                await supabase
                    .from('cms_pages')
                    .update({ content: editContent, updated_at: new Date().toISOString() })
                    .eq('slug', activeSlug);
            } else {
                await supabase
                    .from('cms_pages')
                    .insert({ slug: activeSlug, title: pageTitle, content: editContent });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            await loadPages();
        } catch (err) {
            console.error('Sayfa kaydedilemedi:', err);
        } finally {
            setSaving(false);
        }
    };

    const activePage = DEFAULT_PAGES.find(p => p.slug === activeSlug);
    const existingPage = pages.find(p => p.slug === activeSlug);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FileEdit size={28} color="var(--primary-teal)" /> İçerik Yönetimi (CMS)
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Statik sayfaların içeriklerini düzenleyin
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: activeSlug ? '280px 1fr' : '1fr', gap: '1.5rem' }}>
                {/* Page List */}
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {DEFAULT_PAGES.map(dp => {
                            const exists = pages.find(p => p.slug === dp.slug);
                            return (
                                <motion.button
                                    key={dp.slug}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => openEditor(dp.slug)}
                                    className="card"
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        padding: '0.875rem 1rem',
                                        border: activeSlug === dp.slug ? '2px solid var(--primary-teal)' : '1px solid var(--border-color)',
                                        background: activeSlug === dp.slug ? 'rgba(20,184,166,0.05)' : undefined,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <span style={{ marginRight: '0.5rem' }}>{dp.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dp.title}</span>
                                    </div>
                                    {exists ? (
                                        <span style={{
                                            fontSize: '0.7rem', padding: '0.125rem 0.5rem',
                                            borderRadius: '50px', background: 'rgba(16,185,129,0.15)',
                                            color: '#10B981', fontWeight: 600,
                                        }}>
                                            Düzenlendi
                                        </span>
                                    ) : (
                                        <span style={{
                                            fontSize: '0.7rem', padding: '0.125rem 0.5rem',
                                            borderRadius: '50px', background: 'rgba(156,163,175,0.15)',
                                            color: '#9CA3AF', fontWeight: 600,
                                        }}>
                                            Boş
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Editor */}
                <AnimatePresence mode="wait">
                    {activeSlug && (
                        <motion.div
                            key={activeSlug}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="card">
                                {/* Editor header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <h3 style={{ margin: 0 }}>
                                        {activePage?.icon} {activePage?.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setPreviewMode(!previewMode)}
                                            className="btn btn-outline btn-small"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                                        >
                                            {previewMode ? <><Edit3 size={14} /> Düzenle</> : <><Eye size={14} /> Önizle</>}
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn btn-primary btn-small"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem',
                                                background: saved ? '#10B981' : undefined,
                                                opacity: saving ? 0.6 : 1,
                                            }}
                                        >
                                            <Save size={14} />
                                            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
                                        </motion.button>
                                    </div>
                                </div>

                                {existingPage && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        Son güncelleme: {new Date(existingPage.updated_at).toLocaleString('tr-TR')}
                                    </div>
                                )}

                                {previewMode ? (
                                    <div style={{
                                        padding: '1.5rem', background: 'var(--bg-secondary)',
                                        borderRadius: '8px', minHeight: '300px',
                                        whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.9rem',
                                    }}>
                                        {editContent || 'İçerik henüz eklenmemiş...'}
                                    </div>
                                ) : (
                                    <textarea
                                        value={editContent}
                                        onChange={e => { setEditContent(e.target.value); setSaved(false); }}
                                        placeholder="Sayfa içeriğini buraya yazın..."
                                        style={{
                                            width: '100%', minHeight: '300px', padding: '1rem',
                                            borderRadius: '8px', border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                            fontSize: '0.9rem', resize: 'vertical', lineHeight: 1.7,
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
