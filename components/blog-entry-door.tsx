"use client"

import { useEffect } from "react"
import { setEntryDoor, getLandingPath } from "@/lib/analytics"

/**
 * Invisible component that sets the entry door to "blog" when the session
 * landed on a blog page. Visitors who start elsewhere and browse to the blog
 * later keep their original door.
 */
export function BlogEntryDoor() {
    useEffect(() => {
        if (getLandingPath().startsWith('/blog')) {
            setEntryDoor('blog')
        }
    }, [])

    return null
}
