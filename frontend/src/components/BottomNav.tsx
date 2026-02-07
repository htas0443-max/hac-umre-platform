import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Globe, RefreshCw, BookOpen, type LucideIcon } from 'lucide-react';

interface NavItem {
    path: string;
    IconComponent: LucideIcon;
    label: string;
}

const navItems: NavItem[] = [
    { path: '/', IconComponent: Home, label: 'Ana Sayfa' },
    { path: '/tours', IconComponent: Globe, label: 'Turlar' },
    { path: '/compare', IconComponent: RefreshCw, label: 'Karşılaştır' },
    { path: '/chat', IconComponent: BookOpen, label: 'Rehber' },
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <motion.nav
            className="bottom-nav"
            role="navigation"
            aria-label="Alt gezinme menüsü"
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
                            <span className="bottom-nav-icon"><item.IconComponent size={20} aria-hidden="true" /></span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </motion.nav>
    );
}
