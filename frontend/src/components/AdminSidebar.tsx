import { memo, useState, useEffect, ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { hasPermission, type Permission } from '../lib/permissions';
import {
    LayoutDashboard, CheckCircle, PlusCircle, Star, FileText,
    Users, ShieldCheck, Ticket, BarChart3, TrendingUp, Trophy,
    Shield, Clock, Lock, Mail, CalendarClock, Activity, HardDrive,
    Flag, FileUp, FolderOpen, Bell, Settings, Globe,
    User, LogOut, ChevronRight, Menu, X, Home
} from 'lucide-react';

interface MenuItem {
    path: string;
    label: string;
    icon: ReactNode;
    badge?: number;
    requiredPermission?: Permission;
}

interface MenuSection {
    title: string;
    icon: ReactNode;
    items: MenuItem[];
}

const adminMenuSections: MenuSection[] = [
    {
        title: 'Ana',
        icon: <Home size={14} />,
        items: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, requiredPermission: 'dashboard' },
        ],
    },
    {
        title: 'İçerik Yönetimi',
        icon: <FileText size={14} />,
        items: [
            { path: '/admin/approval', label: 'Tur Onayları', icon: <CheckCircle size={18} />, requiredPermission: 'approval' },
            { path: '/admin/add-tour', label: 'Yeni Tur Ekle', icon: <PlusCircle size={18} />, requiredPermission: 'tours.create' },
            { path: '/admin/reviews', label: 'Yorumlar', icon: <Star size={18} />, requiredPermission: 'reviews' },
            { path: '/admin/cms', label: 'CMS', icon: <FileText size={18} />, requiredPermission: 'cms' },
        ],
    },
    {
        title: 'Kullanıcılar',
        icon: <Users size={14} />,
        items: [
            { path: '/admin/users', label: 'Kullanıcılar', icon: <Users size={18} />, requiredPermission: 'users' },
            { path: '/admin/verification', label: 'Operatör Doğrulama', icon: <ShieldCheck size={18} />, requiredPermission: 'verification' },
            { path: '/admin/tickets', label: 'Destek Biletleri', icon: <Ticket size={18} />, requiredPermission: 'tickets' },
        ],
    },
    {
        title: 'Raporlar',
        icon: <BarChart3 size={14} />,
        items: [
            { path: '/admin/reports', label: 'Raporlar', icon: <BarChart3 size={18} />, requiredPermission: 'reports' },
            { path: '/admin/analytics', label: 'Analytics', icon: <TrendingUp size={18} />, requiredPermission: 'analytics' },
            { path: '/admin/operator-performance', label: 'Operatör Performans', icon: <Trophy size={18} />, requiredPermission: 'operator_perf' },
            { path: '/admin/audit', label: 'Audit Log', icon: <Shield size={18} />, requiredPermission: 'audit' },
            { path: '/admin/history', label: 'İşlem Geçmişi', icon: <Clock size={18} />, requiredPermission: 'history' },
        ],
    },
    {
        title: 'Sistem',
        icon: <Settings size={14} />,
        items: [
            { path: '/admin/rate-limits', label: 'Rate Limiting', icon: <Lock size={18} />, requiredPermission: 'rate_limits' },
            { path: '/admin/email-queue', label: 'Email Kuyruk', icon: <Mail size={18} />, requiredPermission: 'email_queue' },
            { path: '/admin/scheduled-actions', label: 'Zamanlanmış', icon: <CalendarClock size={18} />, requiredPermission: 'scheduled_actions' },
            { path: '/admin/uptime', label: 'Uptime & SLA', icon: <Activity size={18} />, requiredPermission: 'uptime' },
            { path: '/admin/system-info', label: 'Sistem Bilgisi', icon: <HardDrive size={18} />, requiredPermission: 'system_info' },
            { path: '/admin/feature-flags', label: 'Feature Flags', icon: <Flag size={18} />, requiredPermission: 'feature_flags' },
        ],
    },
    {
        title: 'Araçlar',
        icon: <Settings size={14} />,
        items: [
            { path: '/admin/import', label: 'CSV Import', icon: <FileUp size={18} />, requiredPermission: 'import' },
            { path: '/admin/files', label: 'Dosya Yönetimi', icon: <FolderOpen size={18} />, requiredPermission: 'files' },
            { path: '/admin/notifications', label: 'Bildirimler', icon: <Bell size={18} />, requiredPermission: 'notifications' },
            { path: '/admin/settings', label: 'Ayarlar', icon: <Settings size={18} />, requiredPermission: 'settings' },
            { path: '/tours', label: 'Tüm Turlar (Site)', icon: <Globe size={18} /> },
        ],
    },
];

interface AdminSidebarProps {
    pendingCount?: number;
}

const AdminSidebar = memo(function AdminSidebar({ pendingCount = 0 }: AdminSidebarProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const currentPath = location.pathname;
        const newOpenSections: Record<string, boolean> = {};
        adminMenuSections.forEach(section => {
            const hasActiveItem = section.items.some(item => currentPath.startsWith(item.path));
            if (hasActiveItem) {
                newOpenSections[section.title] = true;
            }
        });
        newOpenSections['Ana'] = true;
        setOpenSections(prev => ({ ...prev, ...newOpenSections }));
    }, [location.pathname]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const toggleSection = (title: string) => {
        if (isCollapsed) return;
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const sidebarVariants = {
        expanded: { width: 260 },
        collapsed: { width: 72 }
    };

    const filteredSections = adminMenuSections
        .map(section => ({
            ...section,
            items: section.items.filter(
                item => !item.requiredPermission || hasPermission(user?.role as any, item.requiredPermission)
            ),
        }))
        .filter(section => section.items.length > 0);

    return (
        <>
            <button
                className="admin-sidebar-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle sidebar"
            >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        className="admin-sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                transition={{ duration: 0.2 }}
            >
                <div className="admin-sidebar-header">
                    <Link to="/" className="admin-sidebar-logo">
                        <span className="admin-sidebar-logo-icon">
                            <Shield size={22} strokeWidth={2.5} />
                        </span>
                        {!isCollapsed && <span className="admin-sidebar-logo-text">Admin Panel</span>}
                    </Link>
                    <button
                        className="admin-sidebar-collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <ChevronRight
                            size={16}
                            style={{
                                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                transition: 'transform 0.2s',
                            }}
                        />
                    </button>
                </div>

                <nav className="admin-sidebar-nav">
                    <ul className="admin-sidebar-menu">
                        {filteredSections.map((section) => (
                            <li key={section.title} className="admin-sidebar-section">
                                {!isCollapsed && section.title !== 'Ana' && (
                                    <button
                                        className="admin-sidebar-section-header"
                                        onClick={() => toggleSection(section.title)}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {section.icon}
                                            {section.title}
                                        </span>
                                        <ChevronRight
                                            size={12}
                                            style={{
                                                transform: openSections[section.title] ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s',
                                            }}
                                        />
                                    </button>
                                )}

                                <AnimatePresence initial={false}>
                                    {(isCollapsed || section.title === 'Ana' || openSections[section.title]) && (
                                        <motion.ul
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden', listStyle: 'none', padding: 0, margin: 0 }}
                                        >
                                            {section.items.map((item) => (
                                                <li key={item.path} className="admin-sidebar-menu-item">
                                                    {item.path.startsWith('/admin') ? (
                                                        <NavLink
                                                            to={item.path}
                                                            end={item.path === '/admin/dashboard'}
                                                            className={({ isActive }) =>
                                                                `admin-sidebar-link ${isActive ? 'active' : ''}`
                                                            }
                                                            title={isCollapsed ? item.label : undefined}
                                                        >
                                                            <span className="admin-sidebar-link-icon">{item.icon}</span>
                                                            {!isCollapsed && (
                                                                <>
                                                                    <span className="admin-sidebar-link-text">{item.label}</span>
                                                                    {item.path === '/admin/approval' && pendingCount > 0 && (
                                                                        <span className="admin-sidebar-badge">{pendingCount}</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </NavLink>
                                                    ) : (
                                                        <a
                                                            href={item.path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="admin-sidebar-link"
                                                            title={isCollapsed ? item.label : undefined}
                                                        >
                                                            <span className="admin-sidebar-link-icon">{item.icon}</span>
                                                            {!isCollapsed && (
                                                                <span className="admin-sidebar-link-text">{item.label}</span>
                                                            )}
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-user">
                        <User size={18} style={{ opacity: 0.7 }} />
                        {!isCollapsed && (
                            <div className="admin-sidebar-user-info">
                                <span className="admin-sidebar-user-email">{user?.email}</span>
                                <span className="admin-sidebar-user-role">Admin</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => logout()}
                        className="admin-sidebar-logout"
                        title="Çıkış Yap"
                    >
                        {isCollapsed ? <LogOut size={18} /> : 'Çıkış'}
                    </button>
                </div>
            </motion.aside>
        </>
    );
});

export default AdminSidebar;
