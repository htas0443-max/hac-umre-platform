import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, Building, Building2, Plane, User, Package, Star, FileText, MessageCircle, Bell, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { toursApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import FavoriteButton from '../../components/FavoriteButton';
import TourAlertForm from '../../components/TourAlertForm';
import type { Tour } from '../../types';

export default function ToursList() {
  useSEO({
    title: 'Hac ve Umre Turları | Güvenilir Firmalar',
    description: 'Belge kontrolünden geçmiş güvenilir firmaların Hac ve Umre turlarını karşılaştırın. Güncel fiyatlar, tarih ve detayları inceleyin.',
    canonical: 'https://hacveumreturlari.net/tours',
  });

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTours, setSelectedTours] = useState<string[]>([]);

  // Filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [operator, setOperator] = useState('');
  const [currency, setCurrency] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAlertForm, setShowAlertForm] = useState(false);

  // Pull-to-Refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && listRef.current && listRef.current.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await loadTours();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, isRefreshing]);

  // Debounced filter values
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
  const [debouncedOperator, setDebouncedOperator] = useState('');

  // Debounce effect for text inputs (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
      setDebouncedOperator(operator);
    }, 500);

    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, operator]);

  // Load tours only when debounced values or sort options change
  useEffect(() => {
    loadTours();
  }, [debouncedMinPrice, debouncedMaxPrice, debouncedOperator, sortBy, sortOrder]);

  const loadTours = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 20,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      // Only add price params if they are valid numbers
      const minPriceNum = parseFloat(debouncedMinPrice);
      const maxPriceNum = parseFloat(debouncedMaxPrice);

      if (!isNaN(minPriceNum) && minPriceNum > 0) {
        params.min_price = minPriceNum;
      }
      if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
        params.max_price = maxPriceNum;
      }
      if (debouncedOperator.trim()) {
        params.operator = debouncedOperator.trim();
      }

      const data = await toursApi.getAll(params);
      setTours(data.tours);
      setError('');
    } catch (err: any) {
      setError('Turlar yüklenemedi');
      console.error('Tours load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTourSelection = (tourId: string) => {
    setSelectedTours(prev => {
      if (prev.includes(tourId)) {
        return prev.filter(id => id !== tourId);
      } else if (prev.length < 3) {
        return [...prev, tourId];
      }
      return prev;
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="tours-page" data-testid="tours-loading">
        <h1 style={{ marginBottom: '2rem' }}>Turlar Yükleniyor...</h1>
        <div className="grid grid-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '300px' }}>
              <div className="skeleton" style={{ height: '40px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '60px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '100px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '40px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="tours-page"
      data-testid="tours-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      ref={listRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className={`pull-refresh-indicator ${isRefreshing ? 'refreshing' : ''}`}
          style={{
            height: isRefreshing ? '40px' : `${pullDistance * 0.5}px`,
            opacity: isRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1),
          }}
        >
          <RefreshCw
            size={18}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
          {isRefreshing ? 'Yenileniyor...' : pullDistance >= PULL_THRESHOLD ? 'Bırakın' : 'Çekin'}
        </div>
      )}
      <motion.div
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={28} color="var(--primary-teal)" /> Hac & Umre Turları</h1>
            <p style={{ color: 'var(--neutral-gray-500)', fontSize: '1.125rem' }}>
              {tours.length} tur bulundu
            </p>
          </div>
          <motion.button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className={`btn ${showAlertForm ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            data-testid="tour-alert-toggle-btn"
          >
            <Bell size={18} />
            {showAlertForm ? 'Kapat' : 'Tur Alarmı Kur'}
          </motion.button>
        </div>
      </motion.div>

      {/* Tour Alert Form */}
      <AnimatePresence>
        {showAlertForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
          >
            <TourAlertForm
              onSuccess={() => setShowAlertForm(false)}
              onCancel={() => setShowAlertForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          className="alert alert-error"
          data-testid="tours-error"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        className="card glass"
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={20} color="var(--primary-teal)" /> Filtrele ve Sırala</h3>
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <div>
            <label className="form-label">Min Fiyat</label>
            <input
              type="text"
              inputMode="decimal"
              className="form-input"
              value={minPrice}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setMinPrice(value);
                }
              }}
              placeholder="örn: 10000"
              data-testid="filter-min-price"
            />
          </div>
          <div>
            <label className="form-label">Max Fiyat</label>
            <input
              type="text"
              inputMode="decimal"
              className="form-input"
              value={maxPrice}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setMaxPrice(value);
                }
              }}
              placeholder="örn: 100000"
              data-testid="filter-max-price"
            />
          </div>
          <div>
            <label className="form-label">Para Birimi</label>
            <select
              className="form-input"
              data-testid="filter-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="all">Tümü</option>
              <option value="TRY">₺ TRY</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
          <div>
            <label className="form-label">Operatör</label>
            <input
              type="text"
              className="form-input"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Operatör adı"
              data-testid="filter-operator"
            />
          </div>
          <div>
            <label className="form-label">Sıralama</label>
            <select
              className="form-input"
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const val = e.target.value;
                const lastUnderscore = val.lastIndexOf('_');
                setSortBy(val.substring(0, lastUnderscore));
                setSortOrder(val.substring(lastUnderscore + 1));
              }}
              data-testid="filter-sort"
            >
              <option value="created_at_desc">⏱ En Yeni</option>
              <option value="created_at_asc">⏱ En Eski</option>
              <option value="price_asc">₺ En Ucuz</option>
              <option value="price_desc">₺ En Pahalı</option>
              <option value="start_date_asc">↗ En Yakın Tarih</option>
              <option value="start_date_desc">↗ En Geç Tarih</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Compare Button */}
      <AnimatePresence>
        {selectedTours.length >= 2 && (
          <motion.div
            className="alert alert-info"
            style={{ marginBottom: '2rem' }}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Sparkles size={16} /> {selectedTours.length} tur seçildi</span>
              <Link
                to={`/compare?tours=${selectedTours.join(',')}`}
                className="btn btn-ai btn-small"
                data-testid="go-to-compare-btn"
              >
                <Bot size={16} style={{ marginRight: '0.25rem' }} /> AI ile Karşılaştır
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tours Grid */}
      <motion.div
        className="grid grid-2"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        <AnimatePresence mode="popLayout">
          {tours.map((tour, index) => (
            <motion.div
              key={tour._id}
              className="card hover-lift"
              data-testid={`tour-card-${tour._id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{tour.title}</h3>
                  <p style={{ color: 'var(--neutral-gray-500)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building size={16} color="var(--text-secondary)" /> {tour.operator}
                  </p>
                </div>
                <motion.input
                  type="checkbox"
                  checked={selectedTours.includes(tour._id)}
                  onChange={() => toggleTourSelection(tour._id)}
                  disabled={!selectedTours.includes(tour._id) && selectedTours.length >= 3}
                  style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: 'var(--primary-emerald)' }}
                  data-testid={`tour-checkbox-${tour._id}`}
                  whileTap={{ scale: 0.9 }}
                />
                <FavoriteButton tourId={tour._id} size={20} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <motion.div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--primary-emerald)',
                    marginBottom: '0.75rem'
                  }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
                >
                  {formatPrice(tour.price, tour.currency)}
                </motion.div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{tour.duration}</span>
                  {tour.rating && (
                    <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Star size={12} /> {tour.rating}</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="var(--primary-teal)" /> <strong>Otel:</strong> {tour.hotel}
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plane size={16} color="var(--primary-teal)" /> <strong>Ulaşım:</strong> {tour.transport}
                </p>
                <p style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--primary-teal)" /> <strong>Rehber:</strong> {tour.guide}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Package size={14} color="var(--primary-teal)" /> Hizmetler:</strong>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tour.services.slice(0, 3).map((service, idx) => (
                    <motion.span
                      key={idx}
                      className="badge badge-primary"
                      style={{ fontSize: '0.75rem' }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {service}
                    </motion.span>
                  ))}
                  {tour.services.length > 3 && (
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>+{tour.services.length - 3}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  to={`/tours/${tour._id}`}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  data-testid={`tour-detail-btn-${tour._id}`}
                >
                  <FileText size={16} style={{ marginRight: '0.25rem' }} /> İncele
                </Link>
                <a
                  href={`https://wa.me/905551234567?text=Merhaba, ${encodeURIComponent(tour.title)} hakkında bilgi almak istiyorum.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-reservation"
                  style={{ flex: 1 }}
                  data-testid={`tour-whatsapp-btn-${tour._id}`}
                >
                  <MessageCircle size={16} style={{ marginRight: '0.25rem' }} /> Rezerve Et
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {tours.length === 0 && !loading && (
        <motion.div
          className="card"
          style={{ textAlign: 'center', padding: '4rem 2rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ marginBottom: '1rem' }}><Search size={64} color="var(--text-muted)" /></div>
          <h3 style={{ marginBottom: '1rem' }}>Hiç tur bulunamadı</h3>
          <p style={{ color: 'var(--neutral-gray-500)', marginBottom: '1.5rem' }}>
            Lütfen filtreleri değiştirin veya daha sonra tekrar deneyin.
          </p>
          <button
            onClick={() => {
              setMinPrice('');
              setMaxPrice('');
              setOperator('');
              setCurrency('all');
            }}
            className="btn btn-primary"
          >
            Filtreleri Temizle
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
