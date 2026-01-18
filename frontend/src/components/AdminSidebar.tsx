import { memo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

interface MenuItem {
    path: string;
    label: string;
    icon: string;
    badge?: number;
    children?: MenuItem[];
    roles?: string[];
}

const adminMenuItems: MenuItem[] = [
    {
        path: '/admin/dashboard',
        label: 'Dashboard',
        icon: '📊',
        roles: ['admin']
    },
    {
        path: '/admin/approval',
        label: 'Tur Onayları',
        icon: '✅',
        roles: ['admin']
    },
    {
        path: '/admin/import',
        label: 'CSV Import',
        icon: '📥',
        roles: ['admin']
    },
    {
        path: '/tours',
        label: 'Tüm Turlar',
        icon: '🌍',
        roles: ['admin', 'operator']
    },
];

const operatorMenuItems: MenuItem[] = [
    {
        path: '/operator/dashboard',
        label: 'Dashboard',
        icon: '🏢'
    },
    {
        path: '/operator/create',
        label: 'Yeni Tur',
        icon: '➕'
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

    const isAdmin = user?.role === 'admin';
    const isOperator = user?.role === 'operator';

    const menuItems = isAdmin ? adminMenuItems : isOperator ? operatorMenuItems : [];

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

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
                        {menuItems.map((item) => (
                            <li key={item.path} className="admin-sidebar-menu-item">
                                <Link
                                    to={item.path}
                                    className={`admin-sidebar-link ${isActive(item.path) ? 'active' : ''}`}
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
                                </Link>
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
                                <span className="admin-sidebar-user-role">
                                    {isAdmin ? 'Admin' : isOperator ? 'Operatör' : 'Kullanıcı'}
                                </span>
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
