import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Building, ChevronRight } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

/**
 * RecentlyViewed - Son bakılan turlar bileşeni
 * Anasayfa veya tour list'in altında gösterilebilir
 */
export default function RecentlyViewed() {
    const { recentlyViewed, count } = useRecentlyViewed();

    if (count === 0) return null;

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency || 'TRY',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <section className="recently-viewed-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                    fontSize: '1.25rem'
                }}>
                    <Clock size={20} color="var(--primary-teal)" />
                    Son Baktıklarınız
                </h3>
            </div>

            <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollSnapType: 'x mandatory'
            }}>
                {recentlyViewed.slice(0, 5).map((tour, index) => (
                    <motion.div
                        key={tour.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <Link
                            to={`/tours/${tour.id}`}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                minWidth: '200px',
                                maxWidth: '200px',
                                padding: '1rem',
                                textDecoration: 'none',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            data-testid={`recently-viewed-${tour.id}`}
                        >
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {tour.title}
                            </div>

                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <Building size={12} />
                                {tour.operator}
                            </div>

                            <div style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--primary-emerald)',
                                marginTop: 'auto'
                            }}>
                                {formatPrice(tour.price, tour.currency)}
                            </div>

                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--primary-teal)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                Detayları Gör <ChevronRight size={14} />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
