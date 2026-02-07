import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Mail, Eye, EyeOff, Clock, LogIn } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSEO } from '../hooks/useSEO';

// Admin lockout configuration
const ADMIN_LOCKOUT_KEY = 'admin_login_lockout';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface LockoutData {
    attempts: number;
    lockedUntil: number | null;
}

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // SEO: noindex - admin giriş sayfası indexlenmemeli
    useSEO({ title: 'Admin Girişi', noIndex: true });

    // Check lockout status on mount
    useEffect(() => {
        checkLockoutStatus();
    }, []);

    // Redirect if already logged in as admin
    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin/dashboard');
        }
    }, [user, navigate]);

    // Lockout countdown timer
    useEffect(() => {
        if (!isLocked) return;

        const interval = setInterval(() => {
            const data = getLockoutData();
            if (data.lockedUntil && data.lockedUntil > Date.now()) {
                setLockTimeRemaining(Math.ceil((data.lockedUntil - Date.now()) / 1000));
            } else {
                setIsLocked(false);
                setLockTimeRemaining(0);
                clearLockout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLocked]);

    const getLockoutData = (): LockoutData => {
        const data = localStorage.getItem(ADMIN_LOCKOUT_KEY);
        return data ? JSON.parse(data) : { attempts: 0, lockedUntil: null };
    };

    const setLockoutData = (data: LockoutData) => {
        localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify(data));
    };

    const clearLockout = () => {
        localStorage.removeItem(ADMIN_LOCKOUT_KEY);
    };

    const checkLockoutStatus = () => {
        const data = getLockoutData();
        if (data.lockedUntil && data.lockedUntil > Date.now()) {
            setIsLocked(true);
            setLockTimeRemaining(Math.ceil((data.lockedUntil - Date.now()) / 1000));
        }
    };

    const recordFailedAttempt = () => {
        const data = getLockoutData();
        const newAttempts = data.attempts + 1;

        if (newAttempts >= MAX_ATTEMPTS) {
            const lockedUntil = Date.now() + LOCKOUT_DURATION;
            setLockoutData({ attempts: newAttempts, lockedUntil });
            setIsLocked(true);
            setLockTimeRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
            setError(`Çok fazla yanlış deneme. ${Math.ceil(LOCKOUT_DURATION / 60000)} dakika sonra tekrar deneyin.`);
        } else {
            setLockoutData({ attempts: newAttempts, lockedUntil: null });
            setError(`Geçersiz kimlik bilgileri. ${MAX_ATTEMPTS - newAttempts} deneme hakkınız kaldı.`);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            setError('Hesap kilitli. Lütfen bekleyin.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await login(email, password);

            // Check if user is admin after login
            // Note: This happens in AuthContext, we rely on the redirect useEffect
            clearLockout();

        } catch (err: any) {
            recordFailedAttempt();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <motion.div
                style={{ maxWidth: '420px', width: '100%' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Admin Badge */}
                <motion.div
                    style={{
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#a78bfa',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        <Lock size={16} style={{ marginRight: '0.25rem' }} /> Admin Paneli
                    </div>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '2.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Shield size={48} color="#a78bfa" style={{ marginBottom: '0.5rem' }} />
                        <h1 style={{
                            color: '#ffffff',
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem'
                        }}>
                            Yönetici Girişi
                        </h1>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.9rem'
                        }}>
                            Bu alan yetkili personel içindir
                        </p>
                    </div>

                    {/* Lockout Warning */}
                    <AnimatePresence>
                        {isLocked && (
                            <motion.div
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    textAlign: 'center'
                                }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    ⚠️ Hesap Geçici Olarak Kilitlendi
                                </div>
                                <div style={{ color: '#fca5a5', fontSize: '1.5rem', fontWeight: 700 }}>
                                    {formatTime(lockTimeRemaining)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && !isLocked && (
                            <motion.div
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    color: '#fca5a5',
                                    fontSize: '0.9rem'
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                                fontWeight: 500
                            }}>
                                <Mail size={16} style={{ marginRight: '0.25rem' }} /> E-posta
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLocked || loading}
                                placeholder="admin@sirket.com"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#8b5cf6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem',
                                fontWeight: 500
                            }}>
                                <Lock size={16} style={{ marginRight: '0.25rem' }} /> Şifre
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLocked || loading}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 3rem 0.875rem 1rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#8b5cf6';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.target.style.boxShadow = 'none';
                                    }}
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
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLocked || loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: isLocked
                                    ? 'rgba(107, 114, 128, 0.5)'
                                    : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#ffffff',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            whileHover={!isLocked ? { scale: 1.02 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                        >
                            {loading ? <><Clock size={16} style={{ marginRight: '0.25rem' }} /> Doğrulanıyor...</> : isLocked ? <><Lock size={16} style={{ marginRight: '0.25rem' }} /> Kilitli</> : <><LogIn size={16} style={{ marginRight: '0.25rem' }} /> Giriş Yap</>}
                        </motion.button>
                    </form>

                    {/* Security Notice */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: '#a78bfa', fontSize: '0.8rem' }}>
                            <Lock size={14} style={{ marginRight: '0.25rem' }} /> Bu giriş şifreli bağlantı ile korunmaktadır
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Tüm giriş denemeleri kayıt altına alınmaktadır
                        </div>
                    </div>
                </motion.div>

                {/* Back to Main Site */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a
                        href="/"
                        style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.9rem',
                            textDecoration: 'none'
                        }}
                    >
                        ← Ana Siteye Dön
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
