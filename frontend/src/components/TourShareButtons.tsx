import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '../lib/analytics';

interface TourShareButtonsProps {
    tourId: string | number;
    tourTitle: string;
    source?: 'detail' | 'compare' | 'favorites';
}

/**
 * TourShareButtons - WhatsApp ve Link kopyalama butonları
 * Mobil öncelikli, conversion artırıcı
 */
export default function TourShareButtons({ tourId, tourTitle, source = 'detail' }: TourShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const getShareUrl = () => {
        return `${window.location.origin}/tours/${tourId}`;
    };

    const handleWhatsAppShare = () => {
        const url = getShareUrl();
        const text = `${tourTitle} - ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

        // Track analytics
        trackEvent({
            event: 'tour_share_whatsapp',
            tour_id: String(tourId),
            source
        });

        window.open(whatsappUrl, '_blank');
    };

    const handleCopyLink = async () => {
        const url = getShareUrl();

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);

            // Track analytics
            trackEvent({
                event: 'tour_share_copy_link',
                tour_id: String(tourId),
                source
            });

            toast.success('🔗 Bağlantı kopyalandı', { duration: 2000 });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Kopyalama başarısız');
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Bu turu paylaş:
            </span>

            {/* WhatsApp Button */}
            <motion.button
                onClick={handleWhatsAppShare}
                className="btn btn-small"
                style={{
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.75rem'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="WhatsApp ile paylaş"
                data-testid="share-whatsapp-btn"
            >
                <MessageCircle size={16} />
                <span className="hide-mobile">WhatsApp</span>
            </motion.button>

            {/* Copy Link Button */}
            <motion.button
                onClick={handleCopyLink}
                className="btn btn-outline btn-small"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.75rem'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Linki kopyala"
                data-testid="share-copy-link-btn"
            >
                {copied ? <Check size={16} color="var(--primary-emerald)" /> : <Link2 size={16} />}
                <span className="hide-mobile">{copied ? 'Kopyalandı' : 'Link'}</span>
            </motion.button>
        </div>
    );
}
