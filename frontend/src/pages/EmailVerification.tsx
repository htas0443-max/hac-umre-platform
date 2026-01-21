import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, AlertTriangle, Clock, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OTPInput from '../components/OTPInput';

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailVerification() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from navigation state
    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Timer states
    const [expiryTime, setExpiryTime] = useState(OTP_EXPIRY_SECONDS);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [attempts, setAttempts] = useState(0);

    // Redirect if no email
    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    // Expiry countdown
    useEffect(() => {
        if (expiryTime <= 0 || success) return;

        const timer = setInterval(() => {
            setExpiryTime((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTime, success]);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerify = useCallback(async () => {
        if (otp.length !== OTP_LENGTH) {
            setError('Lütfen 6 haneli kodu tam olarak girin');
            return;
        }

        if (expiryTime <= 0) {
            setError('Kodun süresi doldu. Lütfen yeni kod isteyin.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Supabase OTP verification
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (verifyError) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setError('Çok fazla yanlış deneme. Lütfen yeni kod isteyin.');
                    setOtp('');
                } else {
                    setError(`Kod hatalı. ${5 - newAttempts} deneme hakkınız kaldı.`);
                }
                return;
            }

            setSuccess(true);

            // Redirect to tours after success
            setTimeout(() => {
                navigate('/tours');
            }, 2000);

        } catch (err: any) {
            setError('Doğrulama sırasında bir hata oluştu. Tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, [otp, email, expiryTime, attempts, navigate]);

    const handleResend = useCallback(async () => {
        if (resendCooldown > 0) return;

        setLoading(true);
        setError('');

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email
            });

            if (resendError) {
                setError('Kod gönderilemedi. Lütfen tekrar deneyin.');
                return;
            }

            // Reset states
            setOtp('');
            setAttempts(0);
            setExpiryTime(OTP_EXPIRY_SECONDS);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);

        } catch (err) {
            setError('Bir hata oluştu. Tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, [email, resendCooldown]);

    // Auto-submit when OTP is complete
    useEffect(() => {
        if (otp.length === OTP_LENGTH && !loading && !success) {
            handleVerify();
        }
    }, [otp, loading, success, handleVerify]);

    // Success screen
    if (success) {
        return (
            <motion.div
                style={{ maxWidth: '450px', margin: '3rem auto' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ marginBottom: '1rem' }}><CheckCircle size={64} color="#10B981" /></div>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>
                        E-posta Doğrulandı!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Hesabınız başarıyla aktifleştirildi.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Yönlendiriliyorsunuz...
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{ maxWidth: '450px', margin: '3rem auto' }}
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
                <div className="card-header" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem' }}><Mail size={48} color="var(--primary-teal)" /></div>
                    <h2 className="card-title" style={{ fontSize: '1.75rem' }}>
                        E-posta Doğrulama
                    </h2>
                    <p className="card-subtitle" style={{ marginTop: '0.5rem' }}>
                        <strong>{email}</strong> adresine gönderilen
                        <br />6 haneli kodu girin
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        className="alert alert-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* OTP Input */}
                <div style={{ margin: '2rem 0' }}>
                    <OTPInput
                        value={otp}
                        onChange={setOtp}
                        disabled={loading || expiryTime <= 0}
                        error={!!error}
                    />
                </div>

                {/* Timer */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    color: expiryTime <= 60 ? 'var(--error-red, #EF4444)' : 'var(--text-secondary)'
                }}>
                    {expiryTime > 0 ? (
                        <>
                            <span>Kalan süre: </span>
                            <strong>{formatTime(expiryTime)}</strong>
                        </>
                    ) : (
                        <span style={{ color: 'var(--error-red, #EF4444)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                            <AlertTriangle size={16} /> Kodun süresi doldu
                        </span>
                    )}
                </div>

                {/* Verify Button */}
                <motion.button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1rem' }}
                    disabled={loading || otp.length !== OTP_LENGTH}
                    onClick={handleVerify}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {loading ? <><Clock size={16} style={{ marginRight: '0.25rem' }} /> Doğrulanıyor...</> : <><CheckCircle size={16} style={{ marginRight: '0.25rem' }} /> Doğrula</>}
                </motion.button>

                {/* Divider */}
                <div style={{
                    textAlign: 'center',
                    margin: '1.5rem 0',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                }}>
                    Kod gelmedi mi?
                </div>

                {/* Resend Button */}
                <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                    disabled={loading || resendCooldown > 0}
                    onClick={handleResend}
                >
                    {resendCooldown > 0
                        ? <><Mail size={16} style={{ marginRight: '0.25rem' }} /> Yeni Kod Gönder ({resendCooldown}s)</>
                        : <><Mail size={16} style={{ marginRight: '0.25rem' }} /> Yeni Kod Gönder</>}
                </button>

                {/* Change Email Link */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                }}>
                    E-posta yanlış mı?{' '}
                    <a
                        href="/register"
                        style={{ color: 'var(--primary-teal)', fontWeight: 500 }}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/register');
                        }}
                    >
                        Değiştir
                    </a>
                </p>

                {/* Security Badge */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: 'rgba(13, 148, 136, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                }}>
                    <Lock size={14} style={{ marginRight: '0.25rem' }} /> Güvenli doğrulama
                </div>
            </motion.div>
        </motion.div>
    );
}
