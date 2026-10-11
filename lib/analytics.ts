// Analytics helper: wraps gtag() for custom event tracking (AN-01)

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

export type EntryDoor = 'photo_tool' | 'ymm_selector' | 'browse_by_vehicle' | 'blog' | 'direct_or_other'

const ENTRY_DOOR_KEY = 'vf_entry_door'

export function getEntryDoor(): EntryDoor {
    if (typeof window === 'undefined') return 'direct_or_other'
    return (window.sessionStorage.getItem(ENTRY_DOOR_KEY) as EntryDoor) || 'direct_or_other'
}

export function setEntryDoor(door: EntryDoor) {
    if (typeof window === 'undefined') return
    if (!window.sessionStorage.getItem(ENTRY_DOOR_KEY)) {
        window.sessionStorage.setItem(ENTRY_DOOR_KEY, door)
    }
}

const LANDING_PATH_KEY = 'vf_landing_path'

/** Record the first path seen this session (call once per page load). */
export function recordLandingPath() {
    if (typeof window === 'undefined') return
    if (!window.sessionStorage.getItem(LANDING_PATH_KEY)) {
        window.sessionStorage.setItem(LANDING_PATH_KEY, window.location.pathname)
    }
}

/** The path this session started on, or the current path if none was recorded yet. */
export function getLandingPath(): string {
    if (typeof window === 'undefined') return '/'
    return window.sessionStorage.getItem(LANDING_PATH_KEY) || window.location.pathname
}

export function getPlatform(): 'mobile' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    return window.innerWidth < 768 ? 'mobile' : 'desktop'
}
