import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, Trash2, Users, Building2 } from 'lucide-react';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import Breadcrumb from '../../components/Breadcrumb';

interface Notification {
    id: string;
    title: string;
    message: string;
    target_role: string;
    created_at: string;
    created_by: string;
}

const TARGET_OPTIONS = [
    { value: 'all', label: 'Tüm Kullanıcılar', icon: '🌍' },
    { value: 'user', label: 'Sadece Kullanıcılar', icon: '👤' },
    { value: 'operator', label: 'Sadece Operatörler', icon: '🏢' },
];

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', message: '', target_role: 'all' });

    useSEO({ title: 'Bildirimler - Admin', noIndex: true });

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const result = await adminApi.getNotifications();
            setNotifications(result.notifications || []);
        } catch (err) {
            console.error('Bildirimler yüklenemedi:', err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) return;
        try {
            setSending(true);
            await adminApi.createNotification({
                title: form.title.trim(),
                message: form.message.trim(),
                target_role: form.target_role,
            });

            setForm({ title: '', message: '', target_role: 'all' });
            setShowForm(false);
            await loadNotifications();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Bildirim gönderilemedi';
            alert(msg);
            console.error(msg, err);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminApi.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Bildirim silinemedi:', err);
        }
    };

    const getTargetLabel = (role: string) => {
        const t = TARGET_OPTIONS.find(o => o.value === role);
        return t ? `${t.icon} ${t.label}` : role;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Bell size={28} color="var(--primary-teal)" /> Bildirimler & Duyurular
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Kullanıcılara ve operatörlere duyuru gönderin
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Send size={16} /> Yeni Duyuru
                </motion.button>
            </div>

            {/* New Notification Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ✏️ Yeni Duyuru Oluştur
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                    Başlık
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Duyuru başlığı..."
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                    Mesaj
                                </label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="Duyuru içeriği..."
                                    rows={4}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                                    Hedef Kitle
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {TARGET_OPTIONS.map(opt => (
                                        <motion.button
                                            key={opt.value}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setForm(f => ({ ...f, target_role: opt.value }))}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '8px',
                                                border: form.target_role === opt.value ? '2px solid var(--primary-teal)' : '1px solid var(--border-color)',
                                                background: form.target_role === opt.value ? 'rgba(20,184,166,0.1)' : 'transparent',
                                                color: form.target_role === opt.value ? 'var(--primary-teal)' : 'var(--text-secondary)',
                                                cursor: 'pointer', fontWeight: form.target_role === opt.value ? 600 : 400,
                                                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                                            }}
                                        >
                                            {opt.value === 'all' && <Users size={14} />}
                                            {opt.value === 'operator' && <Building2 size={14} />}
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowForm(false)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                                    İptal
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSend}
                                    disabled={sending || !form.title.trim() || !form.message.trim()}
                                    className="btn btn-primary"
                                    style={{
                                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        opacity: sending || !form.title.trim() || !form.message.trim() ? 0.6 : 1,
                                    }}
                                >
                                    <Send size={14} /> {sending ? 'Gönderiliyor...' : 'Gönder'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications List */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    Yükleniyor...
                </div>
            ) : notifications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    <p>Henüz duyuru gönderilmemiş</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        "Yeni Duyuru" butonuna tıklayarak ilk duyurunuzu oluşturun
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <AnimatePresence>
                        {notifications.map((notif, idx) => (
                            <motion.div
                                key={notif.id}
                                className="card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 0.375rem', fontWeight: 600 }}>
                                            {notif.title}
                                        </h4>
                                        <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            {notif.message}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span>{getTargetLabel(notif.target_role)}</span>
                                            <span>•</span>
                                            <span>{new Date(notif.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDelete(notif.id)}
                                        style={{
                                            background: 'rgba(239,68,68,0.1)', border: 'none',
                                            borderRadius: '8px', padding: '0.5rem',
                                            cursor: 'pointer', color: '#EF4444',
                                        }}
                                        title="Sil"
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
