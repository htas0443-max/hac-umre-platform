import { useState, useRef, useEffect } from 'react';
import { BadgeCheck, Info } from 'lucide-react';

interface VerifiedBadgeProps {
    isVerified?: boolean;
    className?: string;
}

/**
 * Verified company badge with tooltip
 * Shows "Doğrulanmış" text with BadgeCheck icon
 * Tooltip appears on click/tap with verification details
 */
export default function VerifiedBadge({ isVerified, className = '' }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const badgeRef = useRef<HTMLButtonElement>(null);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                tooltipRef.current &&
                badgeRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                !badgeRef.current.contains(event.target as Node)
            ) {
                setShowTooltip(false);
            }
        };

        if (showTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTooltip]);

    // Don't render if not verified
    if (!isVerified) {
        return null;
    }

    return (
        <div className={`verified-badge-container ${className}`}>
            <button
                ref={badgeRef}
                type="button"
                className="verified-badge"
                onClick={() => setShowTooltip(!showTooltip)}
                aria-label="Doğrulanmış firma bilgisi"
                aria-expanded={showTooltip}
            >
                <BadgeCheck size={16} aria-hidden="true" />
                <span>Doğrulanmış</span>
                <Info size={14} className="verified-badge-info" aria-hidden="true" />
            </button>

            {showTooltip && (
                <div
                    ref={tooltipRef}
                    className="verified-tooltip"
                    role="tooltip"
                >
                    TURSAB belgeli, doğrulanmış firma
                </div>
            )}
        </div>
    );
}
