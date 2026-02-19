import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string | React.ReactNode;
    path?: string;
}

const routeLabels: Record<string, string> = {
    '': 'Ana Sayfa',
    'tours': 'Turlar',
    'compare': 'Karşılaştır',
    'chat': 'Hac Rehberi',
    'admin': 'Admin',
    'import': 'CSV Import',
    'approval': 'Onay Yönetimi',
    'dashboard': 'Dashboard',
    'operator': 'Operatör',
    'create': 'Yeni Tur',
    'edit': 'Düzenle',
    'support': 'Destek',
    'tickets': 'Taleplerim',
    'favorites': 'Favoriler',
    'profile': 'Profilim',
    'terms': 'Kullanım Şartları',
    'privacy': 'Gizlilik Politikası',
    'trust-faq': 'Güven SSS',
    'verification': 'Doğrulama',
};

const Breadcrumb = memo(function Breadcrumb() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    // Don't show on home page
    if (pathnames.length === 0) {
        return null;
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { label: <Home size={14} />, path: '/' }
    ];

    pathnames.forEach((segment, index) => {
        const path = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = routeLabels[segment] || segment;

        // Skip ID segments (MongoDB ObjectIds)
        if (segment.length === 24 && /^[a-f0-9]+$/i.test(segment)) {
            breadcrumbs.push({ label: 'Detay', path });
        } else {
            breadcrumbs.push({ label, path });
        }
    });

    return (
        <nav className="breadcrumb" aria-label="Breadcrumb" data-testid="breadcrumb">
            <ol className="breadcrumb-list">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={index} className="breadcrumb-item">
                            {!isLast && item.path ? (
                                <>
                                    <Link to={item.path} className="breadcrumb-link">
                                        {item.label}
                                    </Link>
                                    <span className="breadcrumb-separator">/</span>
                                </>
                            ) : (
                                <span className="breadcrumb-current">{item.label}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
});

export default Breadcrumb;
