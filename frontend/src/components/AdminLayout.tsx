import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('admin-theme') as 'dark' | 'light') || 'dark';
    });
    const [notifCount, setNotifCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState<Array<{ type: string; label: string; count: number }>>([]);

    useEffect(() => {
        document.documentElement.setAttribute('data-admin-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const [pendingTours, pendingTickets, pendingReviews] = await Promise.all([
                supabase.from('tours').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
                supabase.from('operator_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);

            const items = [
                { type: 'tours', label: 'Bekleyen Tur Onayı', count: pendingTours.count || 0 },
                { type: 'tickets', label: 'Açık Destek Bileti', count: pendingTickets.count || 0 },
                { type: 'reviews', label: 'Bekleyen Yorum', count: pendingReviews.count || 0 },
            ].filter(i => i.count > 0);

            setRecentNotifs(items);
            setNotifCount(items.reduce((sum, i) => sum + i.count, 0));
        } catch (err) {
            // Tables may not exist, ignore
        }
    };

    const notifLinks: Record<string, string> = {
        tours: '/admin/approval',
        tickets: '/admin/tickets',
        reviews: '/admin/reviews',
    };

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <div className={`admin-layout admin-theme-${theme}`}>
            <AdminSidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Top Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}>
                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-secondary)', padding: '0.5rem',
                            borderRadius: '8px',
                        }}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.button>

                    {/* Notification Bell */}
                    <div style={{ position: 'relative' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-secondary)', padding: '0.5rem',
                                borderRadius: '8px', position: 'relative',
                            }}
                        >
                            <Bell size={20} />
                            {notifCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '2px', right: '2px',
                                    background: '#EF4444', color: 'white',
                                    borderRadius: '50%', width: '18px', height: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', fontWeight: 700,
                                }}>
                                    {notifCount > 9 ? '9+' : notifCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {showNotifDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    style={{
                                        position: 'absolute', top: '100%', right: 0,
                                        marginTop: '0.5rem', width: '280px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                        overflow: 'hidden', zIndex: 100,
                                    }}
                                >
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                                        🔔 Bildirimler
                                    </div>
                                    {recentNotifs.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            Yeni bildirim yok ✓
                                        </div>
                                    ) : (
                                        recentNotifs.map(notif => (
                                            <Link
                                                key={notif.type}
                                                to={notifLinks[notif.type] || '/admin/dashboard'}
                                                onClick={() => setShowNotifDropdown(false)}
                                                style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    alignItems: 'center', padding: '0.75rem 1rem',
                                                    textDecoration: 'none', color: 'var(--text-primary)',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                <span>{notif.label}</span>
                                                <span style={{
                                                    background: '#EF4444', color: 'white',
                                                    borderRadius: '50px', padding: '0.125rem 0.5rem',
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                }}>
                                                    {notif.count}
                                                </span>
                                            </Link>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Main Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
