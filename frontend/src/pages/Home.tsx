import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Lock, RefreshCw, MessageSquare, Search, Building, Megaphone, KeyRound, BarChart3, Plus, Sparkles, CheckCircle, FileText, HeadphonesIcon } from 'lucide-react';
import PageMeta from '../components/PageMeta';

// Create MotionLink for proper Framer Motion + React Router integration
const MotionLink = motion(Link);

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
    <>
      <PageMeta
        title="Ana Sayfa"
        description="Yapay zeka desteği ile en uygun Hac ve Umre turunu bulun. Turları karşılaştırın, fiyatları inceleyin."
      />
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
            color: 'var(--accent-gold)',
            pointerEvents: 'none'
          }}>
            ☪️
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: 'var(--primary-teal)',
            fontWeight: 700,
            position: 'relative',
            zIndex: 1
          }}>
            Hac & Umre Turlarını Güvenle Keşfedin
          </h1>

          {/* Arabic Bismillah */}
          <p style={{
            fontSize: '1.5rem',
            color: 'var(--accent-gold)',
            marginBottom: '1rem',
            fontFamily: 'serif',
            position: 'relative',
            zIndex: 1
          }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 2rem',
            lineHeight: 1.7,
            position: 'relative',
            zIndex: 1
          }}>
            Belge kontrolünden geçen tur şirketleri arasından size uygun turu bulun.
            Fiyatları ve hizmetleri yan yana karşılaştırın.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 10 }}>
            <MotionLink
              to="/tours"
              className="btn btn-primary"
              data-testid="hero-tours-btn"
              style={{ textDecoration: 'none', fontSize: '1.1rem', padding: '0.875rem 2rem' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Turları İncele
            </MotionLink>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ✓ Sadece doğrulanmış firmalar
            </p>
          </div>

          {/* Decorative Islamic Border */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, var(--accent-gold), var(--primary-teal), var(--accent-gold), transparent)',
            pointerEvents: 'none'
          }} />
        </motion.section>

        {/* Trust Strip */}
        <motion.div
          className="trust-strip"
          variants={itemVariants}
        >
          <div className="trust-item">
            <CheckCircle size={18} color="var(--accent-gold)" />
            <span className="trust-item-text">Belge kontrolünden geçen firmalar</span>
          </div>
          <div className="trust-item">
            <FileText size={18} color="var(--primary-teal)" />
            <span className="trust-item-text">Kontrol edilen ve doğrulanan ilanlar</span>
          </div>
          <div className="trust-item">
            <HeadphonesIcon size={18} color="var(--primary-teal)" />
            <span className="trust-item-text">Destek ekibimiz yanınızda</span>
          </div>
        </motion.div>

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
            <MotionLink
              to="/compare"
              className="card islamic-card"
              data-testid="feature-compare"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}
            >
              <div className="feature-icon"><RefreshCw size={32} color="var(--primary-teal)" /></div>
              <h3>AI Karşılaştırma</h3>
              <p>Yapay zeka ile turları detaylı karşılaştırın.</p>
            </MotionLink>

            {/* Hac Rehberi */}
            <MotionLink
              to="/chat"
              className="card islamic-card"
              data-testid="feature-chat"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}
            >
              <div className="feature-icon"><MessageSquare size={32} color="var(--primary-teal)" /></div>
              <h3>Hac Rehberi</h3>
              <p>Hac ve Umre ile ilgili sorularınıza AI ile cevap alın.</p>
            </MotionLink>

            {/* Detaylı Filtreleme */}
            <MotionLink
              to="/tours"
              className="card islamic-card"
              data-testid="feature-filter"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}
            >
              <div className="feature-icon"><Search size={32} color="var(--primary-teal)" /></div>
              <h3>Detaylı Filtreleme</h3>
              <p>Fiyat, tarih, operatör ve daha fazla kritere göre filtreleyin.</p>
            </MotionLink>

            {/* Tur Şirketi İlanları - Sadece Operator kullanıcılara göster */}
            {user?.role === 'operator' && (
              <MotionLink
                to="/operator/dashboard"
                className="card islamic-card"
                data-testid="feature-operator"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}
              >
                <div className="feature-icon"><Building size={32} color="var(--primary-teal)" /></div>
                <h3>Tur Şirketi İlanları</h3>
                <p>İlanlarınızı yönetin ve yeni turlar ekleyin.</p>
              </MotionLink>
            )}
          </div>
        </motion.section>

        {/* For Tour Companies Section - Conditional Based on User State */}
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

          {/* Scenario 1: Not logged in - Show both buttons */}
          {!user && (
            <div className="grid grid-2">
              <div className="card islamic-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '0.75rem' }}><Megaphone size={40} color="var(--accent-gold)" /></div>
                <h3>İlan Verin</h3>
                <p>Tur ilanlarınızı kolayca oluşturun ve binlerce müşteriye ulaşın.</p>
                <MotionLink
                  to="/operator/register"
                  className="btn btn-gold"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="operator-register-btn"
                >
                  <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> Şimdi Başlayın
                </MotionLink>
              </div>
              <div className="card islamic-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '0.75rem' }}><KeyRound size={40} color="var(--primary-teal)" /></div>
                <h3>Zaten Üye misiniz?</h3>
                <p>Giriş yaparak turlarınızı yönetin ve ilanlarınızı düzenleyin.</p>
                <MotionLink
                  to="/login"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="operator-login-btn"
                >
                  <Lock size={18} style={{ marginRight: '0.5rem' }} /> Giriş Yapın
                </MotionLink>
              </div>
            </div>
          )}

          {/* Scenario 2: Logged in as Operator - Show Management Button */}
          {user && user.role === 'operator' && (
            <div className="grid grid-2">
              <div className="card islamic-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '0.75rem' }}><BarChart3 size={40} color="var(--primary-teal)" /></div>
                <h3>Turlarınızı Yönetin</h3>
                <p>İlanlarınızı düzenleyin, yeni turlar ekleyin ve rezervasyonları takip edin.</p>
                <MotionLink
                  to="/operator/dashboard"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="operator-dashboard-btn"
                >
                  <BarChart3 size={18} style={{ marginRight: '0.5rem' }} /> Dashboard'a Git
                </MotionLink>
              </div>
              <div className="card islamic-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '0.75rem' }}><Plus size={40} color="var(--accent-gold)" /></div>
                <h3>Yeni İlan Oluşturun</h3>
                <p>Hızlıca yeni tur ilanı oluşturun ve müşterilerinize ulaşın.</p>
                <MotionLink
                  to="/operator/create"
                  className="btn btn-gold"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="operator-create-btn"
                >
                  <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> İlan Oluştur
                </MotionLink>
              </div>
            </div>
          )}

          {/* Scenario 3: Logged in as Regular User - Show "Become Operator" CTA */}
          {user && user.role === 'user' && (
            <div className="card islamic-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ marginBottom: '0.75rem' }}><Building size={40} color="var(--primary-teal)" /></div>
              <h3>Tur Şirketi misiniz?</h3>
              <p>Siz de platformumuzda tur ilanları vererek binlerce müşteriye ulaşabilirsiniz.</p>
              <MotionLink
                to="/operator/register"
                className="btn btn-gold"
                style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="become-operator-btn"
              >
                <Megaphone size={18} style={{ marginRight: '0.5rem' }} /> İlan Vermeye Başlayın
              </MotionLink>
            </div>
          )}
        </motion.section>

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
      </motion.div >
    </>
  );
}
