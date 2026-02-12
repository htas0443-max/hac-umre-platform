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

const adminMenuItems: MenuItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', requiredPermission: 'dashboard' },
    { path: '/admin/approval', label: 'Tur Onayları', icon: '✅', requiredPermission: 'approval' },
    { path: '/admin/add-tour', label: 'Yeni Tur Ekle', icon: '➕', requiredPermission: 'tours.create' },
    { path: '/admin/users', label: 'Kullanıcılar', icon: '👥', requiredPermission: 'users' },
    { path: '/admin/verification', label: 'Operatör Doğrulama', icon: '🛡️', requiredPermission: 'verification' },
    { path: '/admin/reviews', label: 'Yorumlar', icon: '⭐', requiredPermission: 'reviews' },
    { path: '/admin/tickets', label: 'Destek Biletleri', icon: '🎫', requiredPermission: 'tickets' },
    { path: '/admin/notifications', label: 'Bildirimler', icon: '🔔', requiredPermission: 'notifications' },
    { path: '/admin/reports', label: 'Raporlar', icon: '📋', requiredPermission: 'reports' },
    { path: '/admin/import', label: 'CSV Import', icon: '📥', requiredPermission: 'import' },
    { path: '/admin/audit', label: 'Audit Log', icon: '🛡️', requiredPermission: 'audit' },
    { path: '/admin/analytics', label: 'Ajanta Analytics', icon: '📈', requiredPermission: 'analytics' },
    { path: '/admin/files', label: 'Dosya Yönetimi', icon: '📂', requiredPermission: 'files' },
    { path: '/admin/settings', label: 'Ayarlar', icon: '⚙️', requiredPermission: 'settings' },
    { path: '/admin/cms', label: 'CMS', icon: '📝', requiredPermission: 'cms' },
    { path: '/tours', label: 'Tüm Turlar (Site)', icon: '🌍' },
];

interface AdminSidebarProps {
    pendingCount?: number;
}

const AdminSidebar = memo(function AdminSidebar({ pendingCount = 0 }: AdminSidebarProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const sidebarVariants = {
        expanded: { width: 260 },
        collapsed: { width: 72 }
    };

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
                        {adminMenuItems
                            .filter(item => !item.requiredPermission || hasPermission(user?.role as any, item.requiredPermission))
                            .map((item) => (
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
