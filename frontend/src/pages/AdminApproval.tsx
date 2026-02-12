import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Search, CheckSquare, CheckCircle, XCircle, Clock, Building2, MapPin, Inbox } from 'lucide-react';
import { adminApi, toursApi } from '../api';
import { useSEO } from '../hooks/useSEO';
import StatusBadge from '../components/StatusBadge';
import Breadcrumb from '../components/Breadcrumb';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { toast } from 'sonner';
import type { Tour } from '../types';

export default function AdminApproval() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // New features: search and bulk selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // SEO: noindex - admin onay ekranı indexlenmemeli
  useSEO({ title: 'Tur Onay Yönetimi', noIndex: true });

  useEffect(() => {
    loadPendingTours();
  }, []);

  const loadPendingTours = useCallback(async () => {
    try {
      setLoading(true);
      const data = await toursApi.getAll({ status: 'pending', limit: 20 } as any);
      setTours(data.tours);
    } catch (err) {
      console.error('Turlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔴 Realtime: Yeni pending tur geldiğinde anlık güncelleme
  useRealtimeSubscription('tours', 'INSERT', (payload) => {
    if (payload.new?.status === 'pending') {
      toast.info('🆕 Yeni tur onay bekliyor!', { duration: 5000 });
      loadPendingTours();
    }
  });

  // Filtered tours based on search
  const filteredTours = useMemo(() => {
    if (!searchQuery.trim()) return tours;
    const query = searchQuery.toLowerCase();
    return tours.filter(tour =>
      tour.title.toLowerCase().includes(query) ||
      tour.operator.toLowerCase().includes(query)
    );
  }, [tours, searchQuery]);

  // Selection handlers
  const toggleSelection = (tourId: string) => {
    setSelectedTours(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tourId)) {
        newSet.delete(tourId);
      } else {
        newSet.add(tourId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTours.size === filteredTours.length) {
      setSelectedTours(new Set());
    } else {
      setSelectedTours(new Set(filteredTours.map(t => t._id)));
    }
  };

  const clearSelection = () => {
    setSelectedTours(new Set());
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedTours.size === 0) return;
    if (!window.confirm(`${selectedTours.size} turu onaylamak istediğinizden emin misiniz?`)) return;

    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedTours).map(id => adminApi.approveTour(id));
      await Promise.all(promises);
      setTours(tours.filter(t => !selectedTours.has(t._id)));
      clearSelection();
    } catch (err: any) {
      alert('Bazı turlar onaylanamadı: ' + (err.message || 'Hata'));
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleApprove = async (tourId: string) => {
    if (!window.confirm('Bu turu onaylamak istediğinizden emin misiniz?')) return;

    try {
      setProcessing(tourId);
      await adminApi.approveTour(tourId);
      setTours(tours.filter(t => t._id !== tourId));
      selectedTours.delete(tourId);
      setSelectedTours(new Set(selectedTours));
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
      selectedTours.delete(showRejectModal);
      setSelectedTours(new Set(selectedTours));
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
    return (
      <div className="loading-container" data-testid="admin-approval-loading">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="admin-approval"
      data-testid="admin-approval"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Crown size={28} color="var(--accent-gold)" /> Tur Onay Yönetimi</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {tours.length} tur onay bekliyor
        </p>
      </div>

      {/* Search Bar */}
      <div className="admin-search">
        <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="admin-search-input"
          placeholder="Tur başlığı veya operatör ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input"
        />
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedTours.size > 0 && (
          <motion.div
            className="bulk-action-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bulk-action-bar-info">
              <span className="bulk-action-bar-count">
                <CheckSquare size={16} /> {selectedTours.size} tur seçildi
              </span>
              <button
                onClick={clearSelection}
                className="btn btn-small btn-outline"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
              >
                Seçimi Temizle
              </button>
            </div>
            <div className="bulk-action-bar-actions">
              <button
                onClick={handleBulkApprove}
                className="btn btn-small btn-bulk-approve"
                disabled={bulkProcessing}
              >
                {bulkProcessing ? <><Clock size={16} /> İşleniyor...</> : <><CheckCircle size={16} /> Toplu Onayla</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tours List */}
      {filteredTours.length === 0 ? (
        <motion.div
          className="card"
          style={{ textAlign: 'center', padding: '3rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ marginBottom: '1rem' }}><Inbox size={48} color="var(--text-muted)" /></div>
          <p>{searchQuery ? 'Arama sonucu bulunamadı.' : 'Onay bekleyen tur yok.'}</p>
        </motion.div>
      ) : (
        <>
          {/* Select All */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedTours.size === filteredTours.length && filteredTours.length > 0}
                onChange={toggleSelectAll}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Tümünü Seç ({filteredTours.length})</span>
            </label>
          </div>

          <motion.div
            className="grid grid-2"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            <AnimatePresence>
              {filteredTours.map((tour) => (
                <motion.div
                  key={tour._id}
                  className={`card ${selectedTours.has(tour._id) ? 'selected' : ''}`}
                  data-testid={`tour-${tour._id}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    border: selectedTours.has(tour._id) ? '2px solid var(--primary-teal)' : undefined,
                    background: selectedTours.has(tour._id) ? 'rgba(13, 148, 136, 0.03)' : undefined
                  }}
                >
                  {/* Selection Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedTours.has(tour._id)}
                      onChange={() => toggleSelection(tour._id)}
                      style={{ width: '20px', height: '20px' }}
                      data-testid={`select-${tour._id}`}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.25rem' }}>{tour.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        🏬 {tour.operator}
                      </p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-teal)', marginBottom: '0.5rem' }}>
                      {formatPrice(tour.price, tour.currency)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{tour.duration}</span>
                      {tour.rating && <span className="badge badge-gold">⭐ {tour.rating}</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={14} color="var(--primary-teal)" /> {tour.hotel}</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="var(--primary-teal)" /> {tour.start_date} - {tour.end_date}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApprove(tour._id)}
                      className="btn btn-primary btn-small"
                      style={{ flex: 1 }}
                      disabled={processing === tour._id}
                      data-testid={`approve-${tour._id}`}
                    >
                      {processing === tour._id ? <Clock size={14} /> : <CheckCircle size={14} />} Onayla
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
                      <XCircle size={14} /> Reddet
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(null)}
            data-testid="reject-modal"
          >
            <motion.div
              className="card"
              style={{ maxWidth: '500px', width: '90%' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1rem' }}>❌ Turu Reddet</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
