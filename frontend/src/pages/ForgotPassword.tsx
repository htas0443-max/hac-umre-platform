import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Mail, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            style={{ maxWidth: '450px', margin: '3rem auto' }}
            data-testid="forgot-password-page"
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
                        <Key size={24} style={{ marginRight: '0.5rem' }} /> Şifremi Unuttum
                    </motion.h2>
                    <p className="card-subtitle">E-posta adresinize şifre sıfırlama linki gönderilecek</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="alert alert-error"
                            data-testid="forgot-password-error"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {success && (
                        <motion.div
                            className="alert alert-success"
                            data-testid="forgot-password-success"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{
                                padding: '1rem',
                                marginBottom: '1rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white'
                            }}
                        >
                            <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.
                        </motion.div>
                    )}
                </AnimatePresence>

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> E-posta Adresi</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="ornek@email.com"
                                data-testid="forgot-password-email-input"
                            />
                        </motion.div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                            data-testid="forgot-password-submit-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {loading ? <><RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Gönderiliyor...</> : <><Send size={16} style={{ marginRight: '0.5rem' }} /> Şifre Sıfırlama Linki Gönder</>}
                        </motion.button>
                    </form>
                )}

                <motion.p
                    style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link
                        to="/login"
                        style={{ color: 'var(--primary-emerald)', fontWeight: 600, textDecoration: 'underline' }}
                        data-testid="back-to-login"
                    >
                        ← Giriş sayfasına dön
                    </Link>
                </motion.p>
            </motion.div>
        </motion.div>
    );
}
