import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, CheckCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import PageMeta from '../components/PageMeta';

const TRUST_FAQ = [
    {
        q: 'Tur ile ilgili işlemler kim tarafından yapılır?',
        a: 'Rezervasyon, ödeme, iptal, vize, uçuş, sağlık şartları ve fatura işlemleri platform tarafından değil, ilanı yayınlayan firma tarafından yürütülür. Platform, firmalar ile kullanıcıları buluşturan bir ilan platformudur. Detaylı ve güncel bilgi için ilgili firma ile doğrudan iletişime geçmeniz gerekir.'
    },
];

export default function TrustFaqPage() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

    return (
        <>
            <PageMeta
                title="Güven ve Doğrulama SSS"
                description="Hac ve Umre platformunda firmalar ve ilanların nasıl doğrulandığı hakkında sık sorulan sorular."
            />
            <motion.div
                style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Back Link */}
                <Link
                    to="/support"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--primary-teal)',
                        textDecoration: 'none',
                        marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={16} />
                    Destek Sayfasına Dön
                </Link>

                <div className="card" style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <Shield size={32} color="var(--primary-teal)" />
                        <div>
                            <h1 style={{ margin: 0, color: 'var(--primary-teal)', fontSize: '1.5rem' }}>
                                Güven ve Doğrulama
                            </h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Platform Hakkında
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(13, 148, 136, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <CheckCircle size={20} color="var(--primary-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Platformumuzda yer alan tüm tur şirketleri, belge kontrolünden geçerek onaylanmıştır.
                            Detaylı bilgi için <Link to="/verification" style={{ color: 'var(--primary-teal)' }}>doğrulama sürecimizi</Link> inceleyebilirsiniz.
                        </p>
                    </div>

                    {/* FAQ List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {TRUST_FAQ.map((item, idx) => (
                            <motion.div
                                key={idx}
                                className="card"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    border: expandedFaq === idx ? '1px solid var(--primary-teal)' : '1px solid var(--border-color)'
                                }}
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '1rem',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span style={{
                                        fontWeight: 500,
                                        color: 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <HelpCircle size={16} color="var(--primary-teal)" aria-hidden="true" />
                                        {item.q}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: expandedFaq === idx ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown size={18} color="var(--text-secondary)" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {expandedFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{
                                                padding: '0 1rem 1rem',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.7,
                                                borderTop: '1px solid var(--border-color)',
                                                paddingTop: '1rem'
                                            }}>
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer Link */}
                    <div style={{
                        marginTop: '2rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            Başka sorularınız mı var?{' '}
                            <Link to="/support" style={{ color: 'var(--primary-teal)' }}>
                                Destek ekibimize ulaşın
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
