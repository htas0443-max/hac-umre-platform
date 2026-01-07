import React, { useState, useEffect } from 'react';
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

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link 
            to={`/compare?tours=${tour._id}`} 
            className="btn btn-ai"
            data-testid="compare-from-detail-btn"
          >
            Bu Turu Karşılaştır
          </Link>
          <Link 
            to={`/chat?tour=${tour._id}`} 
            className="btn btn-primary"
            data-testid="chat-from-detail-btn"
          >
            AI ile Soru Sor
          </Link>
        </div>
      </div>
    </div>
  );
}
