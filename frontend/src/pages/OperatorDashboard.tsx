import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Sparkles, BarChart3, CheckCircle, Clock, Inbox, XCircle, Building2, MapPin, Package, Edit, Eye, Star } from 'lucide-react';
import { operatorApi } from '../api';
import { useAuth } from '../AuthContext';
import { useSEO } from '../hooks/useSEO';
import OperatorReviews from '../components/OperatorReviews';
import type { Tour } from '../types';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // SEO: noindex - operatör paneli indexlenmemeli
  useSEO({ title: 'Operatör Dashboard', noIndex: true });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toursData, statsData] = await Promise.all([
        operatorApi.getMyTours(0, 50, filter === 'all' ? undefined : filter),
        operatorApi.getStats()
      ]);
      setTours(toursData.tours);
      setStats(statsData);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'approved': { class: 'badge-primary', text: 'Onaylı' },
      'pending': { class: 'badge badge-gold', text: 'Onay Bekliyor' },
      'draft': { class: 'badge', text: 'Taslak' },
      'rejected': { class: 'badge', text: 'Reddedildi', style: { background: '#FFEBEE', color: '#EF5350' } }
    };
    const badge = badges[status] || badges.draft;
    return <span className={badge.class} style={badge.style}>{badge.text}</span>;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="loading" data-testid="dashboard-loading">
        <div className="spinner-multi" />
        <p style={{ marginLeft: '1rem' }}>Dashboard yükleniyor...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="operator-dashboard"
      data-testid="operator-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="slide-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={28} color="var(--primary-teal)" /> {user?.company_name || 'Tur Şirketi'} Dashboard</h1>
          <p style={{ color: 'var(--neutral-gray-500)', fontSize: '1.125rem' }}>Turlarınızı yönetin</p>
        </div>
        <Link to="/operator/create" className="btn btn-primary" data-testid="create-tour-btn">
          <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> Yeni Tur İlanı
        </Link>
      </motion.div>

      {/* Stats Cards with Advanced Animations */}
      {stats && (
        <motion.div
          className="grid grid-3"
          style={{ marginBottom: '2rem' }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          <motion.div
            className="card premium-card glow-hover"
            style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #A8D5BA 100%)' }}
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotateY: -90 },
              visible: { opacity: 1, scale: 1, rotateY: 0 }
            }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.h3
              style={{ color: 'var(--primary-emerald)', fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 700 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              {stats.total_tours}
            </motion.h3>
            <p style={{ color: 'var(--neutral-gray-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={18} /> Toplam Tur</p>
          </motion.div>

          <motion.div
            className="card premium-card pulse-ring"
            style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #02C39A 100%)' }}
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotateY: -90 },
              visible: { opacity: 1, scale: 1, rotateY: 0 }
            }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.h3
              style={{ color: 'var(--ai-primary)', fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 700 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              {stats.approved_tours}
            </motion.h3>
            <p style={{ color: 'var(--neutral-gray-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={18} color="#10B981" /> Yayında</p>
          </motion.div>

          <motion.div
            className="card premium-card heartbeat"
            style={{ background: 'linear-gradient(135deg, #E8D7A0 0%, #D4AF37 100%)' }}
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotateY: -90 },
              visible: { opacity: 1, scale: 1, rotateY: 0 }
            }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.h3
              style={{ color: 'var(--accent-gold-dark)', fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 700 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              {stats.pending_tours}
            </motion.h3>
            <p style={{ color: 'var(--neutral-gray-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} color="#D97706" /> Onay Bekliyor</p>
            {stats.pending_tours > 0 && (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--neutral-gray-600)',
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                Başvurunuz inceleme sırasında. Sonuç e-posta ile bildirilecektir.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Filter Buttons */}
      <motion.div
        className="card glass"
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'Tümü', count: stats?.total_tours || 0 },
            { value: 'approved', label: 'Yayında', count: stats?.approved_tours || 0 },
            { value: 'pending', label: 'Onay Bekliyor', count: stats?.pending_tours || 0 },
            { value: 'draft', label: 'Taslak', count: stats?.draft_tours || 0 },
            { value: 'rejected', label: 'Reddedilen', count: stats?.rejected_tours || 0 }
          ].map((item) => (
            <motion.button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={filter === item.value ? 'btn btn-primary btn-small' : 'btn btn-outline btn-small'}
              data-testid={`filter-${item.value}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label} ({item.count})
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tours Grid */}
      <AnimatePresence mode="popLayout">
        {tours.length === 0 ? (
          <motion.div
            className="card"
            style={{ textAlign: 'center', padding: '4rem 2rem' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div style={{ marginBottom: '1rem' }}><Inbox size={64} color="var(--text-muted)" /></div>
            <h3 style={{ marginBottom: '1rem' }}>Henüz tur ilanınız yok</h3>
            <p style={{ color: 'var(--neutral-gray-500)', marginBottom: '1.5rem' }}>
              İlk turunuzu oluşturun ve platformda yayınlanmasını sağlayın.
            </p>
            <Link to="/operator/create" className="btn btn-primary">
              <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> İlk Turunuzu Oluşturun
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-2"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            initial="hidden"
            animate="visible"
          >
            {tours.map((tour, index) => (
              <motion.div
                key={tour._id}
                className="card tilt-hover shadow-lift"
                data-testid={`tour-card-${tour._id}`}
                variants={{
                  hidden: { opacity: 0, y: 50, rotateX: -15 },
                  visible: { opacity: 1, y: 0, rotateX: 0 }
                }}
                whileHover={{
                  scale: 1.03,
                  rotateY: 3,
                  transition: { type: 'spring', stiffness: 300 }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', flex: 1 }}>{tour.title}</h3>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                  >
                    {getStatusBadge(tour.status)}
                  </motion.div>
                </div>

                {tour.status === 'rejected' && tour.rejection_reason && (
                  <motion.div
                    className="alert alert-error"
                    style={{ marginBottom: '1rem', fontSize: '0.875rem' }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.3 }}
                  >
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14} color="#DC2626" /> Red Nedeni:</strong> {tour.rejection_reason}
                  </motion.div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <motion.div
                    style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-emerald)', marginBottom: '0.5rem' }}
                    className="golden-shine"
                  >
                    {formatPrice(tour.price, tour.currency)}
                  </motion.div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{tour.duration}</span>
                    {tour.rating && <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star size={12} /> {tour.rating}</span>}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  <p style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={14} color="var(--primary-teal)" /> <strong>Otel:</strong> {tour.hotel}</p>
                  <p style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="var(--primary-teal)" /> <strong>Tarih:</strong> {tour.start_date} - {tour.end_date}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={14} color="var(--primary-teal)" /> <strong>Hizmetler:</strong> {tour.services.length} adet</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/operator/edit/${tour._id}`}
                    className="btn btn-outline btn-small ripple-effect"
                    style={{ flex: 1 }}
                    data-testid={`edit-btn-${tour._id}`}
                  >
                    <Edit size={14} style={{ marginRight: '0.25rem' }} /> Düzenle
                  </Link>
                  <Link
                    to={`/tours/${tour._id}`}
                    className="btn btn-primary btn-small"
                    style={{ flex: 1 }}
                    data-testid={`view-btn-${tour._id}`}
                  >
                    <Eye size={14} style={{ marginRight: '0.25rem' }} /> Görüntüle
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operator Reviews Section */}
      <div style={{ marginTop: '2rem' }}>
        <OperatorReviews />
      </div>
    </motion.div>
  );
}
