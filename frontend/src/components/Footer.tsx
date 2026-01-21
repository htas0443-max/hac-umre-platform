import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Award, Lock, Star, PhoneCall, FileText, Shield, HelpCircle } from 'lucide-react';

const Footer = memo(function Footer() {
  return (
    <motion.footer
      style={{
        background: 'var(--primary-emerald)',
        color: 'var(--neutral-white)',
        padding: '2.5rem 1rem 2rem',
        marginTop: '4rem',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Section - Contact & Trust */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          {/* Brand */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>
              🕋 Hac & Umre Platformu
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, lineHeight: 1.7 }}>
              Yapay zeka desteği ile en uygun Hac ve Umre turunu bulun. Güvenilir operatörlerle çalışın.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> İletişim</h3>
            <div style={{ fontSize: '0.875rem', lineHeight: 2 }}>
              <p>
                <a
                  href="tel:+905551234567"
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  <Phone size={14} style={{ marginRight: '0.25rem' }} /> +90 555 123 45 67
                </a>
              </p>
              <p>
                <a
                  href="https://wa.me/905551234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#25D366', textDecoration: 'none', fontWeight: 500 }}
                >
                  <MessageCircle size={14} style={{ marginRight: '0.25rem' }} /> WhatsApp ile Ulaşın
                </a>
              </p>
              <p>
                <a
                  href="mailto:info@hacveumreturlari.com"
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  <Mail size={14} style={{ marginRight: '0.25rem' }} /> info@hacveumreturlari.com
                </a>
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={16} /> Güven & Güvenlik</h3>
            <div style={{ fontSize: '0.875rem', lineHeight: 2 }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="var(--accent-gold)" /> TÜRSAB Üyesi
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={16} color="var(--accent-gold)" /> 1000+ Mutlu Müşteri
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhoneCall size={16} /> 7/24 Destek
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '1.5rem',
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            © 2026 Hac & Umre Platformu. Tüm hakları saklıdır.
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Geliştiren: <strong style={{ color: 'var(--accent-gold)' }}>Hamza Taş</strong>
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', textDecoration: 'none' }}>
              <FileText size={14} style={{ marginRight: '0.25rem' }} /> Kullanım Koşulları
            </Link>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', textDecoration: 'none' }}>
              <Lock size={14} style={{ marginRight: '0.25rem' }} /> Gizlilik Politikası
            </Link>
            <Link to="/support" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', textDecoration: 'none' }}>
              <HelpCircle size={14} style={{ marginRight: '0.25rem' }} /> Destek
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
});

export default Footer;

