import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
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
        </div>

        {/* Desktop Auth Actions */}
        <div className="navbar-actions navbar-desktop">
          {user ? (
            <div className="navbar-user">
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
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="navbar-mobile-link" onClick={closeMenu}>🏠 Ana Sayfa</Link>
            <Link to="/tours" className="navbar-mobile-link" onClick={closeMenu}>🌍 Turlar</Link>
            <Link to="/compare" className="navbar-mobile-link" onClick={closeMenu}>🔄 Karşılaştır</Link>
            <Link to="/chat" className="navbar-mobile-link" onClick={closeMenu}>🕋 Hac Rehberi</Link>

            {user ? (
              <>
                {user.role === 'operator' && (
                  <Link to="/operator/dashboard" className="navbar-mobile-link" onClick={closeMenu}>📊 Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/approval" className="navbar-mobile-link" onClick={closeMenu}>✅ Tur Onayları</Link>
                    <Link to="/admin/import" className="navbar-mobile-link" onClick={closeMenu}>📁 CSV Import</Link>
                  </>
                )}
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
