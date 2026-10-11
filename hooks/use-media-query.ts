import { useCallback, useSyncExternalStore } from "react"

/** Subscribe to a CSS media query. Returns false during SSR. */
export function useMediaQuery(query: string) {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const result = matchMedia(query)
            result.addEventListener("change", onChange)
            return () => result.removeEventListener("change", onChange)
        },
        [query]
    )

    return useSyncExternalStore(
        subscribe,
        () => matchMedia(query).matches,
        () => false
    )
}
