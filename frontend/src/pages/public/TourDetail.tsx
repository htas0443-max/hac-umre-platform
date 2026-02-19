import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Plane, User, FileText, Star, MapPin, Clock, PlaneTakeoff, PlaneLanding, Phone, MessageCircle, RefreshCw, MessageSquare, Trash2, ArrowLeft, Edit3 } from 'lucide-react';
import { toursApi } from '../../api';
import { useAuth } from '../../AuthContext';
import { useSEO } from '../../hooks/useSEO';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import VerifiedBadge from '../../components/VerifiedBadge';
import StickyCTA from '../../components/StickyCTA';
import FavoriteButton from '../../components/FavoriteButton';
import ReviewForm from '../../components/ReviewForm';
import OperatorRating from '../../components/OperatorRating';
import TourShareButtons from '../../components/TourShareButtons';
import { trackFavoriteToContact } from '../../lib/analytics';
import type { Tour } from '../../types';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [showReviewForm, setShowReviewForm] = useState(false);

  // SEO: Dinamik title ve description
  useSEO({
    title: tour ? `${tour.title} | ${tour.operator}` : 'Tur Detayı',
    description: tour
      ? `${tour.duration} süren ${tour.title}. ${tour.hotel}. ${tour.departure_location || 'Türkiye'}'den hareket. Detaylı bilgi ve iletişim için sayfayı ziyaret edin.`
      : undefined,
  });

  useEffect(() => {
    if (id) {
      loadTour();
    }
  }, [id]);

  // Track recently viewed when tour is loaded
  useEffect(() => {
    if (tour) {
      addToRecentlyViewed({
        id: tour._id,
        title: tour.title,
        operator: tour.operator,
        price: tour.price,
        currency: tour.currency
      });
    }
  }, [tour, addToRecentlyViewed]);

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
      {/* Mobile Above-the-Fold Hero */}
      <div className="tour-detail-hero" ref={heroRef}>
        <Link to="/tours" className="tour-detail-back" data-testid="back-to-tours" aria-label="Turlara geri dön">
          <ArrowLeft size={20} />
        </Link>

        <h1 className="tour-detail-hero-title" data-testid="tour-title">
          {tour.title}
        </h1>

        <div className="tour-detail-hero-operator">
          <span className="tour-detail-operator-name">{tour.operator}</span>
          <VerifiedBadge isVerified={tour.is_verified} />
          <FavoriteButton tourId={tour._id} size={22} source="tour_detail" />
        </div>

        <a
          href={tour.operator_phone
            ? `https://wa.me/${tour.operator_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, ${tour.title} hakkında bilgi almak istiyorum.`)}`
            : `https://wa.me/905551234567?text=${encodeURIComponent(`Merhaba, ${tour.title} hakkında bilgi almak istiyorum.`)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-cta-gold"
          data-testid="hero-cta-btn"
          onClick={() => trackFavoriteToContact(tour._id, 'tour_detail', !!user)}
        >
          <MessageCircle size={18} aria-hidden="true" />
          Firmayla İletişime Geç
        </a>
      </div>

      {/* Desktop Navigation Row */}
      <div className="tour-detail-nav-desktop">
        <Link to="/tours" className="btn btn-outline btn-small" data-testid="back-to-tours-desktop">
          ← Turlar
        </Link>
        {user?.role === 'admin' && (
          <button onClick={handleDelete} className="btn btn-outline btn-small" data-testid="delete-tour-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Trash2 size={16} /> Sil
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header tour-detail-card-header">
          <h1 className="card-title tour-detail-desktop-title" data-testid="tour-title-desktop">{tour.title}</h1>
          <p className="card-subtitle">{tour.operator}</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-emerald)', marginBottom: '1rem' }}>
            {formatPrice(tour.price, tour.currency)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{tour.duration}</span>
            {tour.rating && <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Star size={12} /> {tour.rating}</span>}
            <span className="badge badge-primary">{tour.start_date} - {tour.end_date}</span>
          </div>

          {/* Share Buttons */}
          <div style={{ marginTop: '1rem' }}>
            <TourShareButtons tourId={tour._id} tourTitle={tour.title} source="detail" />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Genel Bilgiler</h3>
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16} color="var(--primary-teal)" /> <strong>Otel:</strong></p>
              <p>{tour.hotel}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plane size={16} color="var(--primary-teal)" /> <strong>Ulaşım:</strong></p>
              <p>{tour.transport}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} color="var(--primary-teal)" /> <strong>Rehber:</strong></p>
              <p>{tour.guide}</p>
            </div>
            <div>
              <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} color="var(--primary-teal)" /> <strong>Vize:</strong></p>
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
              <PlaneTakeoff size={20} /> Kalkış ve Varış Bilgileri
            </h3>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              {tour.departure_location && (
                <div>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> Kalkış Yeri
                  </p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--neutral-gray-800)' }}>{tour.departure_location}</p>
                </div>
              )}
              {tour.departure_time && (
                <div>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Kalkış Saati
                  </p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--neutral-gray-800)' }}>{tour.departure_time}</p>
                </div>
              )}
              {tour.arrival_location && (
                <div style={{ gridColumn: tour.departure_location && tour.departure_time ? 'span 2' : 'auto' }}>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--neutral-gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PlaneLanding size={16} /> İniş/Varış Yeri
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
              <FileText size={20} color="var(--primary-teal)" /> Detaylı Açıklama
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
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={20} /> Firma ile İletişime Geç</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/905551234567?text=Merhaba, ${encodeURIComponent(tour.title)} hakkında bilgi almak istiyorum.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-reservation"
              data-testid="whatsapp-btn"
              style={{ flex: 1, minWidth: '200px' }}
            >
              <MessageCircle size={18} style={{ marginRight: '0.5rem' }} /> WhatsApp ile İletişim
            </a>
            <a
              href="tel:+905551234567"
              className="btn btn-call"
              data-testid="call-btn"
              style={{ flex: 1, minWidth: '200px' }}
            >
              <Phone size={18} style={{ marginRight: '0.5rem' }} /> Hemen Ara
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to={`/compare?tours=${tour._id}`}
            className="btn btn-ai"
            data-testid="compare-from-detail-btn"
          >
            <RefreshCw size={18} style={{ marginRight: '0.5rem' }} /> Bu Turu Karşılaştır
          </Link>
          <Link
            to={`/chat?tour=${tour._id}`}
            className="btn btn-outline"
            data-testid="chat-from-detail-btn"
          >
            <MessageSquare size={18} style={{ marginRight: '0.5rem' }} /> AI ile Soru Sor
          </Link>
        </div>

        {/* Review Section */}
        <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Firma Değerlendirmesi</h3>
              <OperatorRating operatorName={tour.operator} />
            </div>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn btn-outline btn-small"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Edit3 size={16} /> Değerlendir
              </button>
            )}
          </div>
          {showReviewForm && (
            <ReviewForm
              operatorName={tour.operator}
              tourId={typeof tour._id === 'number' ? tour._id : undefined}
              onSuccess={() => setShowReviewForm(false)}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
          {!showReviewForm && !user && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Link to="/login">Giriş yaparak</Link> bu firmayı değerlendirebilirsiniz.
            </p>
          )}
        </div>
      </div>

      {/* Sticky CTA for mobile */}
      <StickyCTA
        phone={tour.operator_phone}
        tourTitle={tour.title}
        heroRef={heroRef}
      />
    </div>
  );
}
