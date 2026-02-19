import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Globe } from 'lucide-react';
import { toursApi } from '../api';
import type { Tour } from '../types';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Debounced search
    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 2) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await toursApi.getAll({ limit: 8, operator: value.trim() });
                // getAll returns array directly or might have a tours property
                const toursList = Array.isArray(data) ? data : (data as any).tours || [];
                // Client-side filter: match title, operator, or hotel
                const q = value.trim().toLowerCase();
                const filtered = toursList.filter((t: Tour) =>
                    t.title.toLowerCase().includes(q) ||
                    t.operator.toLowerCase().includes(q) ||
                    (t.hotel && t.hotel.toLowerCase().includes(q))
                );
                setResults(filtered.slice(0, 8));
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency,
        }).format(price);
    };

    const handleResultClick = (tourId: string) => {
        onClose();
        navigate(`/tours/${tourId}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="search-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <motion.div
                    className="search-overlay-container"
                    initial={{ opacity: 0, y: -30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    {/* Search Input */}
                    <div className="search-overlay-input-wrapper">
                        <Search size={20} className="search-overlay-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-overlay-input"
                            placeholder="Tur, firma veya şehir ara..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            data-testid="search-overlay-input"
                        />
                        <button className="search-overlay-close" onClick={onClose} aria-label="Aramayı kapat">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Results */}
                    {(results.length > 0 || loading || query.length >= 2) && (
                        <div className="search-overlay-results">
                            {loading && (
                                <div className="search-overlay-empty">Aranıyor...</div>
                            )}
                            {!loading && results.length === 0 && query.length >= 2 && (
                                <div className="search-overlay-empty">
                                    <Globe size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                                    <div>"{query}" için sonuç bulunamadı</div>
                                </div>
                            )}
                            {!loading && results.map((tour) => (
                                <button
                                    key={tour._id}
                                    className="search-result-item"
                                    onClick={() => handleResultClick(tour._id)}
                                    data-testid={`search-result-${tour._id}`}
                                    style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <div>
                                        <div className="search-result-title">{tour.title}</div>
                                        <div className="search-result-meta">{tour.operator} · {tour.duration}</div>
                                    </div>
                                    <div className="search-result-price">
                                        {formatPrice(tour.price, tour.currency)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {query.length < 2 && results.length === 0 && (
                        <div className="search-overlay-hint">
                            En az 2 karakter yazarak arama yapın
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
