import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Heart, Clock, Bell, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { useSEO } from '../../hooks/useSEO';

type TabType = 'favorites' | 'recent' | 'alarms';

export default function Profile() {
    useSEO({
        title: 'Profilim | Hac & Umre Turları',
        description: 'Favori turlarınızı, son baktıklarınızı ve alarmlarınızı yönetin.',
        noIndex: true,
    });

    const { user } = useAuth();
    const { favorites, removeFavorite } = useFavorites();
    const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
    const [activeTab, setActiveTab] = useState<TabType>('favorites');

    // Login gerekli
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: 'favorites', label: 'Favorilerim', icon: <Heart size={18} />, count: favorites.length },
        { key: 'recent', label: 'Son Bakılanlar', icon: <Clock size={18} />, count: recentlyViewed.length },
        { key: 'alarms', label: 'Alarmlar', icon: <Bell size={18} /> },
    ];

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    return (
        <motion.div
            className="profile-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}
        >
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <User size={28} color="var(--primary-teal)" />
                    Profilim
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                overflowX: 'auto'
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`btn btn-small ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                    <motion.div
                        key="favorites"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {favorites.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <Heart size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Henüz favori turunuz yok.
                                </p>
                                <Link to="/tours" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Turları İncele
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-1" style={{ gap: '1rem' }}>
                                {favorites.map((tourId) => (
                                    <div key={tourId} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Link
                                                    to={`/tours/${tourId}`}
                                                    style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                                                >
                                                    Tur #{tourId}
                                                </Link>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Link
                                                    to={`/tours/${tourId}`}
                                                    className="btn btn-outline btn-small"
                                                >
                                                    <ExternalLink size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => removeFavorite(tourId)}
                                                    className="btn btn-outline btn-small"
                                                    style={{ color: 'var(--error)' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Recently Viewed Tab */}
                {activeTab === 'recent' && (
                    <motion.div
                        key="recent"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {recentlyViewed.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Henüz hiçbir tura bakmadınız.
                                </p>
                                <Link to="/tours" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Turları İncele
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                    <button
                                        onClick={clearRecentlyViewed}
                                        className="btn btn-ghost btn-small"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Temizle
                                    </button>
                                </div>
                                <div className="grid grid-1" style={{ gap: '1rem' }}>
                                    {recentlyViewed.map((tour) => (
                                        <Link
                                            key={tour.id}
                                            to={`/tours/${tour.id}`}
                                            className="card"
                                            style={{
                                                padding: '1rem',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {tour.title}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {tour.operator}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary-emerald)' }}>
                                                {formatPrice(tour.price, tour.currency)}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Alarms Tab (Placeholder) */}
                {activeTab === 'alarms' && (
                    <motion.div
                        key="alarms"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                            <span className="badge" style={{ marginBottom: '1rem' }}>Yakında</span>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Tur alarmlarınız burada görünecek.
                            </p>
                            <Link to="/tours" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                                Turları İncele
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
