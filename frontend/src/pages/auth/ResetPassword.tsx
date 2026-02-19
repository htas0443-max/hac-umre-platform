import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    // Check if there's a valid session from the reset link
    useEffect(() => {
        // Supabase handles the token from URL automatically
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
            // No valid reset token, but let's still show the form
            // Supabase will handle the actual validation
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Şifre güncellenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            style={{ maxWidth: '450px', margin: '3rem auto' }}
            data-testid="reset-password-page"
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
                        <Lock size={24} style={{ marginRight: '0.5rem' }} /> Yeni Şifre Belirle
                    </motion.h2>
                    <p className="card-subtitle">Yeni şifrenizi girin</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="alert alert-error"
                            data-testid="reset-password-error"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {success && (
                        <motion.div
                            className="alert alert-success"
                            data-testid="reset-password-success"
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
                            <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...
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
                            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Yeni Şifre</label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="En az 6 karakter"
                                data-testid="reset-password-input"
                            />
                        </motion.div>

                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
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
                                data-testid="reset-password-confirm-input"
                            />
                        </motion.div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                            data-testid="reset-password-submit-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {loading ? <><RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Güncelleniyor...</> : <><CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Şifreyi Güncelle</>}
                        </motion.button>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
}
