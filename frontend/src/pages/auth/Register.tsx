import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, Clock, PartyPopper, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useSEO } from '../../hooks/useSEO';
import PasswordStrength from '../../components/PasswordStrength';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // SEO: noindex - kayıt sayfası indexlenmemeli
  useSEO({ title: 'Kayıt Ol', noIndex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Lütfen adınızı ve soyadınızı girin');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    if (!acceptedTerms) {
      setError('Devam etmek için kullanım koşullarını kabul etmelisiniz');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      // Registration successful - redirect to tours
      // (Email confirmation is disabled in Supabase)
      navigate('/tours');
    } catch (err: any) {
      // DEBUG: Log actual error to console
      console.error('Registration error:', err);

      // Check for specific error types
      const errorMessage = err.message || 'Kayıt başarısız';

      // If email is already registered
      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('zaten')) {
        setError('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
      } else {
        // Show actual error for debugging
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if passwords match
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  return (
    <motion.div
      style={{ maxWidth: '450px', margin: '3rem auto' }}
      data-testid="register-page"
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
            <Sparkles size={24} style={{ marginRight: '0.5rem' }} /> Kayıt Ol
          </motion.h2>
          <p className="card-subtitle">Yeni hesap oluşturun</p>
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
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="form-label" htmlFor="fullName" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Ad Soyad</label>
            <input
              type="text"
              id="fullName"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Adınız ve soyadınız"
              autoComplete="name"
              data-testid="register-fullname-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> E-posta</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@email.com"
              autoComplete="email"
              data-testid="register-email-input"
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Şifre</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                style={{ paddingRight: '3rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Güçlü bir şifre oluşturun"
                autoComplete="new-password"
                data-testid="register-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  opacity: 0.6
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            <PasswordStrength password={password} showChecklist={true} />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="form-label" htmlFor="confirmPassword" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Şifre Tekrar</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              className={`form-input ${!passwordsMatch ? 'input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Şifrenizi tekrar girin"
              autoComplete="new-password"
              data-testid="register-confirm-password-input"
            />
            {!passwordsMatch && (
              <span className="input-error-text" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={14} /> Şifreler eşleşmiyor</span>
            )}
          </motion.div>

          {/* Terms and Conditions Checkbox */}
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
          >
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                data-testid="register-terms-checkbox"
              />
              <span className="custom-checkbox-label">
                <a href="/terms" target="_blank" rel="noopener noreferrer">Kullanım Koşulları</a>
                {' '}ve{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Gizlilik Politikası</a>
                'nı okudum ve kabul ediyorum.
              </span>
            </label>
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !passwordsMatch || !acceptedTerms}
            data-testid="register-submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {loading ? <><Clock size={16} style={{ marginRight: '0.5rem' }} /> Kayıt yapılıyor...</> : <><PartyPopper size={16} style={{ marginRight: '0.5rem' }} /> Kayıt Ol</>}
          </motion.button>
        </form>

        {/* Security badge */}
        <motion.div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: 'rgba(13, 148, 136, 0.05)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <Shield size={14} style={{ marginRight: '0.25rem' }} /> Verileriniz güvenle korunmaktadır
        </motion.div>

        <motion.p
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Zaten hesabınız var mı?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary-teal)', fontWeight: 600 }}
            data-testid="go-to-login"
          >
            Giriş yapın
          </Link>
        </motion.p>

        <motion.p
          style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Tur şirketi misiniz?{' '}
          <Link
            to="/operator/register"
            style={{ color: 'var(--accent-gold-dark)', fontWeight: 600 }}
            data-testid="go-to-operator"
          >
            Buradan kayıt olun
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
