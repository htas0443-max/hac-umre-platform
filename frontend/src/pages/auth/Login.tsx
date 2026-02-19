import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Key, AlertTriangle, Clock, Rocket, Shield } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useSEO } from '../../hooks/useSEO';
import EmailOTPVerify from '../../components/EmailOTPVerify';
import CloudflareTurnstile from '../../components/CloudflareTurnstile';

// Login attempt tracking
const LOCKOUT_KEY = 'login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface LockoutData {
  lockedUntil: number;
  attempts: number;
}

function getLockoutData(): LockoutData {
  try {
    const data = localStorage.getItem(LOCKOUT_KEY);
    if (data) return JSON.parse(data);
  } catch { }
  return { lockedUntil: 0, attempts: 0 };
}

function setLockoutData(data: LockoutData) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
}

function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [attemptWarning, setAttemptWarning] = useState('');
  // OTP state for admin 2FA
  const [showOTP, setShowOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const { login, sendEmailOTP, verifyEmailOTP, signInWithGoogle, user } = useAuth();

  // Role-based redirect helper
  const getRedirectPath = (userRole?: string) => {
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'support') return '/admin/dashboard';
    if (userRole === 'operator') return '/operator/dashboard';
    return '/tours';
  };
  const navigate = useNavigate();

  // SEO: noindex - giriş sayfası indexlenmemeli
  useSEO({ title: 'Giriş Yap', noIndex: true });

  // Check for pending 2FA from Google OAuth
  useEffect(() => {
    const pending2FA = localStorage.getItem('pending_2fa_email');
    if (pending2FA) {
      setOtpEmail(pending2FA);
      setShowOTP(true);
    }
  }, []);

  // Check lockout status on mount and periodically
  useEffect(() => {
    const checkLockout = () => {
      const data = getLockoutData();
      const now = Date.now();

      if (data.lockedUntil > now) {
        setLockoutRemaining(Math.ceil((data.lockedUntil - now) / 1000));
      } else if (data.lockedUntil > 0) {
        // Lockout expired, clear it
        clearLockout();
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAttemptWarning('');

    // Check if locked out
    const data = getLockoutData();
    if (data.lockedUntil > Date.now()) {
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, turnstileToken);

      // Check if admin needs OTP verification
      if (result.requiresOTP && result.email) {
        setOtpEmail(result.email);
        setShowOTP(true);
        clearLockout();
      } else {
        // Success - clear attempts and navigate based on role
        clearLockout();
        navigate(getRedirectPath(result.user?.role));
      }
    } catch (err: any) {
      // DEBUG: Gerçek hatayı konsola yazdır
      console.error('[LOGIN DEBUG] Hata detayı:', err);
      console.error('[LOGIN DEBUG] Response:', err?.response?.data);
      console.error('[LOGIN DEBUG] Status:', err?.response?.status);
      console.error('[LOGIN DEBUG] Message:', err?.message);

      // Increment failed attempts
      const currentData = getLockoutData();
      const newAttempts = currentData.attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock the account
        setLockoutData({
          lockedUntil: Date.now() + LOCKOUT_DURATION,
          attempts: newAttempts
        });
        setLockoutRemaining(LOCKOUT_DURATION / 1000);
        setError('Çok fazla başarısız deneme. Hesabınız 15 dakika kilitlendi.');
      } else {
        setLockoutData({ lockedUntil: 0, attempts: newAttempts });

        // Show remaining attempts warning
        const remaining = MAX_ATTEMPTS - newAttempts;
        if (remaining <= 2) {
          setAttemptWarning(`⚠️ ${remaining} deneme hakkınız kaldı`);
        }

        // User-friendly error message (don't reveal if email exists)
        setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP verification handlers
  const handleOTPVerify = async (code: string) => {
    await verifyEmailOTP(otpEmail, code);
    localStorage.removeItem('pending_2fa_email');
    clearLockout();
    // Admin/operator OTP'den sonra doğru panele yönlendir
    navigate(getRedirectPath(user?.role || otpEmail.includes('admin') ? 'admin' : 'user'));
  };

  const handleOTPResend = async () => {
    await sendEmailOTP(otpEmail);
  };

  const handleOTPCancel = () => {
    setShowOTP(false);
    setOtpEmail('');
    localStorage.removeItem('pending_2fa_email');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP verification screen for admin 2FA
  if (showOTP) {
    return (
      <EmailOTPVerify
        email={otpEmail}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        onCancel={handleOTPCancel}
      />
    );
  }

  // Lockout screen
  if (lockoutRemaining > 0) {
    return (
      <motion.div
        style={{ maxWidth: '450px', margin: '3rem auto' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="card"
          style={{ textAlign: 'center', padding: '2.5rem' }}
        >
          <div style={{ marginBottom: '1rem' }}><AlertTriangle size={64} color="#DC2626" /></div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--error-red)' }}>
            Hesap Geçici Olarak Kilitlendi
          </h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Çok fazla başarısız giriş denemesi yapıldı.
          </p>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--primary-teal)',
            marginBottom: '1.5rem'
          }}>
            {formatTime(lockoutRemaining)}
          </div>
          <Link
            to="/forgot-password"
            className="btn btn-outline"
            style={{ marginBottom: '1rem', display: 'inline-block' }}
          >
            <Mail size={16} style={{ marginRight: '0.5rem' }} /> Şifre Sıfırlama Linki Gönder
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Acil erişim için IT desteğe ulaşın
          </p>
        </motion.div>
      </motion.div>
    );
  }

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
            <Lock size={24} style={{ marginRight: '0.5rem' }} /> Giriş Yap
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
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attemptWarning && (
            <motion.div
              className="alert"
              style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {attemptWarning}
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
              data-testid="login-email-input"
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
                placeholder="En az 6 karakter"
                autoComplete="current-password"
                data-testid="login-password-input"
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
          </motion.div>

          <motion.div
            style={{ textAlign: 'right', marginBottom: '1rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <Link
              to="/forgot-password"
              style={{ color: 'var(--primary-teal)', fontSize: '0.9rem' }}
              data-testid="forgot-password-link"
            >
              <Key size={14} style={{ marginRight: '0.25rem' }} /> Şifremi unuttum
            </Link>
          </motion.div>

          {/* Cloudflare Turnstile Anti-Bot */}
          <CloudflareTurnstile
            onTokenReceived={(token) => setTurnstileToken(token)}
            onExpired={() => setTurnstileToken('')}
          />

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
            {loading ? <><Clock size={16} style={{ marginRight: '0.5rem' }} /> Giriş yapılıyor...</> : <><Rocket size={16} style={{ marginRight: '0.5rem' }} /> Giriş Yap</>}
          </motion.button>
        </form>

        {/* Separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--neutral-gray-300)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>veya</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--neutral-gray-300)' }} />
        </div>

        {/* Google Sign-in Button */}
        <motion.button
          type="button"
          onClick={signInWithGoogle}
          className="btn btn-outline"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--neutral-white)',
            border: '1px solid var(--neutral-gray-300)',
          }}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google ile Giriş Yap
        </motion.button>

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
          transition={{ delay: 0.65 }}
        >
          <Shield size={14} style={{ marginRight: '0.25rem' }} /> SSL ile güvenli bağlantı
        </motion.div>

        <motion.p
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Hesabınız yok mu?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary-teal)', fontWeight: 600 }}
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
