import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../AuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    action_url: string | null;
    created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
    info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
};

export default function NotificationBell() {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Fetch unread count every 30s
    useEffect(() => {
        if (!user) return;
        const fetchCount = async () => {
            try {
                const res = await api.get('/api/notifications/unread-count');
                setCount(res.data?.count || 0);
            } catch { }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications/my', { params: { page: 0 } });
            setNotifications(res.data?.data || []);
        } catch { } finally { setLoading(false); }
    };

    const handleToggle = () => {
        if (!open) fetchNotifications();
        setOpen(!open);
    };

    const markRead = async (id: string) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setCount(c => Math.max(0, c - 1));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/api/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setCount(0);
        } catch { }
    };

    const formatDate = (iso: string) => {
        try {
            const diff = Date.now() - new Date(iso).getTime();
            if (diff < 60000) return 'Az önce';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}dk önce`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa önce`;
            return new Date(iso).toLocaleDateString('tr-TR');
        } catch { return ''; }
    };

    if (!user) return null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={handleToggle}
                style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '20px', position: 'relative', padding: '6px',
                }}
                title="Bildirimler"
            >
                🔔
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: '0', right: '0',
                        background: '#ef4444', color: '#fff', borderRadius: '50%',
                        width: '18px', height: '18px', fontSize: '11px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute', right: 0, top: '40px', width: '360px',
                            background: '#fff', borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
                            zIndex: 9999, maxHeight: '480px', overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>Bildirimler</span>
                            {count > 0 && (
                                <button onClick={markAllRead} style={{
                                    background: 'none', border: 'none', color: '#3b82f6',
                                    fontSize: '12px', cursor: 'pointer', fontWeight: 500,
                                }}>
                                    Tümünü okundu işaretle
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Bildirim yok</div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.is_read && markRead(notif.id)}
                                        style={{
                                            padding: '12px 16px', borderBottom: '1px solid #f9fafb',
                                            cursor: notif.is_read ? 'default' : 'pointer',
                                            background: notif.is_read ? 'transparent' : '#eff6ff',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '16px', flexShrink: 0 }}>{TYPE_ICONS[notif.type] || 'ℹ️'}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: notif.is_read ? 400 : 600, fontSize: '13px', marginBottom: '2px' }}>
                                                    {notif.title}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                                                    {notif.message}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                                    {formatDate(notif.created_at)}
                                                </div>
                                            </div>
                                            {!notif.is_read && (
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: '#3b82f6', flexShrink: 0, marginTop: '4px',
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
