import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function TermsPage() {
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
                        <FileText size={28} color="var(--primary-teal)" style={{ marginRight: '0.5rem' }} /> Kullanım Koşulları
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Son güncelleme: 17 Ocak 2026
                    </p>
                </div>

                <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>1. Genel Hükümler</h2>
                        <p>
                            Bu platform, Hac ve Umre turları hakkında bilgi sağlamak ve tur şirketleri ile kullanıcıları
                            bir araya getirmek amacıyla hizmet vermektedir. Platformumuzu kullanarak bu koşulları
                            kabul etmiş sayılırsınız.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>2. Hizmet Kapsamı</h2>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>Tur ilanlarının listelenmesi ve karşılaştırılması</li>
                            <li>Yapay zeka destekli tur önerileri</li>
                            <li>Tur şirketleri ile iletişim kolaylığı</li>
                            <li>Destek talep sistemi</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>3. Kullanıcı Sorumlulukları</h2>
                        <p>Kullanıcılar:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>Doğru ve güncel bilgi sağlamakla yükümlüdür</li>
                            <li>Hesap güvenliğinden kendileri sorumludur</li>
                            <li>Platformu yasalara uygun şekilde kullanmalıdır</li>
                            <li>Diğer kullanıcılara saygılı davranmalıdır</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>4. Tur Şirketi Sorumlulukları</h2>
                        <p>Tur şirketleri:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li>TÜRSAB belgeli olmalıdır</li>
                            <li>Doğru ve güncel tur bilgileri sağlamalıdır</li>
                            <li>Fiyat ve hizmet bilgilerini şeffaf şekilde paylaşmalıdır</li>
                            <li>Müşteri şikayetlerine zamanında yanıt vermelidir</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>5. Sorumluluk Reddi</h2>
                        <p>
                            Platform, tur şirketleri ile kullanıcılar arasında aracı konumundadır. Tur şirketlerinin
                            sunduğu hizmetlerin kalitesi, zamanlaması ve içeriği konusunda doğrudan sorumluluk
                            taşımamaktadır. Rezervasyon ve ödeme işlemleri doğrudan tur şirketi ile yapılır.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>6. Fikri Mülkiyet</h2>
                        <p>
                            Platformdaki tüm içerik, tasarım ve yazılım hakları saklıdır. İzinsiz kopyalama,
                            dağıtma veya değiştirme yasaktır.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>7. Değişiklikler</h2>
                        <p>
                            Bu koşullar önceden haber verilmeksizin güncellenebilir. Güncellemeler yayınlandığı
                            tarihten itibaren geçerlidir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>8. İletişim</h2>
                        <p>
                            Sorularınız için <Link to="/support" style={{ color: 'var(--primary-teal)' }}>destek sayfamız</Link> üzerinden
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
