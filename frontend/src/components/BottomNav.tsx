import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
    path: string;
    icon: string;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/', icon: '🏠', label: 'Ana Sayfa' },
    { path: '/tours', icon: '🌍', label: 'Turlar' },
    { path: '/compare', icon: '🔄', label: 'Karşılaştır' },
    { path: '/chat', icon: '🕋', label: 'Rehber' },
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <motion.nav
            className="bottom-nav"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <div className="bottom-nav-content">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className="bottom-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </motion.nav>
    );
}
