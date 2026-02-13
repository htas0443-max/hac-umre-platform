import { memo, useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { hasPermission, type Permission } from '../lib/permissions';

interface MenuItem {
    path: string;
    label: string;
    icon: string;
    badge?: number;
    requiredPermission?: Permission;
}

interface MenuSection {
    title: string;
    icon: string;
    items: MenuItem[];
}

const adminMenuSections: MenuSection[] = [
    {
        title: 'Ana',
        icon: '🏠',
        items: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', requiredPermission: 'dashboard' },
        ],
    },
    {
        title: 'İçerik Yönetimi',
        icon: '📄',
        items: [
            { path: '/admin/approval', label: 'Tur Onayları', icon: '✅', requiredPermission: 'approval' },
            { path: '/admin/add-tour', label: 'Yeni Tur Ekle', icon: '➕', requiredPermission: 'tours.create' },
            { path: '/admin/reviews', label: 'Yorumlar', icon: '⭐', requiredPermission: 'reviews' },
            { path: '/admin/cms', label: 'CMS', icon: '📝', requiredPermission: 'cms' },
        ],
    },
    {
        title: 'Kullanıcılar',
        icon: '👥',
        items: [
            { path: '/admin/users', label: 'Kullanıcılar', icon: '👥', requiredPermission: 'users' },
            { path: '/admin/verification', label: 'Operatör Doğrulama', icon: '🛡️', requiredPermission: 'verification' },
            { path: '/admin/tickets', label: 'Destek Biletleri', icon: '🎫', requiredPermission: 'tickets' },
        ],
    },
    {
        title: 'Raporlar',
        icon: '📈',
        items: [
            { path: '/admin/reports', label: 'Raporlar', icon: '📋', requiredPermission: 'reports' },
            { path: '/admin/analytics', label: 'Ajanta Analytics', icon: '📈', requiredPermission: 'analytics' },
            { path: '/admin/operator-performance', label: 'Operatör Performans', icon: '🏆', requiredPermission: 'operator_perf' },
            { path: '/admin/audit', label: 'Audit Log', icon: '🛡️', requiredPermission: 'audit' },
            { path: '/admin/history', label: 'İşlem Geçmişi', icon: '🕐', requiredPermission: 'history' },
        ],
    },
    {
        title: 'Sistem',
        icon: '⚙️',
        items: [
            { path: '/admin/rate-limits', label: 'Rate Limiting', icon: '🔒', requiredPermission: 'rate_limits' },
            { path: '/admin/email-queue', label: 'Email Kuyruk', icon: '📧', requiredPermission: 'email_queue' },
            { path: '/admin/scheduled-actions', label: 'Zamanlanmış', icon: '🗓️', requiredPermission: 'scheduled_actions' },
            { path: '/admin/uptime', label: 'Uptime & SLA', icon: '📊', requiredPermission: 'uptime' },
            { path: '/admin/system-info', label: 'Sistem Bilgisi', icon: '💾', requiredPermission: 'system_info' },
            { path: '/admin/feature-flags', label: 'Feature Flags', icon: '🚩', requiredPermission: 'feature_flags' },
        ],
    },
    {
        title: 'Araçlar',
        icon: '🔧',
        items: [
            { path: '/admin/import', label: 'CSV Import', icon: '📥', requiredPermission: 'import' },
            { path: '/admin/files', label: 'Dosya Yönetimi', icon: '📂', requiredPermission: 'files' },
            { path: '/admin/notifications', label: 'Bildirimler', icon: '🔔', requiredPermission: 'notifications' },
            { path: '/admin/settings', label: 'Ayarlar', icon: '⚙️', requiredPermission: 'settings' },
            { path: '/tours', label: 'Tüm Turlar (Site)', icon: '🌍' },
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

    // Auto-expand section containing the active route
    useEffect(() => {
        const currentPath = location.pathname;
        const newOpenSections: Record<string, boolean> = {};
        adminMenuSections.forEach(section => {
            const hasActiveItem = section.items.some(item => currentPath.startsWith(item.path));
            if (hasActiveItem) {
                newOpenSections[section.title] = true;
            }
        });
        // Always keep 'Ana' open
        newOpenSections['Ana'] = true;
        setOpenSections(prev => ({ ...prev, ...newOpenSections }));
    }, [location.pathname]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const toggleSection = (title: string) => {
        if (isCollapsed) return; // Don't toggle when collapsed
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
            {/* Mobile Toggle Button */}
            <button
                className="admin-sidebar-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle sidebar"
            >
                {isMobileOpen ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
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

            {/* Sidebar */}
            <motion.aside
                className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="admin-sidebar-header">
                    <Link to="/" className="admin-sidebar-logo">
                        <span className="admin-sidebar-logo-icon">🕋</span>
                        {!isCollapsed && <span className="admin-sidebar-logo-text">Admin Panel</span>}
                    </Link>
                    <button
                        className="admin-sidebar-collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="admin-sidebar-nav">
                    <ul className="admin-sidebar-menu">
                        {filteredSections.map((section) => (
                            <li key={section.title} className="admin-sidebar-section">
                                {/* Section Header */}
                                {!isCollapsed && section.title !== 'Ana' && (
                                    <button
                                        className="admin-sidebar-section-header"
                                        onClick={() => toggleSection(section.title)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            width: '100%', padding: '8px 16px', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                                            letterSpacing: '0.5px', color: '#6b7280',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{section.icon}</span>
                                            {section.title}
                                        </span>
                                        <span style={{
                                            transform: openSections[section.title] ? 'rotate(90deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s', fontSize: '10px',
                                        }}>
                                            ▶
                                        </span>
                                    </button>
                                )}

                                {/* Section Items */}
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
                                                                <span className="admin-sidebar-link-text">{item.label} ↗</span>
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

                {/* Footer */}
                <div className="admin-sidebar-footer">
                    <div className="admin-sidebar-user">
                        <span className="admin-sidebar-user-icon">👤</span>
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
                        {isCollapsed ? '🚪' : 'Çıkış'}
                    </button>
                </div>
            </motion.aside>
        </>
    );
});

export default AdminSidebar;
