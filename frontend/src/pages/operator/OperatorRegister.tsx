import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Mail, Lock, AlertTriangle, RefreshCw, PartyPopper } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export default function OperatorRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!companyName.trim()) {
      setError('Şirket adı gerekli');
      return;
    }

    setLoading(true);

    try {
      await auth.register(email, password, companyName);
      navigate('/operator/dashboard');
    } catch (err: any) {
      console.error('Kayıt hatası:', err);
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{ maxWidth: '550px', margin: '3rem auto' }}
      data-testid="operator-register-page"
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
            <Building size={24} style={{ marginRight: '0.5rem' }} /> Tur Şirketi Kayıt
          </motion.h2>
          <p className="card-subtitle">Tur ilanlarınızı yayınlayın</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="alert alert-error"
              data-testid="register-error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} /> {error}
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
            <label className="form-label" htmlFor="companyName" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={16} /> Şirket Adı</label>
            <input
              type="text"
              id="companyName"
              className="form-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="örn: ABC Turizm"
              data-testid="company-name-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="sirket@email.com"
              data-testid="email-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Şifre</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="En az 6 karakter"
              data-testid="password-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="form-label" htmlFor="confirmPassword" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Şifre Tekrar</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Şifrenizi tekrar girin"
              data-testid="confirm-password-input"
            />
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
            data-testid="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {loading ? <><RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Kayıt yapılıyor...</> : <><PartyPopper size={16} style={{ marginRight: '0.5rem' }} /> Tur Şirketi Olarak Kayıt Ol</>}
          </motion.button>
        </form>

        <motion.p
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Normal kullanıcı mısınız?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary-emerald)', fontWeight: 600, textDecoration: 'underline' }}
            data-testid="go-to-user-register"
          >
            Buradan kayıt olun
          </Link>
        </motion.p>

        <motion.p
          style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Zaten hesabınız var mı?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary-emerald)', fontWeight: 600, textDecoration: 'underline' }}
            data-testid="go-to-login"
          >
            Giriş yapın
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
