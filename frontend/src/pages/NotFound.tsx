import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, Globe, MessageSquare } from 'lucide-react';

export default function NotFound() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            {/* 404 Icon */}
            <motion.div
                style={{ fontSize: '6rem', marginBottom: '1rem' }}
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
                <Search size={96} color="var(--primary-teal)" />
            </motion.div>

            {/* Error Code */}
            <h1 style={{
                fontSize: '5rem',
                fontWeight: 700,
                color: 'var(--primary-teal)',
                marginBottom: '0.5rem',
                lineHeight: 1
            }}>
                404
            </h1>

            {/* Message */}
            <h2 style={{
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
            }}>
                Sayfa Bulunamadı
            </h2>

            <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                maxWidth: '400px',
                lineHeight: 1.7
            }}>
                Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                Ana sayfaya dönerek devam edebilirsiniz.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    to="/"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                >
                    <Home size={18} style={{ marginRight: '0.5rem' }} /> Ana Sayfaya Dön
                </Link>
                <Link
                    to="/tours"
                    className="btn btn-outline"
                    style={{ textDecoration: 'none' }}
                >
                    <Globe size={18} style={{ marginRight: '0.5rem' }} /> Turları Görüntüle
                </Link>
            </div>

            {/* Decorative Element */}
            <div style={{
                marginTop: '3rem',
                padding: '1rem 2rem',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
            }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <MessageSquare size={16} style={{ marginRight: '0.25rem' }} /> Yardıma mı ihtiyacınız var?{' '}
                    <Link to="/chat" style={{ color: 'var(--primary-teal)' }}>
                        Hac Rehberi ile konuşun
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
