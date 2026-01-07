import React from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      style={{
        background: 'var(--primary-emerald)',
        color: 'var(--neutral-white)',
        padding: '2rem 1rem',
        marginTop: '4rem',
        textAlign: 'center'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>
            🕋 Hac & Umre Tur Karşılaştırma Platformu
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Yapay zeka desteği ile en uygun turu bulun
          </p>
        </div>
        
        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
          paddingTop: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            © 2026 Hac & Umre Platformu. Tüm hakları saklıdır.
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Geliştiren: <strong style={{ color: 'var(--accent-gold)' }}>Hamza Taş</strong>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
