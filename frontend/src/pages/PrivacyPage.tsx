import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <motion.div
            style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="card">
                <div className="card-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-teal)' }}>
                        <Shield size={28} color="var(--primary-teal)" style={{ marginRight: '0.5rem' }} /> Gizlilik Politikası
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Son güncelleme: 17 Ocak 2026
                    </p>
                </div>

                <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>1. Toplanan Veriler</h2>
                        <p>Platformumuz aşağıdaki bilgileri toplayabilir:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi</li>
                            <li><strong>İletişim Bilgileri:</strong> Telefon numarası (opsiyonel)</li>
                            <li><strong>Kullanım Verileri:</strong> Sayfa görüntüleme, tıklama, arama geçmişi</li>
                            <li><strong>Cihaz Bilgileri:</strong> Tarayıcı türü, IP adresi, cihaz türü</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>2. Verilerin Kullanımı</h2>
                        <p>Topladığımız veriler şu amaçlarla kullanılır:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>Hesap oluşturma ve yönetimi</li>
                            <li>Hizmet kalitesinin iyileştirilmesi</li>
                            <li>Kişiselleştirilmiş tur önerileri sunma</li>
                            <li>Destek taleplerinin işlenmesi</li>
                            <li>Güvenlik ve dolandırıcılık önleme</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>3. Veri Güvenliği</h2>
                        <p>Verilerinizin güvenliği bizim için önemlidir:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>SSL/TLS şifreleme kullanılmaktadır</li>
                            <li>Şifreler güvenli şekilde hashlenmektedir</li>
                            <li>Erişim yetkileri sınırlandırılmıştır</li>
                            <li>Düzenli güvenlik denetimleri yapılmaktadır</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>4. Veri Paylaşımı</h2>
                        <p>Verileriniz şu durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>Yasal zorunluluk durumunda</li>
                            <li>Hizmet sağlayıcılarımızla (ödeme işlemcileri, hosting)</li>
                            <li>Açık onayınız olduğunda</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>5. Çerezler (Cookies)</h2>
                        <p>
                            Platformumuz, kullanıcı deneyimini iyileştirmek için çerezler kullanır.
                            Bu çerezler oturum yönetimi ve tercihlerinizin hatırlanması için gereklidir.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>6. KVKK Hakları</h2>
                        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>Verilerinize erişim talep edebilirsiniz</li>
                            <li>Yanlış verilerin düzeltilmesini isteyebilirsiniz</li>
                            <li>Verilerinizin silinmesini talep edebilirsiniz</li>
                            <li>Veri işleme faaliyetlerine itiraz edebilirsiniz</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>7. Veri Saklama</h2>
                        <p>
                            Verileriniz, hizmet sunumu için gerekli süre boyunca veya yasal zorunluluklar
                            gereği saklanır. Hesap silme talebiniz halinde verileriniz 30 gün içinde silinir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>8. İletişim</h2>
                        <p>
                            Gizlilik politikamız hakkında sorularınız için{' '}
                            <Link to="/support" style={{ color: 'var(--primary-teal)' }}>destek sayfamız</Link> üzerinden
                            bize ulaşabilirsiniz.
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" className="btn btn-outline">
                        ← Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
