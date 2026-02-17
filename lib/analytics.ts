// Analytics helper — wraps gtag() for custom event tracking (AN-01)

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

type EventParams = Record<string, string | number | boolean | undefined>

export function trackEvent(eventName: string, params?: EventParams) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params)
    }
}
