import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toursApi } from '../api';
import { useAuth } from '../AuthContext';
import type { Tour } from '../types';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadTour();
    }
  }, [id]);

  const loadTour = async () => {
    try {
      setLoading(true);
      const data = await toursApi.getById(id!);
      setTour(data);
      setError('');
    } catch (err: any) {
      setError('Tur yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bu turu silmek istediğinizden emin misiniz?')) {
      try {
        await toursApi.delete(id!);
        navigate('/tours');
      } catch (err: any) {
        setError('Tur silinemedi');
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return <div className="loading" data-testid="tour-detail-loading">Yükleniyor...</div>;
  }

  if (error || !tour) {
    return (
      <div className="alert alert-error" data-testid="tour-detail-error">
        {error || 'Tur bulunamadı'}
      </div>
    );
  }

  return (
    <div className="tour-detail-page" data-testid="tour-detail-page">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/tours" className="btn btn-outline btn-small" data-testid="back-to-tours">
          ← Turlar
        </Link>
        {user?.role === 'admin' && (
          <button onClick={handleDelete} className="btn btn-outline btn-small" data-testid="delete-tour-btn">
            🗑️ Sil
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title" data-testid="tour-title">{tour.title}</h1>
          <p className="card-subtitle">{tour.operator}</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-emerald)', marginBottom: '1rem' }}>
            {formatPrice(tour.price, tour.currency)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{tour.duration}</span>
            {tour.rating && <span className="badge badge-gold">⭐ {tour.rating}</span>}
            <span className="badge badge-primary">{tour.start_date} - {tour.end_date}</span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Genel Bilgiler</h3>
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>🏨 Otel:</strong></p>
              <p>{tour.hotel}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>✈️ Ulaşım:</strong></p>
              <p>{tour.transport}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>👤 Rehber:</strong></p>
              <p>{tour.guide}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>📝 Vize:</strong></p>
              <p>{tour.visa}</p>
            </div>
          </div>
        </div>

        {/* Kalkış ve Varış Bilgileri */}
        {(tour.departure_location || tour.departure_time || tour.arrival_location) && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛫</span> Kalkış ve Varış Bilgileri
            </h3>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              {tour.departure_location && (
                <div>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)' }}>
                    📍 Kalkış Yeri
                  </p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--neutral-gray-800)' }}>{tour.departure_location}</p>
                </div>
              )}
              {tour.departure_time && (
                <div>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)' }}>
                    🕐 Kalkış Saati
                  </p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--neutral-gray-800)' }}>{tour.departure_time}</p>
                </div>
              )}
              {tour.arrival_location && (
                <div style={{ gridColumn: tour.departure_location && tour.departure_time ? 'span 2' : 'auto' }}>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)' }}>
                    🛬 İniş/Varış Yeri
                  </p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--neutral-gray-800)' }}>{tour.arrival_location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detaylı Açıklama */}
        {tour.detailed_description && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Detaylı Açıklama
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #fde047',
              lineHeight: '1.8'
            }}>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--neutral-gray-700)' }}>
                {tour.detailed_description}
              </p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Hizmetler</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tour.services.map((service, idx) => (
              <span key={idx} className="badge badge-primary">{service}</span>
            ))}
          </div>
        </div>

        {tour.itinerary.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Program</h3>
            <div style={{ background: 'var(--neutral-beige)', padding: '1.5rem', borderRadius: '8px' }}>
              {tour.itinerary.map((day, idx) => (
                <div key={idx} style={{ marginBottom: idx < tour.itinerary.length - 1 ? '1rem' : 0 }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
                    {day}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reservation CTAs */}
        <div style={{
          background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid #86efac'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)' }}>📞 Hemen Rezervasyon Yap</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/905551234567?text=Merhaba, ${encodeURIComponent(tour.title)} hakkında bilgi almak istiyorum.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-reservation"
              data-testid="whatsapp-btn"
              style={{ flex: 1, minWidth: '200px' }}
            >
              💬 WhatsApp ile Rezervasyon
            </a>
            <a
              href="tel:+905551234567"
              className="btn btn-call"
              data-testid="call-btn"
              style={{ flex: 1, minWidth: '200px' }}
            >
              📱 Hemen Ara
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to={`/compare?tours=${tour._id}`}
            className="btn btn-ai"
            data-testid="compare-from-detail-btn"
          >
            🔄 Bu Turu Karşılaştır
          </Link>
          <Link
            to={`/chat?tour=${tour._id}`}
            className="btn btn-outline"
            data-testid="chat-from-detail-btn"
          >
            🤖 AI ile Soru Sor
          </Link>
        </div>
      </div>
    </div>
  );
}
