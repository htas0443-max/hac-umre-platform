import React, { useState, useEffect } from 'react';
import { adminApi, toursApi } from '../api';
import type { Tour } from '../types';

export default function AdminApproval() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadPendingTours();
  }, []);

  const loadPendingTours = async () => {
    try {
      setLoading(true);
      // Admin can see all tours including pending
      const data = await toursApi.getAll({ status: 'pending', limit: 100 } as any);
      setTours(data.tours);
    } catch (err) {
      console.error('Turlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tourId: string) => {
    if (!window.confirm('Bu turu onaylamak istediğinizden emin misiniz?')) return;

    try {
      setProcessing(tourId);
      await adminApi.approveTour(tourId);
      setTours(tours.filter(t => t._id !== tourId));
    } catch (err: any) {
      alert('Onaylama başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    if (!rejectionReason.trim()) {
      alert('Lütfen red nedeni girin');
      return;
    }

    try {
      setProcessing(showRejectModal);
      await adminApi.rejectTour(showRejectModal, rejectionReason);
      setTours(tours.filter(t => t._id !== showRejectModal));
      setShowRejectModal(null);
      setRejectionReason('');
    } catch (err: any) {
      alert('Reddetme başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="admin-approval" data-testid="admin-approval">
      <div style={{ marginBottom: '2rem' }}>
        <h1>👑 Tur Onay Yönetimi</h1>
        <p style={{ color: 'var(--neutral-gray-500)' }}>
          {tours.length} tur onay bekliyor
        </p>
      </div>

      {tours.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Onay bekleyen tur yok.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {tours.map((tour) => (
            <div key={tour._id} className="card" data-testid={`tour-${tour._id}`}>
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--accent-gold-light)' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{tour.title}</h3>
                <p style={{ color: 'var(--neutral-gray-500)', fontSize: '0.875rem' }}>
                  🏬 {tour.operator}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-emerald)', marginBottom: '0.5rem' }}>
                  {formatPrice(tour.price, tour.currency)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{tour.duration}</span>
                  {tour.rating && <span className="badge badge-gold">⭐ {tour.rating}</span>}
                  <span className="badge" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold-dark)' }}>
                    Onay Bekliyor
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <p style={{ marginBottom: '0.25rem' }}><strong>🏨 Otel:</strong> {tour.hotel}</p>
                <p style={{ marginBottom: '0.25rem' }}><strong>✈️ Ulaşım:</strong> {tour.transport}</p>
                <p style={{ marginBottom: '0.25rem' }}><strong>👤 Rehber:</strong> {tour.guide}</p>
                <p style={{ marginBottom: '0.25rem' }}><strong>📝 Vize:</strong> {tour.visa}</p>
                <p style={{ marginBottom: '0.25rem' }}><strong>📍 Tarih:</strong> {tour.start_date} - {tour.end_date}</p>
                <p><strong>📦 Hizmetler:</strong> {tour.services.length} adet</p>
              </div>

              <div style={{ background: 'var(--neutral-beige)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Program:</p>
                <div style={{ fontSize: '0.8rem', maxHeight: '100px', overflowY: 'auto' }}>
                  {tour.itinerary.slice(0, 3).map((day, idx) => (
                    <p key={idx} style={{ marginBottom: '0.25rem' }}>{day}</p>
                  ))}
                  {tour.itinerary.length > 3 && (
                    <p style={{ color: 'var(--neutral-gray-500)' }}>... ve {tour.itinerary.length - 3} gün daha</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleApprove(tour._id)}
                  className="btn btn-primary btn-small"
                  style={{ flex: 1 }}
                  disabled={processing === tour._id}
                  data-testid={`approve-${tour._id}`}
                >
                  ✅ Onayla
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(tour._id);
                    setRejectionReason('');
                  }}
                  className="btn btn-outline btn-small"
                  style={{ flex: 1 }}
                  disabled={processing === tour._id}
                  data-testid={`reject-${tour._id}`}
                >
                  ❌ Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowRejectModal(null)}
          data-testid="reject-modal"
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>Turu Reddet</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--neutral-gray-700)' }}>
              Lütfen red nedenini belirtin. Bu mesaj tur şirketine gönderilecektir.
            </p>
            <textarea
              className="form-input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="örn: Otel bilgileri eksik, lütfen daha detaylı açıklama ekleyin."
              data-testid="rejection-reason-input"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setShowRejectModal(null)}
                className="btn btn-outline"
                data-testid="cancel-reject-btn"
              >
                İptal
              </button>
              <button
                onClick={handleReject}
                className="btn btn-primary"
                style={{ flex: 1, background: 'var(--error-red)' }}
                disabled={!rejectionReason.trim() || processing === showRejectModal}
                data-testid="confirm-reject-btn"
              >
                {processing === showRejectModal ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
