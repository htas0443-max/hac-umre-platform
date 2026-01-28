import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, Building, DollarSign, X } from 'lucide-react';
import { tourAlertsApi } from '../api';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

interface TourAlertFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

/**
 * TourAlertForm - Tarih bazlı tur alarm formu
 * "Bu tarihte tur açılırsa haber ver"
 */
export default function TourAlertForm({ onSuccess, onCancel }: TourAlertFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        tour_type: 'any',
        max_price: '',
        preferred_operator: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.info('Alarm kurmak için giriş yapmalısınız');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            toast.error('Tarih aralığı seçmelisiniz');
            return;
        }

        setLoading(true);
        try {
            await tourAlertsApi.create({
                start_date: formData.start_date,
                end_date: formData.end_date,
                tour_type: formData.tour_type,
                max_price: formData.max_price ? parseFloat(formData.max_price) : undefined,
                preferred_operator: formData.preferred_operator || undefined
            });

            toast.success('🔔 Alarm kuruldu! Uygun tur açıldığında bildireceğiz.', { duration: 3000 });
            onSuccess?.();
        } catch (error: any) {
            console.error('Alarm oluşturma hatası:', error);
            toast.error(error.response?.data?.detail || 'Alarm oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const tourTypeLabels: Record<string, string> = {
        any: 'Hepsi',
        hac: 'Hac',
        umre: 'Umre'
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '1.5rem' }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Bell size={20} color="var(--primary-teal)" />
                    Tur Alarmı Kur
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={20} color="var(--text-secondary)" />
                    </button>
                )}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Seçtiğiniz tarih aralığında yeni tur açıldığında size haber vereceğiz.
            </p>

            {/* Tarih Aralığı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> Başlangıç
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.start_date}
                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> Bitiş
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.end_date}
                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>
            </div>

            {/* Tur Tipi */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Tur Tipi</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['any', 'hac', 'umre'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            className={`btn btn-small ${formData.tour_type === type ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFormData(prev => ({ ...prev, tour_type: type }))}
                        >
                            {tourTypeLabels[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Opsiyonel Filtreler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <DollarSign size={14} /> Max Fiyat (opsiyonel)
                    </label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="Örn: 50000"
                        value={formData.max_price}
                        onChange={e => setFormData(prev => ({ ...prev, max_price: e.target.value }))}
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building size={14} /> Firma (opsiyonel)
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Diyanet"
                        value={formData.preferred_operator}
                        onChange={e => setFormData(prev => ({ ...prev, preferred_operator: e.target.value }))}
                    />
                </div>
            </div>

            <motion.button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {loading ? 'Kuruluyor...' : '🔔 Alarm Kur'}
            </motion.button>
        </motion.form>
    );
}
