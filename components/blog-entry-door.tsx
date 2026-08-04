"use client"

import { useEffect } from "react"
import { setEntryDoor } from "@/lib/analytics"

/**
 * Invisible component that sets the entry door to "blog" when mounted.
 * Placed in the blog layout so any session starting on a blog page
 * is correctly attributed.
 */
export function BlogEntryDoor() {
    useEffect(() => {
        setEntryDoor('blog')
    }, [])

    return null
}
