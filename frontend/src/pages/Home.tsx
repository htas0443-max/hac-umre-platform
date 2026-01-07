import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="home-page"
      data-testid="home-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section with Islamic Motifs */}
      <motion.section
        className="hero"
        variants={itemVariants}
        style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          marginBottom: '3rem',
          position: 'relative',
          background: 'linear-gradient(180deg, #f8f6f0 0%, #ffffff 100%)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}
      >
        {/* Islamic Geometric Pattern Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%230D9488' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
          pointerEvents: 'none'
        }} />

        {/* Kaaba Icon */}
        <motion.div
          style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🕋
        </motion.div>

        {/* Crescent Moon Decoration */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '40px',
          fontSize: '2rem',
          opacity: 0.3,
          color: 'var(--accent-gold)'
        }}>
          ☪️
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          color: 'var(--primary-teal)',
          fontWeight: 700
        }}>
          Hac ve Umre Turları
        </h1>

        {/* Arabic Bismillah */}
        <p style={{
          fontSize: '1.5rem',
          color: 'var(--accent-gold)',
          marginBottom: '1rem',
          fontFamily: 'serif'
        }}>
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          margin: '0 auto 2rem',
          lineHeight: 1.7
        }}>
          Yapay zeka desteği ile en uygun Hac ve Umre turunu bulun. Turları detaylı
          karşılaştırın, AI chatbot ile sorularınıza cevap alın. <strong>Tur şirketleri de kendi ilanlarını
            ekleyebilir!</strong>
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!user ? (
            <>
              <Link to="/tours" className="btn btn-primary" data-testid="hero-tours-btn">
                🕌 Turları Görüntüle
              </Link>
              <Link to="/register" className="btn btn-secondary" data-testid="hero-register-btn">
                Kayıt Ol
              </Link>
            </>
          ) : (
            <Link
              to={user.role === 'operator' ? '/operator/dashboard' : '/tours'}
              className="btn btn-primary"
              data-testid="hero-tours-btn"
            >
              {user.role === 'operator' ? 'Dashboard\'a Git' : '🕌 Turları Görüntüle'}
            </Link>
          )}
        </div>

        {/* Decorative Islamic Border */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, var(--accent-gold), var(--primary-teal), var(--accent-gold), transparent)'
        }} />
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="features"
        style={{ marginBottom: '3rem' }}
        variants={itemVariants}
      >
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'var(--primary-teal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ color: 'var(--accent-gold)' }}>☆</span>
          Özellikler
          <span style={{ color: 'var(--accent-gold)' }}>☆</span>
        </h2>
        <div className="grid grid-4">
          {/* AI Karşılaştırma */}
          <motion.div
            className="card islamic-card"
            data-testid="feature-compare"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="feature-icon">🔄</div>
            <h3>AI Karşılaştırma</h3>
            <p>Yapay zeka ile turları detaylı karşılaştırın.</p>
          </motion.div>

          {/* AI Chatbot */}
          <motion.div
            className="card islamic-card"
            data-testid="feature-chat"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="feature-icon">🤖</div>
            <h3>AI Chatbot</h3>
            <p>Hac ve Umre ile ilgili sorularınıza AI ile cevap alın.</p>
          </motion.div>

          {/* Detaylı Filtreleme */}
          <motion.div
            className="card islamic-card"
            data-testid="feature-filter"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="feature-icon">🔍</div>
            <h3>Detaylı Filtreleme</h3>
            <p>Fiyat, tarih, operatör ve daha fazla kritere göre filtreleyin.</p>
          </motion.div>

          {/* Tur Şirketi İlanları */}
          <motion.div
            className="card islamic-card"
            data-testid="feature-operator"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="feature-icon">🏢</div>
            <h3>Tur Şirketi İlanları</h3>
            <p>Tur şirketleri kendi ilanlarını ekleyebilir.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* For Tour Companies Section */}
      {!user && (
        <motion.section
          className="for-operators"
          style={{ marginBottom: '3rem' }}
          variants={itemVariants}
        >
          <h2 style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: 'var(--primary-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            🕌 Tur Şirketleri İçin
          </h2>
          <div className="grid grid-2">
            <div className="card islamic-card">
              <h3>📣 İlan Verin</h3>
              <p>Tur ilanlarınızı kolayca oluşturun ve yayınlayın.</p>
              <Link to="/operator/register" className="btn btn-secondary btn-small" style={{ marginTop: '1rem' }}>
                Şimdi Başlayın
              </Link>
            </div>
            <div className="card islamic-card">
              <h3>📊 Yönetin</h3>
              <p>Turlarınızı tek bir panelden yönetin.</p>
              <Link to="/login" className="btn btn-primary btn-small" style={{ marginTop: '1rem' }}>
                Giriş Yapın
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Footer Decoration */}
      <div style={{
        textAlign: 'center',
        padding: '1rem',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <span style={{ color: 'var(--accent-gold)' }}>☆</span>
        {' '}Hayırlı yolculuklar dileriz{' '}
        <span style={{ color: 'var(--accent-gold)' }}>☆</span>
      </div>
    </motion.div>
  );
}
