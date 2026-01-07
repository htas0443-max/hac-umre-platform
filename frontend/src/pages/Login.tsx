import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/tours');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{ maxWidth: '450px', margin: '3rem auto' }}
      data-testid="login-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="card glass"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <div className="card-header">
          <motion.h2
            className="card-title"
            style={{ fontSize: '2rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            🔐 Giriş Yap
          </motion.h2>
          <p className="card-subtitle">Hesabınıza giriş yapın</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="alert alert-error"
              data-testid="login-error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="form-label" htmlFor="email">📧 Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@email.com"
              data-testid="login-email-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="form-label" htmlFor="password">🔒 Şifre</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="En az 6 karakter"
              data-testid="login-password-input"
            />
          </motion.div>

          <motion.div
            style={{ textAlign: 'right', marginBottom: '1rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <Link
              to="/forgot-password"
              style={{ color: 'var(--primary-emerald)', fontSize: '0.9rem', textDecoration: 'underline' }}
              data-testid="forgot-password-link"
            >
              🔑 Şifremi unuttum
            </Link>
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
            data-testid="login-submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {loading ? '🔄 Giriş yapılıyor...' : '🚀 Giriş Yap'}
          </motion.button>
        </form>

        <motion.p
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Hesabınız yok mu?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary-emerald)', fontWeight: 600, textDecoration: 'underline' }}
            data-testid="go-to-register"
          >
            Kayıt olun
          </Link>
        </motion.p>

        <motion.p
          style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Tur şirketi misiniz?{' '}
          <Link
            to="/operator/register"
            style={{ color: 'var(--accent-gold-dark)', fontWeight: 600, textDecoration: 'underline' }}
            data-testid="go-to-operator"
          >
            Buradan kayıt olun
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
