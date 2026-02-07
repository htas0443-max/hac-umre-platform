import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { priceAlertsApi } from '../api';
import { toast } from 'sonner';

interface PriceAlertButtonProps {
    tourId: number | string;
    isActive?: boolean;
    className?: string;
    size?: number;
    onToggle?: (isActive: boolean) => void;
}

/**
 * PriceAlertButton - Fiyat düşüşü bildirimi toggle
 * 🔔 Bildirim aç / 🔕 Bildirim kapat
 */
export default function PriceAlertButton({
    tourId,
    isActive: initialActive = false,
    className = '',
    size = 20,
    onToggle
}: PriceAlertButtonProps) {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(initialActive);
    const [isLoading, setIsLoading] = useState(false);

    const numericTourId = typeof tourId === 'string' ? parseInt(tourId, 10) : tourId;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Giriş yapmamış kullanıcılar için
        if (!user) {
            toast.info('Fiyat bildirimi için giriş yapmalısınız');
            return;
        }

        setIsLoading(true);
        try {
            const response = await priceAlertsApi.toggle(numericTourId);
            const newState = response.is_active;
            setIsActive(newState);

            if (newState) {
                toast.success('🔔 Fiyat bildirimi açıldı', { duration: 2000 });
            }
            // Kapatırken toast gösterme (kullanıcı deneyimi)

            onToggle?.(newState);
        } catch (error) {
            console.error('Fiyat bildirimi hatası:', error);
            toast.error('Bildirim güncellenemedi');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`price-alert-button ${isActive ? 'is-active' : ''} ${className}`}
            title={isActive ? 'Fiyat bildirimini kapat' : 'Fiyat düşerse haber ver'}
            aria-label={isActive ? 'Fiyat bildirimini kapat' : 'Fiyat düşerse haber ver'}
            disabled={isLoading}
            whileTap={{ scale: 0.9 }}
            animate={isLoading ? { opacity: 0.5 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: isLoading ? 'wait' : 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
            }}
            data-testid={`price-alert-btn-${tourId}`}
        >
            {isActive ? (
                <Bell
                    size={size}
                    fill="var(--primary-emerald)"
                    color="var(--primary-emerald)"
                    style={{ transition: 'all 0.2s ease' }}
                />
            ) : (
                <BellOff
                    size={size}
                    color="var(--text-secondary)"
                    style={{ transition: 'all 0.2s ease' }}
                />
            )}
        </motion.button>
    );
}
