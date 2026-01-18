import { useEffect } from 'react';

interface PageMetaProps {
    title: string;
    description?: string;
}

/**
 * PageMeta - Dinamik sayfa başlığı ve meta description ayarlar
 * Her sayfanın başında kullanılarak SEO iyileştirmesi sağlar
 */
export default function PageMeta({ title, description }: PageMetaProps) {
    useEffect(() => {
        // Sayfa başlığını güncelle
        document.title = `${title} | Hac & Umre Platformu`;

        // Meta description güncelle
        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            } else {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                metaDescription.setAttribute('content', description);
                document.head.appendChild(metaDescription);
            }
        }

        // Cleanup: Sayfa değiştiğinde eski title'ı temizleme gerekmez
        // çünkü her sayfa kendi title'ını set eder
    }, [title, description]);

    // Bu bileşen görsel çıktı üretmez
    return null;
}
