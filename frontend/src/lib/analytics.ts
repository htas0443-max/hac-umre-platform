/**
 * Analytics - Kullanıcı davranışı takibi
 * Google Analytics, Mixpanel veya özel backend ile entegre edilebilir
 */

type FavoriteEvent = {
    event: 'favorite_added' | 'favorite_removed';
    tour_id: number | string;
    source: 'tour_card' | 'tour_detail' | 'favorites_page';
    is_logged_in: boolean;
};

type AnalyticsEvent = FavoriteEvent | {
    event: string;
    [key: string]: any;
};

/**
 * Track an analytics event
 * Şu an console'a loglar, ileride GA/Mixpanel'e gönderilebilir
 */
export function trackEvent(eventData: AnalyticsEvent): void {
    // Development: Console log
    if (import.meta.env.DEV) {
        console.log('[Analytics]', eventData);
    }

    // Production: Google Analytics 4 (gtag) - varsa
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventData.event, {
            ...eventData,
            timestamp: new Date().toISOString(),
        });
    }

    // Production: Mixpanel - varsa
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.track(eventData.event, eventData);
    }
}

/**
 * Track favorite action
 */
export function trackFavorite(
    action: 'added' | 'removed',
    tourId: number | string,
    source: 'tour_card' | 'tour_detail' | 'favorites_page',
    isLoggedIn: boolean
): void {
    trackEvent({
        event: action === 'added' ? 'favorite_added' : 'favorite_removed',
        tour_id: tourId,
        source,
        is_logged_in: isLoggedIn,
    });
}

/**
 * Track favorite to contact conversion
 * Favori → İletişim dönüşümü
 */
export function trackFavoriteToContact(
    tourId: number | string,
    source: 'favorites_page' | 'tour_detail',
    isLoggedIn: boolean
): void {
    trackEvent({
        event: 'favorite_to_contact',
        tour_id: tourId,
        source,
        is_logged_in: isLoggedIn,
    });
}
