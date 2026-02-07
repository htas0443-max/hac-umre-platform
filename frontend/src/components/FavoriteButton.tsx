import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../AuthContext';
import { trackFavorite } from '../lib/analytics';

interface FavoriteButtonProps {
    tourId: number | string;
    className?: string;
    size?: number;
    source?: 'tour_card' | 'tour_detail' | 'favorites_page';
}

/**
 * FavoriteButton - Kalp ikonu ile favori toggle
 * 🤍 Favorilere ekle / ❤️ Favorilerden çıkar
 * NOT: Sepet veya rezervasyon DEĞİL, sadece niyet göstergesi
 */
export default function FavoriteButton({
    tourId,
    className = '',
    size = 24,
    source = 'tour_card'
}: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { user } = useAuth();
    const [isAnimating, setIsAnimating] = useState(false);

    // tour_id'yi number'a çevir
    const numericTourId = typeof tourId === 'string' ? parseInt(tourId, 10) : tourId;
    const isFav = isFavorite(numericTourId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const wasInFavorites = isFav;

        setIsAnimating(true);
        await toggleFavorite(numericTourId);

        // Analytics tracking
        trackFavorite(
            wasInFavorites ? 'removed' : 'added',
            numericTourId,
            source,
            !!user
        );

        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`favorite-button ${isFav ? 'is-favorite' : ''} ${className}`}
            title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            whileTap={{ scale: 0.9 }}
            animate={isAnimating && !isFav ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.2 }}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
            }}
            data-testid={`favorite-btn-${tourId}`}
        >
            <Heart
                size={size}
                fill={isFav ? '#ef4444' : 'none'}
                color={isFav ? '#ef4444' : 'var(--text-secondary)'}
                style={{
                    transition: 'all 0.2s ease',
                }}
            />
        </motion.button>
    );
}

