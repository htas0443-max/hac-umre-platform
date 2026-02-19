import { motion } from 'framer-motion';

export default function PageLoading() {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ textAlign: 'center' }}
            >
                {/* Spinner */}
                <motion.div
                    style={{
                        width: 48,
                        height: 48,
                        border: '3px solid var(--border-color)',
                        borderTopColor: 'var(--primary-teal)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />

                {/* Pulse text */}
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                    }}
                >
                    Yükleniyor...
                </motion.div>
            </motion.div>
        </div>
    );
}
