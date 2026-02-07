import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { reviewsApi } from '../api';

interface OperatorRatingProps {
    operatorName: string;
    showCount?: boolean;
    size?: number;
}

interface ReviewData {
    average_rating: number;
    total: number;
}

/**
 * OperatorRating - Firma ortalama puanını gösterir
 * Küçük yıldız ikonu ve puan
 */
export default function OperatorRating({ operatorName, showCount = true, size = 16 }: OperatorRatingProps) {
    const [data, setData] = useState<ReviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRating();
    }, [operatorName]);

    const loadRating = async () => {
        try {
            const result = await reviewsApi.getByOperator(operatorName);
            setData(result);
        } catch (error) {
            console.error('Rating yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data || data.total === 0) {
        return null; // Henüz yorum yoksa gösterme
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: `${size * 0.75}px`
            }}
            title={`${data.total} değerlendirme`}
        >
            <Star
                size={size}
                fill="var(--accent-gold)"
                color="var(--accent-gold)"
            />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {data.average_rating}
            </span>
            {showCount && (
                <span style={{ color: 'var(--text-secondary)' }}>
                    ({data.total})
                </span>
            )}
        </motion.div>
    );
}
