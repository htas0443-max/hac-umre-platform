import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, XCircle, Clock, MessageSquare, Filter } from 'lucide-react';
import { reviewsApi } from '../api';
import { useSEO } from '../hooks/useSEO';
import { toast } from 'sonner';

interface Review {
    id: string;
    user_id: string;
    operator_name: string;
    rating: number;
    title: string | null;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function AdminReviewModeration() {
    useSEO({ title: 'Yorum Moderasyonu | Admin', noIndex: true });

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

    useEffect(() => {
        loadReviews();
    }, [filter]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const result = await reviewsApi.getAdminReviews(filter);
            setReviews(result.reviews);
        } catch (err) {
            toast.error('Yorumlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId: string) => {
        setProcessingId(reviewId);
        try {
            await reviewsApi.moderate(reviewId, 'approve');
            toast.success('✅ Yorum onaylandı');
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err) {
            toast.error('Onaylama başarısız');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (reviewId: string) => {
        setProcessingId(reviewId);
        try {
            await reviewsApi.moderate(reviewId, 'reject', rejectReason || undefined);
            toast.success('❌ Yorum reddedildi');
            setReviews(reviews.filter(r => r.id !== reviewId));
            setShowRejectModal(null);
            setRejectReason('');
        } catch (err) {
            toast.error('Reddetme başarısız');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}
        >
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MessageSquare size={28} color="var(--primary-teal)" />
                    Yorum Moderasyonu
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Kullanıcı yorumlarını onaylayın veya reddedin
                </p>
            </div>

            {/* Filter Buttons */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Filter size={18} color="var(--text-secondary)" />
                    {[
                        { value: 'pending', label: 'Bekleyen', icon: <Clock size={14} /> },
                        { value: 'approved', label: 'Onaylı', icon: <CheckCircle size={14} /> },
                        { value: 'rejected', label: 'Reddedilen', icon: <XCircle size={14} /> },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setFilter(item.value)}
                            className={filter === item.value ? 'btn btn-primary btn-small' : 'btn btn-outline btn-small'}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="loading">Yükleniyor...</div>
            )}

            {/* Empty State */}
            {!loading && reviews.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <CheckCircle size={48} color="var(--primary-emerald)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {filter === 'pending' ? 'Bekleyen yorum yok! 🎉' : 'Bu kategoride yorum yok.'}
                    </p>
                </div>
            )}

            {/* Reviews List */}
            <AnimatePresence>
                {reviews.map((review) => (
                    <motion.div
                        key={review.id}
                        className="card"
                        style={{ marginBottom: '1rem', padding: '1.5rem' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                    >
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{review.operator_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {formatDate(review.created_at)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={16}
                                        fill={review.rating >= star ? 'var(--accent-gold)' : 'transparent'}
                                        color={review.rating >= star ? 'var(--accent-gold)' : 'var(--text-muted)'}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        {review.title && (
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{review.title}</div>
                        )}
                        {review.comment && (
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                                {review.comment}
                            </div>
                        )}

                        {/* Actions (only for pending) */}
                        {filter === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowRejectModal(review.id)}
                                    className="btn btn-outline btn-small"
                                    style={{ color: 'var(--error)' }}
                                    disabled={processingId === review.id}
                                >
                                    <XCircle size={14} style={{ marginRight: '0.25rem' }} />
                                    Reddet
                                </button>
                                <button
                                    onClick={() => handleApprove(review.id)}
                                    className="btn btn-primary btn-small"
                                    disabled={processingId === review.id}
                                >
                                    <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                                    {processingId === review.id ? 'İşleniyor...' : 'Onayla'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => setShowRejectModal(null)}
                    >
                        <motion.div
                            className="card"
                            style={{ maxWidth: '400px', width: '100%', padding: '1.5rem' }}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ marginBottom: '1rem' }}>Yorumu Reddet</h3>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Red Nedeni (opsiyonel)</label>
                                <textarea
                                    className="form-input"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Örn: Uygunsuz içerik"
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowRejectModal(null)}
                                    className="btn btn-outline"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => handleReject(showRejectModal)}
                                    className="btn btn-primary"
                                    style={{ background: 'var(--error)' }}
                                    disabled={processingId === showRejectModal}
                                >
                                    {processingId === showRejectModal ? 'İşleniyor...' : 'Reddet'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
