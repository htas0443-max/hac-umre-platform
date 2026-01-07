import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <motion.nav
      className="navbar"
      data-testid="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="navbar-content">
        <Link to="/" className="navbar-logo" data-testid="logo-link">
          <span className="logo-icon">🕋</span>
          <span>Hac & Umre Platformu</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="navbar-link" data-testid="home-link">Ana Sayfa</Link>
          <Link to="/tours" className="navbar-link" data-testid="tours-link">Turlar</Link>

          {user ? (
            <>
              {user.role === 'operator' && (
                <Link to="/operator/dashboard" className="navbar-link" data-testid="operator-dashboard-link">Dashboard</Link>
              )}
              <Link to="/compare" className="navbar-link" data-testid="compare-link">Karşılaştır</Link>
              <Link to="/chat" className="navbar-link" data-testid="chat-link">AI Chatbot</Link>
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
              <Link to="/chat" className="navbar-link" data-testid="chat-link">AI Chatbot</Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
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
    </motion.nav>
  );
}
