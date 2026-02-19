import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Calendar, Tag, DollarSign, Building } from 'lucide-react';
import { toursApi } from '../../api';
import { useAuth } from '../../AuthContext';
import { toast } from 'sonner';
import { useSEO } from '../../hooks/useSEO';

export default function AdminTourCreate() {
    const navigate = useNavigate();
    useAuth();
    const [loading, setLoading] = useState(false);

    useSEO({ title: 'Yeni Tur Ekle', noIndex: true });

    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        price: '',
        operator: '',
        currency: 'TRY',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.start_date || !formData.price || !formData.operator) {
            toast.error('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                title: formData.title,
                start_date: formData.start_date,
                price: parseFloat(formData.price),
                operator: formData.operator,
                currency: formData.currency,
            };

            await toursApi.create(payload as any);

            toast.success(`"${formData.title}" başarıyla eklendi!`, {
                duration: 5000,
            });

            setFormData({ title: '', start_date: '', price: '', operator: '', currency: 'TRY' });
        } catch (error: any) {
            // Gerçek API hata mesajını göster
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.message ||
                'Tur oluşturulurken bilinmeyen bir hata oluştu';
            console.error('Tur oluşturma hatası:', error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="admin-tour-form-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}
        >
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}
            >
                <ArrowLeft size={18} /> Dashboard'a Dön
            </button>

            <div className="card">
                <h1 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    ➕ Yeni Tur Ekle
                </h1>

                <form onSubmit={handleSubmit}>
                    {/* Tur Adı */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Tur Adı *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Tag size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Örn: 15 Günlük Ramazan Umresi"
                                className="form-input"
                                style={{ width: '100%', paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    {/* Acenta Adı */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="operator" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Acenta / Firma Adı *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                id="operator"
                                name="operator"
                                value={formData.operator}
                                onChange={handleChange}
                                placeholder="Örn: ABC Turizm"
                                className="form-input"
                                style={{ width: '100%', paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Tarih */}
                        <div className="form-group">
                            <label htmlFor="start_date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Başlangıç Tarihi *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="form-input"
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                />
                            </div>
                        </div>

                        {/* Fiyat */}
                        <div className="form-group">
                            <label htmlFor="price" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Fiyat *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="form-input"
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Para Birimi */}
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label htmlFor="currency" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Para Birimi
                        </label>
                        <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="form-input"
                            style={{ width: '100%', padding: '0.75rem 1rem' }}
                        >
                            <option value="TRY">🇹🇷 TRY (Türk Lirası)</option>
                            <option value="USD">🇺🇸 USD (Amerikan Doları)</option>
                            <option value="EUR">🇪🇺 EUR (Euro)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? 'Kaydediliyor...' : <><Save size={18} /> Turu Kaydet</>}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
