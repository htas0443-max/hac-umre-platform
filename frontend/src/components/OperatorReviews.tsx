import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { reviewsApi } from '../api';

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    helpful_count: number;
}

interface OperatorReviewsData {
    operator_name: string;
    reviews: Review[];
    total: number;
    average_rating: number;
    status_counts: {
        approved: number;
        pending: number;
        rejected: number;
    };
}

/**
 * OperatorReviews - Operatörün kendi firmasına ait yorumları görüntülemesi
 */
export default function OperatorReviews() {
    const [data, setData] = useState<OperatorReviewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const result = await reviewsApi.getOperatorReviews();
            setData(result);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Yorumlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const statusConfig = {
        approved: { label: 'Onaylı', color: 'var(--primary-emerald)', icon: <CheckCircle size={14} /> },
        pending: { label: 'Beklemede', color: 'var(--warning)', icon: <Clock size={14} /> },
        rejected: { label: 'Reddedildi', color: 'var(--error)', icon: <XCircle size={14} /> }
    };

    if (loading) {
        return <div className="loading">Yorumlar yükleniyor...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!data) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header with Stats */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <MessageSquare size={24} color="var(--primary-teal)" />
                    Firma Değerlendirmeleri
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    {data.operator_name} için müşteri yorumları
                </p>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            <Star size={20} fill="var(--accent-gold)" color="var(--accent-gold)" />
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.average_rating || '-'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ortalama Puan</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-emerald)' }}>
                            {data.status_counts.approved}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Onaylı</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                            {data.status_counts.pending}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Beklemede</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.total}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toplam</div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {data.reviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Star size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Henüz değerlendirme yok.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {data.reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            className="card"
                            style={{ padding: '1rem' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {/* Stars */}
                                    <div style={{ display: 'flex', gap: '0.1rem' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                fill={review.rating >= star ? 'var(--accent-gold)' : 'transparent'}
                                                color={review.rating >= star ? 'var(--accent-gold)' : 'var(--text-muted)'}
                                            />
                                        ))}
                                    </div>
                                    {/* Status Badge */}
                                    <span
                                        className="badge"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            background: statusConfig[review.status].color,
                                            color: 'white',
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        {statusConfig[review.status].icon}
                                        {statusConfig[review.status].label}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {formatDate(review.created_at)}
                                </span>
                            </div>

                            {review.title && (
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                    {review.title}
                                </div>
                            )}

                            {review.comment && (
                                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {review.comment}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
