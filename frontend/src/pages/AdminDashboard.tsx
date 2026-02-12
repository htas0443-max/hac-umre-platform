import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Clock, CheckCircle, Users, Building2, Heart, TrendingUp } from 'lucide-react';
import { toursApi } from '../api';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import Breadcrumb from '../components/Breadcrumb';

interface DashboardStats {
    totalTours: number;
    pendingTours: number;
    approvedTours: number;
    rejectedTours: number;
    totalUsers: number;
    totalOperators: number;
    totalFavorites: number;
}

interface ActivityItem {
    id: string;
    action: string;
    details: string;
    created_at: string;
    user_email?: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalTours: 0,
        pendingTours: 0,
        approvedTours: 0,
        rejectedTours: 0,
        totalUsers: 0,
        totalOperators: 0,
        totalFavorites: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentPending, setRecentPending] = useState<any[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    // SEO: noindex - admin paneli indexlenmemeli
    useSEO({ title: 'Admin Dashboard', noIndex: true });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load all stats in parallel
            const [allTours, pendingTours, approvedTours, usersResult, operatorsResult, favoritesResult, auditResult] = await Promise.all([
                toursApi.getAll({ limit: 1 } as any),
                toursApi.getAll({ status: 'pending', limit: 5 } as any),
                toursApi.getAll({ status: 'approved', limit: 1 } as any),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'operator'),
                supabase.from('favorites').select('id', { count: 'exact', head: true }),
                supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
            ]);

            setStats({
                totalTours: allTours.total || allTours.tours.length,
                pendingTours: pendingTours.total || pendingTours.tours.length,
                approvedTours: approvedTours.total || approvedTours.tours.length,
                rejectedTours: 0,
                totalUsers: usersResult.count || 0,
                totalOperators: operatorsResult.count || 0,
                totalFavorites: favoritesResult.count || 0,
            });

            setRecentPending(pendingTours.tours.slice(0, 5));
            setActivities(auditResult.data || []);
        } catch (err) {
            console.error('Dashboard verisi yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Toplam Tur',
            value: stats.totalTours,
            IconComponent: BarChart3,
            color: 'linear-gradient(135deg, #E8F5E9 0%, #A8D5BA 100%)',
            link: '/admin/approval'
        },
        {
            label: 'Bekleyen Onay',
            value: stats.pendingTours,
            IconComponent: Clock,
            color: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
            link: '/admin/approval',
            urgent: stats.pendingTours > 0
        },
        {
            label: 'Onaylı Tur',
            value: stats.approvedTours,
            IconComponent: CheckCircle,
            color: 'linear-gradient(135deg, #D1FAE5 0%, #34D399 100%)',
            link: '/admin/approval'
        },
        {
            label: 'Kullanıcılar',
            value: stats.totalUsers,
            IconComponent: Users,
            color: 'linear-gradient(135deg, #DBEAFE 0%, #60A5FA 100%)',
            link: '/admin/users'
        },
        {
            label: 'Operatörler',
            value: stats.totalOperators,
            IconComponent: Building2,
            color: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)',
            link: '/admin/users'
        },
        {
            label: 'Favoriler',
            value: stats.totalFavorites,
            IconComponent: Heart,
            color: 'linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 100%)',
            link: '/admin/analytics'
        },
    ];

    const actionIcons: Record<string, string> = {
        'tour_approved': '✅',
        'tour_rejected': '❌',
        'user_registered': '👤',
        'tour_created': '➕',
        'review_moderated': '⭐',
        'license_verified': '🛡️',
        'user_banned': '🚫',
        'login': '🔑',
        'default': '📋',
    };

    if (loading) {
        return (
            <div className="admin-dashboard" data-testid="dashboard-loading">
                <Breadcrumb />
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={28} color="var(--primary-teal)" /> Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p>
                </div>
                {/* Skeleton Cards */}
                <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card skeleton-card" style={{
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            height: '140px'
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="admin-dashboard"
            data-testid="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={28} color="var(--primary-teal)" /> Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Platform durumunu izleyin ve yönetin
                    </p>
                </div>
                <Link to="/admin/tours/new" className="btn btn-primary">
                    + Yeni Tur Ekle
                </Link>
            </div>

            {/* Stats Cards - 6 KPI */}
            <motion.div
                className="grid grid-3"
                style={{ marginBottom: '2rem' }}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
                {statCards.map((card, index) => (
                    <motion.div
                        key={index}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                    >
                        <Link
                            to={card.link}
                            style={{ textDecoration: 'none' }}
                            data-testid={`stat-${card.label.toLowerCase().replace(' ', '-')}`}
                        >
                            <motion.div
                                className="card"
                                style={{
                                    background: card.color,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {card.urgent && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.75rem',
                                        right: '0.75rem',
                                        background: '#EF4444',
                                        color: 'white',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                    }}>
                                        Acil
                                    </div>
                                )}
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><card.IconComponent size={40} color="#1a1a1a" /></div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1a1a1a' }}>
                                    {card.value}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#4B5563', fontWeight: 500 }}>
                                    {card.label}
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>⚡ Hızlı Erişim</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/admin/approval" className="btn btn-primary">
                        ✅ Tur Onayları ({stats.pendingTours})
                    </Link>
                    <Link to="/admin/users" className="btn btn-outline">
                        👥 Kullanıcılar
                    </Link>
                    <Link to="/admin/verification" className="btn btn-outline">
                        🛡️ Doğrulama
                    </Link>
                    <Link to="/admin/reports" className="btn btn-outline">
                        📊 Raporlar
                    </Link>
                    <Link to="/admin/import" className="btn btn-outline">
                        📥 CSV Import
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {/* Recent Pending Tours */}
                {recentPending.length > 0 && (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>⏳ Son Bekleyen Turlar</h3>
                            <Link to="/admin/approval" className="btn btn-small btn-outline">
                                Tümünü Gör →
                            </Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentPending.map((tour, index) => (
                                <motion.div
                                    key={tour._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid var(--accent-gold)'
                                    }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{tour.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {tour.operator}
                                        </div>
                                    </div>
                                    <Link
                                        to="/admin/approval"
                                        className="btn btn-small btn-primary"
                                    >
                                        İncele
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Activity Feed */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} /> Son Aktiviteler
                        </h3>
                        <Link to="/admin/audit" className="btn btn-small btn-outline">
                            Tümünü Gör →
                        </Link>
                    </div>

                    {activities.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                            Henüz aktivite kaydı yok
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {activities.slice(0, 8).map((activity, idx) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.05 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.625rem 0',
                                        borderBottom: idx < activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem', marginTop: '0.125rem' }}>
                                        {actionIcons[activity.action] || actionIcons.default}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.85rem', marginBottom: '0.125rem' }}>
                                            {activity.action?.replace(/_/g, ' ') || 'Aktivite'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {activity.details || activity.user_email || ''}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginTop: '0.125rem' }}>
                                        {new Date(activity.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
