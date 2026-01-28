import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface EmailOTPVerifyProps {
    email: string;
    onVerify: (code: string) => Promise<void>;
    onResend: () => Promise<void>;
    onCancel: () => void;
}

export default function EmailOTPVerify({ email, onVerify, onResend, onCancel }: EmailOTPVerifyProps) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [resending, setResending] = useState(false);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [resendCooldown]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (value && index === 5) {
            const fullCode = newCode.join('');
            if (fullCode.length === 6) {
                handleVerify(fullCode);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (fullCode: string) => {
        setLoading(true);
        setError('');

        try {
            await onVerify(fullCode);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Kod doğrulanamadı');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;

        setResending(true);
        try {
            await onResend();
            setResendCooldown(60);
            setError('');
        } catch (err: any) {
            setError('Kod gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setResending(false);
        }
    };

    // Mask email for display
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    if (success) {
        return (
            <motion.div
                className="card glass"
                style={{ maxWidth: '450px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <CheckCircle size={64} color="#10B981" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--success-green)', marginBottom: '0.5rem' }}>Doğrulama Başarılı!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Yönlendiriliyorsunuz...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{ maxWidth: '450px', margin: '3rem auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <motion.div
                className="card glass"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
            >
                <div className="card-header" style={{ textAlign: 'center' }}>
                    <Shield size={48} color="var(--primary-teal)" style={{ marginBottom: '1rem' }} />
                    <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
                        İki Faktörlü Doğrulama
                    </h2>
                    <p className="card-subtitle" style={{ marginTop: '0.5rem' }}>
                        <Mail size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {maskedEmail} adresine 6 haneli kod gönderdik
                    </p>
                </div>

                {error && (
                    <motion.div
                        className="alert alert-error"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
                        {error}
                    </motion.div>
                )}

                {/* 6-digit code input */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '1.5rem'
                    }}
                    onPaste={handlePaste}
                >
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={loading}
                            style={{
                                width: '3rem',
                                height: '3.5rem',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                border: '2px solid var(--neutral-gray-300)',
                                borderRadius: '8px',
                                background: 'var(--neutral-white)',
                                color: 'var(--neutral-gray-900)',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary-teal)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--neutral-gray-300)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    ))}
                </div>

                {/* Resend button */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || resending}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: resendCooldown > 0 ? 'var(--text-secondary)' : 'var(--primary-teal)',
                            cursor: resendCooldown > 0 ? 'default' : 'pointer',
                            fontSize: '0.9rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <RefreshCw size={14} className={resending ? 'spin' : ''} />
                        {resending
                            ? 'Gönderiliyor...'
                            : resendCooldown > 0
                                ? `Yeniden gönder (${resendCooldown}s)`
                                : 'Kodu yeniden gönder'}
                    </button>
                </div>

                {/* Cancel button */}
                <button
                    onClick={onCancel}
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                    disabled={loading}
                >
                    İptal
                </button>

                {/* Security note */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '1.5rem'
                }}>
                    Kod 5 dakika geçerlidir. Email gelmezse spam klasörünü kontrol edin.
                </p>
            </motion.div>
        </motion.div>
    );
}
