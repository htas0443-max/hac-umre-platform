import React, { useState } from 'react';
import { importApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // SEO: noindex - admin import sayfası indexlenmemeli
  useSEO({ title: 'CSV Import', noIndex: true });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await importApi.uploadCSV(file);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Yükleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-import-page" data-testid="admin-import-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1>CSV Import</h1>
        <p style={{ color: 'var(--neutral-gray-500)' }}>Toplu tur yüklemesi için CSV dosyası yükleyin</p>
      </div>

      {/* CSV Format Info */}
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--primary-light)' }}>
        <h3 style={{ marginBottom: '1rem' }}>CSV Formatı</h3>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Gerekli alanlar:</p>
        <code style={{ display: 'block', background: 'white', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          title, operator, price, currency, duration, hotel, visa
        </code>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Para birimleri: TRY, USD, EUR</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Opsiyonel alanlar:</p>
        <code style={{ display: 'block', background: 'white', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          start_date, end_date, services (virgülle ayrılmış), transport, guide, itinerary (| ile ayrılmış), rating
        </code>
      </div>

      {error && (
        <div className="alert alert-error" data-testid="import-error">{error}</div>
      )}

      {result && (
        <div className="alert alert-success" data-testid="import-result">
          <p><strong>Başarılı:</strong> {result.imported} tur import edildi</p>
          {result.errors > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p><strong>Hatalar:</strong> {result.errors} satırda hata</p>
              {result.error_details && result.error_details.length > 0 && (
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {result.error_details.map((err: any, idx: number) => (
                    <li key={idx} style={{ fontSize: '0.875rem' }}>
                      Satır {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Form */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Dosya Yükle</h3>
        <div className="form-group">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="form-input"
            data-testid="csv-file-input"
          />
          {file && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--neutral-gray-500)' }}>
              Seçilen dosya: {file.name}
            </p>
          )}
        </div>
        <button
          onClick={handleUpload}
          className="btn btn-primary"
          disabled={!file || loading}
          data-testid="upload-csv-btn"
        >
          {loading ? 'Yükleniyor...' : 'CSV Yükle'}
        </button>
      </div>

      {/* Sample CSV */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Örnek CSV</h3>
        <pre style={{ background: 'var(--neutral-beige)', padding: '1rem', borderRadius: '4px', fontSize: '0.75rem', overflowX: 'auto' }}>
          {`title,operator,price,currency,duration,hotel,visa,services,transport,guide
Ekonomik Umre,ABC Turizm,12000,TRY,7 gün,Makkah Hotel 3*,Dahil,Ulaşım,Rehber,Havaalanı transferi,Türk Hava Yolları,Türkçe rehber
VIP Hac,XYZ Organizasyon,8500,USD,15 gün,Hilton 5*,Dahil,Ulaşım,VIP transfer,Yemek,Business class,Uzman rehber
Ramazan Umresi,DEF Seyahat,2200,EUR,10 gün,Intercontinental 4*,Dahil,Ulaşım,Transfer,Rehber,Direkt uçuş,Deneyimli rehber`}
        </pre>
      </div>
    </div>
  );
}
