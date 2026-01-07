import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { operatorApi, toursApi } from '../api';
import { useAuth } from '../AuthContext';
import type { Tour } from '../types';

export default function OperatorTourForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sirketRuhsati, setSirketRuhsati] = useState<File | null>(null);
  const [vergiLevhasi, setVergiLevhasi] = useState<File | null>(null);
  const [tursabBelgesi, setTursabBelgesi] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    operator: user?.company_name || '',
    price: '',
    currency: 'TRY',
    start_date: '',
    end_date: '',
    duration: '',
    hotel: '',
    services: '',
    visa: '',
    transport: '',
    guide: '',
    itinerary: '',
    rating: '',
    phone: '',
    status: 'pending'
  });

  useEffect(() => {
    if (isEdit && id) {
      loadTour();
    }
  }, [id]);

  const loadTour = async () => {
    try {
      const tour = await toursApi.getById(id!);
      setFormData({
        title: tour.title,
        operator: tour.operator,
        price: tour.price.toString(),
        currency: tour.currency,
        start_date: tour.start_date,
        end_date: tour.end_date,
        duration: tour.duration,
        hotel: tour.hotel,
        services: tour.services.join(', '),
        visa: tour.visa,
        transport: tour.transport,
        guide: tour.guide,
        itinerary: tour.itinerary.join('\n'),
        rating: tour.rating?.toString() || '',
        phone: tour.phone || '',
        status: tour.status
      });
    } catch (err: any) {
      setError('Tur yüklenemedi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // E-Devlet belge zorunluluğu kontrolü
    if (!sirketRuhsati || !vergiLevhasi || !tursabBelgesi) {
      setError('Lütfen tüm e-Devlet onaylı belgeleri yükleyin: Şirket Ruhsatı, Vergi Levhası ve TÜRSAB Belgesi');
      return;
    }

    setLoading(true);

    try {
      const tourData: any = {
        title: formData.title,
        operator: user?.company_name || formData.operator,
        price: parseFloat(formData.price),
        currency: formData.currency,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration: formData.duration,
        hotel: formData.hotel,
        services: formData.services.split(',').map(s => s.trim()).filter(s => s),
        visa: formData.visa,
        transport: formData.transport,
        guide: formData.guide,
        itinerary: formData.itinerary.split('\n').filter(s => s.trim()),
        source: 'operator',
        status: 'pending'
      };

      if (formData.rating) {
        tourData.rating = parseFloat(formData.rating);
      }

      if (isEdit) {
        await operatorApi.updateTour(id!, tourData);
        setSuccess('Tur güncellendi ve tekrar onaya gönderildi!');
        setTimeout(() => navigate('/operator/dashboard'), 2000);
      } else {
        await operatorApi.createTour(tourData);
        setSuccess('Tur oluşturuldu ve onay için gönderildi!');
        setTimeout(() => navigate('/operator/dashboard'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="operator-tour-form" data-testid="operator-tour-form">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{isEdit ? 'Turu Düzenle' : 'Yeni Tur İlanı'}</h1>
        <p style={{ color: 'var(--neutral-gray-500)' }}>
          {isEdit ? 'Tur bilgilerini güncelleyin' : 'Yeni bir tur ilanı oluşturun'}
        </p>
      </div>

      {error && <div className="alert alert-error" data-testid="form-error">{error}</div>}
      {success && <div className="alert alert-success" data-testid="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Tur Başlığı *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="örn: Ekonomik Umre Paketi"
              data-testid="title-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fiyat *</label>
            <input
              type="number"
              className="form-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="15000"
              data-testid="price-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Para Birimi *</label>
            <select
              className="form-input"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              required
              data-testid="currency-input"
            >
              <option value="TRY">₺ Türk Lirası (TRY)</option>
              <option value="USD">$ Amerikan Doları (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Başlangıç Tarihi *</label>
            <input
              type="date"
              className="form-input"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              data-testid="start-date-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bitiş Tarihi *</label>
            <input
              type="date"
              className="form-input"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              data-testid="end-date-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Süre *</label>
            <input
              type="text"
              className="form-input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
              placeholder="örn: 7 gün"
              data-testid="duration-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Otel *</label>
            <input
              type="text"
              className="form-input"
              value={formData.hotel}
              onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
              required
              placeholder="örn: Makkah Tower 3* - Harem'e 800m"
              data-testid="hotel-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ulaşım *</label>
            <input
              type="text"
              className="form-input"
              value={formData.transport}
              onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
              required
              placeholder="örn: Türk Hava Yolları ekonomi sınıf"
              data-testid="transport-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rehber *</label>
            <input
              type="text"
              className="form-input"
              value={formData.guide}
              onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
              required
              placeholder="örn: Türkçe konuşan deneyimli rehber"
              data-testid="guide-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vize *</label>
            <input
              type="text"
              className="form-input"
              value={formData.visa}
              onChange={(e) => setFormData({ ...formData, visa: e.target.value })}
              required
              placeholder="örn: Vize dahil (işlemler tarafımızca yapılır)"
              data-testid="visa-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Puan (0-5) (Opsiyonel)</label>
            <input
              type="number"
              className="form-input"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              min="0"
              max="5"
              step="0.1"
              placeholder="4.5"
              data-testid="rating-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">📞 Telefon Numarası *</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="örn: +90 555 123 4567"
              data-testid="phone-input"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-gray-500)', marginTop: '0.25rem' }}>
              Kullanıcılar sizinle iletişim kurmak için bu numarayı kullanacaktır.
            </p>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">Hizmetler (virgülle ayrılı) *</label>
          <textarea
            className="form-input"
            value={formData.services}
            onChange={(e) => setFormData({ ...formData, services: e.target.value })}
            required
            rows={3}
            placeholder="örn: Ulaşım, Rehber, Havaaalanı transferi, Yükleme hizmeti"
            data-testid="services-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Program (her satır bir gün) *</label>
          <textarea
            className="form-input"
            value={formData.itinerary}
            onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
            required
            rows={6}
            placeholder="Gün 1: Varış ve otel transferi\nGün 2: Umre ibadetleri\nGün 3-6: Ziyaretler ve serbest zaman\nGün 7: Dönüş"
            data-testid="itinerary-input"
          />
        </div>

        {/* E-Devlet Onaylı Belgeler */}
        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏛️</span>
            E-Devlet Onaylı Belgeler *
          </label>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-gray-500)', marginBottom: '1rem' }}>
            Aşağıdaki üç belgenin tamamını yüklemeniz zorunludur.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Şirket Ruhsatı */}
            <div style={{ padding: '1rem', background: 'var(--neutral-gray-100)', borderRadius: '8px' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Şirket Ruhsatı *
                {sirketRuhsati && <span style={{ color: 'var(--success-green)', fontSize: '1rem' }}>✓</span>}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="form-input"
                onChange={(e) => setSirketRuhsati(e.target.files?.[0] || null)}
                data-testid="sirket-ruhsati-input"
                style={{ padding: '0.5rem' }}
              />
              {sirketRuhsati && (
                <span style={{ fontSize: '0.875rem', color: 'var(--primary-emerald)', marginTop: '0.25rem', display: 'block' }}>
                  {sirketRuhsati.name}
                </span>
              )}
            </div>

            {/* Vergi Levhası */}
            <div style={{ padding: '1rem', background: 'var(--neutral-gray-100)', borderRadius: '8px' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Vergi Levhası *
                {vergiLevhasi && <span style={{ color: 'var(--success-green)', fontSize: '1rem' }}>✓</span>}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="form-input"
                onChange={(e) => setVergiLevhasi(e.target.files?.[0] || null)}
                data-testid="vergi-levhasi-input"
                style={{ padding: '0.5rem' }}
              />
              {vergiLevhasi && (
                <span style={{ fontSize: '0.875rem', color: 'var(--primary-emerald)', marginTop: '0.25rem', display: 'block' }}>
                  {vergiLevhasi.name}
                </span>
              )}
            </div>

            {/* TÜRSAB Belgesi */}
            <div style={{ padding: '1rem', background: 'var(--neutral-gray-100)', borderRadius: '8px' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 TÜRSAB Belgesi *
                {tursabBelgesi && <span style={{ color: 'var(--success-green)', fontSize: '1rem' }}>✓</span>}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="form-input"
                onChange={(e) => setTursabBelgesi(e.target.files?.[0] || null)}
                data-testid="tursab-belgesi-input"
                style={{ padding: '0.5rem' }}
              />
              {tursabBelgesi && (
                <span style={{ fontSize: '0.875rem', color: 'var(--primary-emerald)', marginTop: '0.25rem', display: 'block' }}>
                  {tursabBelgesi.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate('/operator/dashboard')}
            className="btn btn-outline"
            data-testid="cancel-btn"
          >
            İptal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-testid="submit-btn"
            style={{ flex: 1 }}
          >
            {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle ve Onaya Gönder' : 'Oluştur ve Onaya Gönder')}
          </button>
        </div>
      </form>
    </div>
  );
}
