import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, X } from 'lucide-react';
import { reviewsApi } from '../api';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

interface ReviewFormProps {
    operatorName: string;
    tourId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

/**
 * ReviewForm - Firma değerlendirme formu
 * 1-5 yıldız rating + isteğe bağlı yorum
 */
export default function ReviewForm({ operatorName, tourId, onSuccess, onCancel }: ReviewFormProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.info('Değerlendirme için giriş yapmalısınız');
            return;
        }

        if (rating === 0) {
            toast.error('Lütfen bir puan seçin');
            return;
        }

        setLoading(true);
        try {
            await reviewsApi.create({
                operator_name: operatorName,
                rating,
                title: title || undefined,
                comment: comment || undefined,
                tour_id: tourId
            });

            toast.success('⭐ Değerlendirmeniz alındı! Onay sonrası yayınlanacak.', { duration: 3000 });
            onSuccess?.();
        } catch (error: any) {
            if (error.response?.data?.detail?.includes('zaten')) {
                toast.error('Bu firmayı zaten değerlendirdiniz');
            } else {
                toast.error('Değerlendirme gönderilemedi');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '1.5rem' }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    <strong>{operatorName}</strong> için değerlendirme
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={20} color="var(--text-secondary)" />
                    </button>
                )}
            </div>

            {/* Star Rating */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Puanınız *
                </label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                        >
                            <Star
                                size={32}
                                fill={(hoverRating || rating) >= star ? 'var(--accent-gold)' : 'transparent'}
                                color={(hoverRating || rating) >= star ? 'var(--accent-gold)' : 'var(--text-muted)'}
                                style={{ transition: 'all 0.2s ease' }}
                            />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Title (Optional) */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Başlık (opsiyonel)</label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Örn: Harika bir deneyimdi"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                />
            </div>

            {/* Comment (Optional) */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Yorumunuz (opsiyonel)</label>
                <textarea
                    className="form-input"
                    placeholder="Deneyiminizi paylaşın..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <motion.button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    disabled={loading || rating === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {loading ? 'Gönderiliyor...' : <><Send size={16} /> Gönder</>}
                </motion.button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textAlign: 'center' }}>
                Değerlendirmeniz onay sonrası yayınlanacaktır
            </p>
        </motion.form>
    );
}
