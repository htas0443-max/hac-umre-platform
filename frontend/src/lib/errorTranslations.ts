// Supabase ve diğer hata mesajlarını Türkçe'ye çevirir
const errorTranslations: Record<string, string> = {
    // Auth Errors
    'Invalid login credentials': 'Email veya şifre hatalı',
    'Email not confirmed': 'Email adresi doğrulanmamış. Lütfen email kutunuzu kontrol edin.',
    'User already registered': 'Bu email adresi zaten kayıtlı',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır',
    'Unable to validate email address: invalid format': 'Geçersiz email formatı',
    'Signup requires a valid password': 'Geçerli bir şifre gerekli',
    'User not found': 'Kullanıcı bulunamadı',
    'Invalid email or password': 'Geçersiz email veya şifre',
    'Email rate limit exceeded': 'Çok fazla deneme yaptınız, lütfen bekleyin',
    'For security purposes, you can only request this once every 60 seconds': 'Güvenlik nedeniyle 60 saniyede bir istek gönderebilirsiniz',
    'New password should be different from the old password': 'Yeni şifre eski şifreden farklı olmalı',
    'Auth session missing!': 'Oturum bulunamadı, lütfen tekrar giriş yapın',
    'JWT expired': 'Oturumunuz sona erdi, lütfen tekrar giriş yapın',
    'Token has expired or is invalid': 'Oturumunuz sona erdi veya geçersiz',
    'Email link is invalid or has expired': 'Email linki geçersiz veya süresi dolmuş',
    'Password recovery requires an email': 'Şifre sıfırlama için email gerekli',
    'Unable to process this request': 'İstek işlenemedi, lütfen tekrar deneyin',
    'Signups not allowed for this instance': 'Kayıtlar şu anda kapalı',
    'Email signups are disabled': 'Email ile kayıt devre dışı',
    'A user with this email address has already been registered': 'Bu email adresi zaten kayıtlı',
    'Email confirmation required': 'Email doğrulaması gerekli. Lütfen email kutunuzu kontrol edin.',

    // Network errors
    'Failed to fetch': 'Bağlantı hatası, internet bağlantınızı kontrol edin',
    'Network request failed': 'Ağ hatası, lütfen tekrar deneyin',
    'NetworkError': 'Ağ hatası oluştu',

    // Rate limiting
    'Too many requests': 'Çok fazla istek, lütfen biraz bekleyin',
    'Rate limit exceeded': 'İstek limiti aşıldı, lütfen bekleyin',
};

export function translateError(error: string): string {
    // Tam eşleşme kontrolü
    if (errorTranslations[error]) {
        return errorTranslations[error];
    }

    // Kısmi eşleşme kontrolü
    for (const [key, translation] of Object.entries(errorTranslations)) {
        if (error.toLowerCase().includes(key.toLowerCase())) {
            return translation;
        }
    }

    // Çeviri bulunamadıysa orijinal mesajı döndür
    // Ancak bazı genel terimleri Türkçeleştir
    if (error.toLowerCase().includes('already registered')) {
        return 'Bu email adresi zaten kayıtlı';
    }
    if (error.toLowerCase().includes('password')) {
        return 'Şifre ile ilgili bir hata oluştu';
    }
    if (error.toLowerCase().includes('email')) {
        return 'Email ile ilgili bir hata oluştu';
    }
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
        return 'Bağlantı hatası oluştu';
    }

    return 'Bir hata oluştu, lütfen tekrar deneyin';
}
