import { motion } from 'framer-motion';
import { Shield, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import PageMeta from '../../components/PageMeta';

export default function VerificationPage() {
    const steps = [
        { number: 1, text: 'Firma başvuru yapar', icon: Users },
        { number: 2, text: 'Gerekli belgeler yüklenir', icon: FileText },
        { number: 3, text: 'Belgeler ekip tarafından incelenir', icon: Shield },
        { number: 4, text: 'Uygun bulunan firmaların ilanları yayınlanır', icon: CheckCircle },
        { number: 5, text: 'Uygun bulunmayan başvurular reddedilir', icon: XCircle },
    ];

    return (
        <>
            <PageMeta
                title="Kurumlar ve İlanlar Nasıl Doğrulanır?"
                description="Hac ve Umre platformunda tur şirketleri ve ilanların doğrulama süreci hakkında bilgi edinin."
            />
            <motion.div
                style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="card" style={{ padding: '2rem' }}>
                    <h1 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        color: 'var(--primary-teal)'
                    }}>
                        <Shield size={32} />
                        Kurumlar ve İlanlar Nasıl Doğrulanır?
                    </h1>

                    {/* Neden Belge İstiyoruz */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Neden Belge İstiyoruz?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Platformumuzda yalnızca gerçek ve güvenilir tur şirketlerinin yer almasını istiyoruz.
                            Bu nedenle her tur şirketinden, faaliyet gösterebileceğini kanıtlayan resmi belgeler talep ediyoruz.
                        </p>
                    </section>

                    {/* Doğrulama Süreci */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                            Doğrulama Süreci
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: step.number === 4 ? 'rgba(16, 185, 129, 0.1)' :
                                            step.number === 5 ? 'rgba(239, 68, 68, 0.1)' :
                                                'var(--bg-secondary)',
                                        borderRadius: '12px',
                                        border: step.number === 4 ? '1px solid rgba(16, 185, 129, 0.3)' :
                                            step.number === 5 ? '1px solid rgba(239, 68, 68, 0.3)' :
                                                '1px solid var(--border-color)'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: step.number === 4 ? 'var(--primary-teal)' :
                                            step.number === 5 ? '#EF4444' :
                                                'var(--primary-teal)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        {step.number}
                                    </div>
                                    <step.icon
                                        size={20}
                                        color={step.number === 4 ? '#10B981' :
                                            step.number === 5 ? '#EF4444' :
                                                'var(--primary-teal)'}
                                        aria-hidden="true"
                                    />
                                    <span style={{
                                        color: 'var(--text-primary)',
                                        fontWeight: 500
                                    }}>
                                        {step.text}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Belgeler Kimler Tarafından Görülür */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Belgeler Kimler Tarafından Görülür?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Yüklenen belgeler <strong>yalnızca platform ekibimiz</strong> tarafından incelenir.
                            Belgeler hiçbir kullanıcıyla paylaşılmaz ve sadece doğrulama amacıyla kullanılır.
                        </p>
                    </section>

                    {/* Kullanıcı Neden Belge Görmez */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Kullanıcı Neden Belge Görmez?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Belge numaraları ve şirket detayları hassas bilgilerdir. Bunların herkese açık olması sahteciliği kolaylaştırabilir.
                            Bu nedenle kullanıcılar yalnızca <strong>"Doğrulanmış Firma"</strong> rozetini görür.
                        </p>
                    </section>

                    {/* Bu Sistem Sizi Nasıl Korur */}
                    <section style={{
                        padding: '1.5rem',
                        background: 'rgba(13, 148, 136, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(13, 148, 136, 0.2)'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            marginBottom: '1rem',
                            color: 'var(--primary-teal)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <CheckCircle size={20} />
                            Bu Sistem Sizi Nasıl Korur?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                            Platformda gördüğünüz her ilan, kontrolden geçmiş bir firmaya aittir.
                            Sahte firmalar platforma giremez ve kullanıcılar güvenle tur arayabilir.
                        </p>
                    </section>
                </div>
            </motion.div>
        </>
    );
}
