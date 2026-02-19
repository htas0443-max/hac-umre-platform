import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Building, FileText, MessageCircle } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';
import { useFavorites } from '../../hooks/useFavorites';
import { favoritesApi } from '../../api';
import { useAuth } from '../../AuthContext';
import FavoriteButton from '../../components/FavoriteButton';
import PriceAlertButton from '../../components/PriceAlertButton';
import { trackFavoriteToContact } from '../../lib/analytics';

interface FavoriteTour {
    favorite_id: number;
    tour_id: number;
    added_at: string;
    tour: {
        id: number;
        title: string;
        operator: string;
        price: number;
        currency: string;
        duration: string;
        hotel: string;
        services: string[];
        start_date: string;
        end_date: string;
        is_verified?: boolean;
        operator_phone?: string;
    };
}

export default function Favorites() {
    useSEO({
        title: 'Favorilerim | Hac ve Umre Turları',
        description: 'Favori turlarınızı görüntüleyin ve karşılaştırın.',
        noIndex: true, // Favoriler kişisel sayfa, indekslenmemeli
    });

    const { user } = useAuth();
    const { favorites: localFavorites, loading: hookLoading } = useFavorites();
    const [favorites, setFavorites] = useState<FavoriteTour[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFavorites();
    }, [user, localFavorites]);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            if (user) {
                // Giriş yapmış: API'den yükle
                const response = await favoritesApi.getAll();
                setFavorites(response.favorites || []);
            } else {
                // Giriş yapmamış: Sadece ID'ler var, detay çekemeyiz
                // localStorage favori ID'lerini göster (basit liste)
                setFavorites([]);
            }
            setError('');
        } catch (err) {
            console.error('Favoriler yüklenemedi:', err);
            setError('Favoriler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    if (loading || hookLoading) {
        return (
            <div className="favorites-page" data-testid="favorites-loading">
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={28} color="var(--primary-teal)" /> Favorilerim
                </h1>
                <div className="grid grid-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card" style={{ height: '200px' }}>
                            <div className="skeleton" style={{ height: '30px', marginBottom: '1rem' }} />
                            <div className="skeleton" style={{ height: '50px', marginBottom: '1rem' }} />
                            <div className="skeleton" style={{ height: '40px' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Giriş yapmamış kullanıcılar için mesaj
    if (!user && localFavorites.length > 0) {
        return (
            <motion.div
                className="favorites-page"
                data-testid="favorites-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={28} color="var(--primary-teal)" /> Favorilerim
                </h1>

                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <Heart size={64} color="var(--primary-teal)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '1rem' }}>
                        {localFavorites.length} tur favorilerinizde
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Favori turlarınızın detaylarını görmek için giriş yapın.
                        Giriş yaptığınızda favorileriniz hesabınıza aktarılacaktır.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/login" className="btn btn-primary">
                            Giriş Yap
                        </Link>
                        <Link to="/tours" className="btn btn-outline">
                            Turlara Dön
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Boş durum
    if (favorites.length === 0 && localFavorites.length === 0) {
        return (
            <motion.div
                className="favorites-page"
                data-testid="favorites-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={28} color="var(--primary-teal)" /> Favorilerim
                </h1>

                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Heart size={64} color="var(--text-muted)" style={{ marginBottom: '1.5rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                        Henüz favorin yok. Beğendiğin turları kalp ikonuna dokunarak ekleyebilirsin.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="favorites-page"
            data-testid="favorites-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                style={{ marginBottom: '2rem' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={28} color="var(--primary-teal)" /> Favorilerim
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                    {favorites.length} tur favorilerinizde
                </p>
            </motion.div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
                    {error}
                </div>
            )}

            <motion.div className="grid grid-2">
                <AnimatePresence mode="popLayout">
                    {favorites.map((fav, index) => (
                        <motion.div
                            key={fav.favorite_id}
                            className="card hover-lift"
                            data-testid={`favorite-card-${fav.tour_id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '0.5rem' }}>{fav.tour.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Building size={16} /> {fav.tour.operator}
                                    </p>
                                </div>
                                <FavoriteButton tourId={fav.tour_id} size={22} source="favorites_page" />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{
                                        fontSize: '1.75rem',
                                        fontWeight: 700,
                                        color: 'var(--primary-emerald)'
                                    }}>
                                        {formatPrice(fav.tour.price, fav.tour.currency)}
                                    </span>
                                    <PriceAlertButton tourId={fav.tour_id} size={20} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-primary">{fav.tour.duration}</span>
                                    <span className="badge badge-gold">{fav.tour.start_date}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <Link
                                    to={`/tours/${fav.tour_id}`}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    data-testid={`favorite-view-${fav.tour_id}`}
                                >
                                    <FileText size={16} style={{ marginRight: '0.25rem' }} /> İlana Git
                                </Link>
                                <a
                                    href={fav.tour.operator_phone
                                        ? `https://wa.me/${fav.tour.operator_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, ${fav.tour.title} hakkında bilgi almak istiyorum.`)}`
                                        : `https://wa.me/905551234567?text=${encodeURIComponent(`Merhaba, ${fav.tour.title} hakkında bilgi almak istiyorum.`)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                    onClick={() => trackFavoriteToContact(fav.tour_id, 'favorites_page', !!user)}
                                >
                                    <MessageCircle size={16} style={{ marginRight: '0.25rem' }} /> İletişim
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
