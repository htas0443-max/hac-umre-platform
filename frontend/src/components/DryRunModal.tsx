import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';

interface DryRunImpact {
    affected_tours: number;
    affected_favorites: number;
    affected_reviews: number;
    tour_titles: string[];
}

interface DryRunResult {
    dry_run: boolean;
    user_id: string;
    target_email: string;
    target_role: string;
    impact: DryRunImpact;
    message: string;
}

interface DryRunModalProps {
    isOpen: boolean;
    result: DryRunResult | null;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    title?: string;
}

export default function DryRunModal({ isOpen, result, onConfirm, onCancel, loading = false, title = 'Etki Analizi' }: DryRunModalProps) {
    if (!result) return null;

    const { impact } = result;
    const hasImpact = impact.affected_tours > 0 || impact.affected_favorites > 0 || impact.affected_reviews > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-primary, #1a1a2e)',
                            border: '1px solid var(--border-color, #2d2d44)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '480px',
                            width: '90vw',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={22} color="#F59E0B" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
                            </div>
                            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* User info */}
                        <div style={{
                            background: 'var(--bg-secondary, #16213e)',
                            borderRadius: '10px', padding: '0.875rem', marginBottom: '1rem',
                            border: '1px solid var(--border-color, #2d2d44)',
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                Hedef Kullanıcı
                            </div>
                            <div style={{ fontWeight: 600 }}>{result.target_email}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                Rol: {result.target_role}
                            </div>
                        </div>

                        {/* Impact grid */}
                        {hasImpact ? (
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
                                marginBottom: '1rem',
                            }}>
                                <ImpactCard label="Turlar" count={impact.affected_tours} icon="🗺️" color="#EF4444" />
                                <ImpactCard label="Favoriler" count={impact.affected_favorites} icon="⭐" color="#F59E0B" />
                                <ImpactCard label="Yorumlar" count={impact.affected_reviews} icon="💬" color="#3B82F6" />
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '1rem', marginBottom: '1rem',
                                color: 'var(--text-secondary)', fontSize: '0.9rem',
                            }}>
                                Bu kullanıcının etkilenecek kaydı bulunmuyor.
                            </div>
                        )}

                        {/* Tour titles */}
                        {impact.tour_titles.length > 0 && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)', borderRadius: '8px',
                                padding: '0.75rem', marginBottom: '1rem',
                                border: '1px solid rgba(239,68,68,0.2)',
                                fontSize: '0.8rem',
                            }}>
                                <div style={{ fontWeight: 600, color: '#EF4444', marginBottom: '0.375rem' }}>
                                    Etkilenecek Turlar:
                                </div>
                                {impact.tour_titles.map((t, i) => (
                                    <div key={i} style={{ color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>
                                        • {t}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Warning */}
                        <div style={{
                            background: 'rgba(245,158,11,0.1)', borderRadius: '8px',
                            padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem',
                            border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B',
                        }}>
                            ⚠️ Bu işlem geri alınabilir. Kullanıcıyı daha sonra "Aktifleştir" ile geri açabilirsiniz.
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={onCancel}
                                className="btn btn-outline"
                                style={{ fontSize: '0.85rem' }}
                            >
                                İptal
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                disabled={loading}
                                className="btn btn-primary"
                                style={{
                                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                                    background: '#EF4444', opacity: loading ? 0.6 : 1,
                                }}
                            >
                                <Check size={14} />
                                {loading ? 'Uygulanıyor...' : 'Onayla ve Uygula'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


function ImpactCard({ label, count, icon, color }: { label: string; count: number; icon: string; color: string }) {
    return (
        <div style={{
            background: `${color}10`, borderRadius: '10px', padding: '0.75rem',
            textAlign: 'center', border: `1px solid ${color}25`,
        }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</div>
        </div>
    );
}
