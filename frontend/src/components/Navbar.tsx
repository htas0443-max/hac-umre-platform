import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Globe, RefreshCw, BookOpen, BarChart3, CheckCircle, FolderUp, Heart } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useFavorites } from '../hooks/useFavorites';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { favoritesCount } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const menuVariants = {
    closed: { height: 0, opacity: 0 },
    open: { height: 'auto', opacity: 1 }
  };

  return (
    <motion.nav
      className="navbar"
      data-testid="navbar"
      role="navigation"
      aria-label="Ana gezinme"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="navbar-content">
        <Link to="/" className="navbar-logo" data-testid="logo-link" onClick={closeMenu}>
          <span className="logo-icon">🕋</span>
          <span className="logo-text">Hac & Umre Platformu</span>
        </Link>

        {/* Hamburger Button - Mobile Only */}
        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Menüyü aç/kapat"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          data-testid="hamburger-btn"
        >
          <motion.span
            className="hamburger-line"
            animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 8 : 0 }}
          />
          <motion.span
            className="hamburger-line"
            animate={{ opacity: isMenuOpen ? 0 : 1 }}
          />
          <motion.span
            className="hamburger-line"
            animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -8 : 0 }}
          />
        </button>

        {/* Desktop Navigation */}
        <div className="navbar-links navbar-desktop">
          <Link to="/" className="navbar-link" data-testid="home-link">Ana Sayfa</Link>
          <Link to="/tours" className="navbar-link" data-testid="tours-link">Turlar</Link>

          {user ? (
            <>
              {user.role === 'operator' && (
                <Link to="/operator/dashboard" className="navbar-link" data-testid="operator-dashboard-link">Dashboard</Link>
              )}
              <Link to="/compare" className="navbar-link" data-testid="compare-link">Karşılaştır</Link>
              <Link to="/chat" className="navbar-link" data-testid="chat-link">Hac Rehberi</Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/approval" className="navbar-link" data-testid="admin-approval-link">Tur Onayları</Link>
                  <Link to="/admin/reviews" className="navbar-link" data-testid="admin-reviews-link">Yorum Moderasyonu</Link>
                  <Link to="/admin/import" className="navbar-link" data-testid="admin-link">CSV Import</Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/compare" className="navbar-link" data-testid="compare-link">Karşılaştır</Link>
              <Link to="/chat" className="navbar-link" data-testid="chat-link">Hac Rehberi</Link>
            </>
          )}
          {/* Favorites link for everyone */}
          <Link to="/favorites" className="navbar-link" data-testid="favorites-link" style={{ position: 'relative' }}>
            <Heart size={18} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Favoriler
            {favoritesCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700
              }}>{favoritesCount}</span>
            )}
          </Link>
        </div>

        {/* Desktop Auth Actions */}
        <div className="navbar-actions navbar-desktop">
          {user ? (
            <div className="navbar-user">
              <Link to="/profile" className="navbar-link" data-testid="profile-link">
                Profilim
              </Link>
              <span className="navbar-email" data-testid="user-email">{user.email}</span>
              <button
                onClick={logout}
                className="btn btn-outline btn-small"
                data-testid="logout-btn"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-outline btn-small" data-testid="login-link">
                Giriş
              </Link>
              <Link to="/register" className="btn btn-primary btn-small" data-testid="register-link">
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="navbar-mobile-menu"
            id="mobile-menu"
            role="menu"
            aria-label="Mobil navigasyon menüsü"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="navbar-mobile-link" role="menuitem" onClick={closeMenu}><Home size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} /> Ana Sayfa</Link>
            <Link to="/tours" className="navbar-mobile-link" role="menuitem" onClick={closeMenu}><Globe size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} /> Turlar</Link>
            <Link to="/compare" className="navbar-mobile-link" role="menuitem" onClick={closeMenu}><RefreshCw size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} /> Karşılaştır</Link>
            <Link to="/chat" className="navbar-mobile-link" role="menuitem" onClick={closeMenu}><BookOpen size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} /> Hac Rehberi</Link>
            <Link to="/favorites" className="navbar-mobile-link" role="menuitem" onClick={closeMenu}>
              <Heart size={18} aria-hidden="true" style={{ marginRight: '0.5rem' }} /> Favoriler
              {favoritesCount > 0 && <span className="badge badge-gold" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>{favoritesCount}</span>}
            </Link>

            {user ? (
              <>
                {user.role === 'operator' && (
                  <Link to="/operator/dashboard" className="navbar-mobile-link" onClick={closeMenu}><BarChart3 size={18} style={{ marginRight: '0.5rem' }} /> Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/approval" className="navbar-mobile-link" onClick={closeMenu}><CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Tur Onayları</Link>
                    <Link to="/admin/import" className="navbar-mobile-link" onClick={closeMenu}><FolderUp size={18} style={{ marginRight: '0.5rem' }} /> CSV Import</Link>
                  </>
                )}
                <Link to="/profile" className="navbar-mobile-link" onClick={closeMenu}>
                  Profilim
                </Link>
                <div className="navbar-mobile-divider" />
                <span className="navbar-mobile-email">{user.email}</span>
                <button onClick={() => { logout(); closeMenu(); }} className="btn btn-outline navbar-mobile-btn">
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <div className="navbar-mobile-divider" />
                <Link to="/login" className="btn btn-outline navbar-mobile-btn" onClick={closeMenu}>
                  Giriş Yap
                </Link>
                <Link to="/register" className="btn btn-primary navbar-mobile-btn" onClick={closeMenu}>
                  Kayıt Ol
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
