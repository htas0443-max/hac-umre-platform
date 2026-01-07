import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toursApi, aiApi } from '../api';
import type { Tour, ComparisonResult } from '../types';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const [tours, setTours] = useState<Tour[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('anthropic');

  useEffect(() => {
    const tourIds = searchParams.get('tours')?.split(',') || [];
    if (tourIds.length >= 2) {
      loadTours(tourIds);
    }
  }, [searchParams]);

  const loadTours = async (tourIds: string[]) => {
    try {
      const tourPromises = tourIds.map(id => toursApi.getById(id));
      const toursData = await Promise.all(tourPromises);
      setTours(toursData);
    } catch (err: any) {
      setError('Turlar yüklenemedi');
    }
  };

  const handleCompare = async () => {
    if (tours.length < 2) {
      setError('En az 2 tur seçmelisiniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await aiApi.compare(
        tours.map(t => t._id),
        ['fiyat', 'konfor', 'hizmetler', 'süre', 'konum'],
        provider
      );
      setComparison(result);
    } catch (err: any) {
      setError('Karşılaştırma başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <motion.div 
      className="compare-page" 
      data-testid="compare-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🔄 AI Karşılaştırma</h1>
        <p style={{ color: 'var(--neutral-gray-500)', fontSize: '1.125rem' }}>
          {tours.length} tur seçildi - Yapay zeka ile detaylı karşılaştırma
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="alert alert-error" 
            data-testid="compare-error"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Provider Selection */}
      <motion.div 
        className="card glass" 
        style={{ marginBottom: '2rem', background: 'var(--ai-background)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 style={{ marginBottom: '1rem' }}>🧠 AI Model Seçimi</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <motion.label 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              cursor: 'pointer',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: provider === 'openai' ? 'white' : 'transparent',
              border: '2px solid',
              borderColor: provider === 'openai' ? 'var(--primary-emerald)' : 'var(--neutral-gray-300)',
              flex: 1
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={provider === 'openai'}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="provider-openai"
              style={{ accentColor: 'var(--primary-emerald)' }}
            />
            <span style={{ fontWeight: 600 }}>OpenAI GPT-5</span>
          </motion.label>
          <motion.label 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              cursor: 'pointer',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: provider === 'anthropic' ? 'white' : 'transparent',
              border: '2px solid',
              borderColor: provider === 'anthropic' ? 'var(--ai-primary)' : 'var(--neutral-gray-300)',
              flex: 1
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="provider"
              value="anthropic"
              checked={provider === 'anthropic'}
              onChange={(e) => setProvider(e.target.value)}
              data-testid="provider-anthropic"
              style={{ accentColor: 'var(--ai-primary)' }}
            />
            <span style={{ fontWeight: 600 }}>Claude Sonnet 4 ⚡</span>
          </motion.label>
        </div>
        <motion.button 
          onClick={handleCompare} 
          className="btn btn-ai" 
          style={{ marginTop: '1rem', width: '100%' }}
          disabled={loading || tours.length < 2}
          data-testid="compare-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? '🔄 Karşılaştırılıyor...' : '🤖 AI ile Karşılaştır'}
        </motion.button>
      </motion.div>

      {/* Tours Grid */}
      <motion.div 
        className="grid grid-3" 
        style={{ marginBottom: '3rem' }}
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        {tours.map((tour, idx) => (
          <motion.div 
            key={tour._id} 
            className="card hover-lift" 
            data-testid={`compare-tour-${idx}`}
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 }
            }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 style={{ marginBottom: '1rem' }}>{tour.title}</h3>
            <motion.div 
              style={{ 
                fontSize: '1.75rem', 
                fontWeight: 700, 
                color: 'var(--primary-emerald)', 
                marginBottom: '0.75rem' 
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 + 0.3, type: 'spring' }}
            >
              {formatPrice(tour.price, tour.currency)}
            </motion.div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="badge badge-primary">{tour.duration}</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-gray-700)', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>🏨 Otel:</strong> {tour.hotel}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>🏬 Operatör:</strong> {tour.operator}</p>
              <p><strong>📦 Hizmetler:</strong> {tour.services.length} adet</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Comparison Results */}
      <AnimatePresence>
        {comparison && (
          <motion.div 
            className="card glass" 
            style={{ background: 'var(--ai-background)' }} 
            data-testid="comparison-results"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="card-header">
              <h2 className="card-title">✨ AI Karşılaştırma Sonucu</h2>
              <span className="badge badge-ai">🤖 {comparison.provider}</span>
            </div>

            {comparison.summary && (
              <motion.div 
                style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span> Özet
                </h3>
                <p style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>{comparison.summary}</p>
              </motion.div>
            )}

            {comparison.recommendations && comparison.recommendations.length > 0 && (
              <motion.div 
                style={{ marginBottom: '2rem' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span> Öneriler
                </h3>
                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  {comparison.recommendations.map((rec, idx) => (
                    <motion.div 
                      key={idx} 
                      className="card hover-lift" 
                      style={{ background: 'white' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <h4 style={{ color: 'var(--ai-primary)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                        {rec.type}
                      </h4>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{rec.suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {comparison.scores && Object.keys(comparison.scores).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏆</span> Puanlar
                </h3>
                <div className="grid grid-3" style={{ gap: '1rem' }}>
                  {Object.entries(comparison.scores).map(([tourKey, scores], idx) => (
                    <motion.div 
                      key={tourKey} 
                      className="card hover-lift" 
                      style={{ background: 'white' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <h4 style={{ marginBottom: '1rem', color: 'var(--primary-emerald)' }}>
                        Tur {parseInt(tourKey.replace('tour', ''))}
                      </h4>
                      <div style={{ fontSize: '0.875rem' }}>
                        <motion.div 
                          style={{ 
                            marginBottom: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'var(--primary-light)'
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>Genel Puan</p>
                          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-emerald)' }}>
                            {scores.overall}<span style={{ fontSize: '1rem' }}>/100</span>
                          </p>
                        </motion.div>
                        <p style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Fiyat/Performans:</strong>
                          <span style={{ color: 'var(--accent-gold-dark)', fontWeight: 700 }}>{scores.value_for_money}/100</span>
                        </p>
                        <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Konfor:</strong>
                          <span style={{ color: 'var(--ai-primary)', fontWeight: 700 }}>{scores.comfort}/100</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {tours.length < 2 && (
        <motion.div 
          className="card" 
          style={{ textAlign: 'center', padding: '4rem 2rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '1rem' }}>Karşılaştırmak için en az 2 tur gerekli</h3>
          <p style={{ color: 'var(--neutral-gray-500)', marginBottom: '1.5rem' }}>
            Turlar sayfasından 2-3 tur seçin ve tekrar gelin.
          </p>
          <a href="/tours" className="btn btn-primary">🌍 Turlar Sayfasına Git</a>
        </motion.div>
      )}
    </motion.div>
  );
}
