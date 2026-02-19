import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../../api';
import { useSEO } from '../../hooks/useSEO';
import Breadcrumb from '../../components/Breadcrumb';

interface PlatformSettings {
    maintenance_mode: boolean;
    registration_enabled: boolean;
    default_commission_rate: number;
    seo_title: string;
    seo_description: string;
    contact_email: string;
    max_tours_per_operator: number;
    auto_approve_tours: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    maintenance_mode: false,
    registration_enabled: true,
    default_commission_rate: 10,
    seo_title: 'Hac & Umre Turları',
    seo_description: 'Güvenilir hac ve umre tur paketlerini karşılaştırın',
    contact_email: 'info@hacveumreturlari.net',
    max_tours_per_operator: 50,
    auto_approve_tours: false,
};

export default function AdminSettings() {
    const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useSEO({ title: 'Sistem Ayarları - Admin', noIndex: true });

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const result = await adminApi.getSettings();

            if (result.settings && Object.keys(result.settings).length > 0) {
                setSettings(prev => ({ ...prev, ...result.settings }));
            }
        } catch (err) {
            console.error('Ayarlar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await adminApi.updateSettings(settings as unknown as Record<string, any>);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Ayarlar kaydedilemedi';
            alert(msg);
            console.error(msg, err);
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const ToggleRow = ({ label, description, settingKey }: { label: string; description: string; settingKey: keyof PlatformSettings }) => (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 0', borderBottom: '1px solid var(--border-color)',
        }}>
            <div>
                <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</div>
            </div>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => updateSetting(settingKey, !settings[settingKey] as any)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: settings[settingKey] ? '#10B981' : '#9CA3AF' }}
            >
                {settings[settingKey] ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </motion.button>
        </div>
    );

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                Ayarlar yükleniyor...
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Breadcrumb />

            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Settings size={28} color="var(--primary-teal)" /> Sistem Ayarları
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Platform genelindeki ayarları yönetin
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: saved ? '#10B981' : undefined,
                        opacity: saving ? 0.6 : 1,
                    }}
                >
                    <Save size={16} />
                    {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
                </motion.button>
            </div>

            {/* Toggle Settings */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem' }}>🔧 Genel Ayarlar</h3>
                <ToggleRow label="Bakım Modu" description="Aktif olduğunda site bakım mesajı gösterir" settingKey="maintenance_mode" />
                <ToggleRow label="Kayıt Açık" description="Yeni kullanıcı kaydını aç/kapat" settingKey="registration_enabled" />
                <ToggleRow label="Otomatik Tur Onayı" description="Yeni eklenen turları otomatik onayla" settingKey="auto_approve_tours" />
            </div>

            {/* Numeric Settings */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem' }}>📊 Limitler & Oranlar</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                            Komisyon Oranı (%)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={settings.default_commission_rate}
                            onChange={e => updateSetting('default_commission_rate', Number(e.target.value))}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.9rem',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                            Operatör Başına Max Tur
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={settings.max_tours_per_operator}
                            onChange={e => updateSetting('max_tours_per_operator', Number(e.target.value))}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.9rem',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* SEO Settings */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem' }}>🔍 SEO Ayarları</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                            Site Başlığı
                        </label>
                        <input
                            type="text"
                            value={settings.seo_title}
                            onChange={e => updateSetting('seo_title', e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.9rem',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                            Meta Açıklama
                        </label>
                        <textarea
                            value={settings.seo_description}
                            onChange={e => updateSetting('seo_description', e.target.value)}
                            rows={2}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Contact */}
            <div className="card">
                <h3 style={{ margin: '0 0 1rem' }}>📧 İletişim</h3>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                        İletişim E-postası
                    </label>
                    <input
                        type="email"
                        value={settings.contact_email}
                        onChange={e => updateSetting('contact_email', e.target.value)}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)', fontSize: '0.9rem',
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
