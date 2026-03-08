"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface BlogCardData {
    slug: string
    title: string
    subtitle: string
    category: string
    heroImage?: string
    heroAlt?: string
    readTime: number
}

interface FromTheBlogProps {
    posts: BlogCardData[]
}

export function FromTheBlog({ posts }: FromTheBlogProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    if (posts.length === 0) return null

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 4)
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)

        // Determine active index from scroll position
        const cardWidth = el.firstElementChild
            ? (el.firstElementChild as HTMLElement).offsetWidth
            : 1
        const gap = 24 // gap-6 = 1.5rem = 24px
        const idx = Math.round(el.scrollLeft / (cardWidth + gap))
        setActiveIndex(Math.min(idx, posts.length - 1))
    }, [posts.length])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateScrollState()
        el.addEventListener("scroll", updateScrollState, { passive: true })
        window.addEventListener("resize", updateScrollState)
        return () => {
            el.removeEventListener("scroll", updateScrollState)
            window.removeEventListener("resize", updateScrollState)
        }
    }, [updateScrollState])

    const scrollTo = (direction: "left" | "right") => {
        const el = scrollRef.current
        if (!el) return
        const cardWidth = el.firstElementChild
            ? (el.firstElementChild as HTMLElement).offsetWidth
            : 300
        const gap = 24
        const distance = cardWidth + gap
        el.scrollBy({
            left: direction === "left" ? -distance : distance,
            behavior: "smooth",
        })
    }

    const scrollToIndex = (index: number) => {
        const el = scrollRef.current
        if (!el || !el.children[index]) return
        const child = el.children[index] as HTMLElement
        el.scrollTo({
            left: child.offsetLeft - el.offsetLeft,
            behavior: "smooth",
        })
    }

    return (
        <section className="w-full bg-white py-16 md:py-20">
            <div className="container max-w-6xl">
                <div className="mb-12 flex items-end justify-between">
                    <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
                        From the <span className="text-primary italic">Blog</span>
                    </h2>

                    {/* Desktop arrows */}
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => scrollTo("left")}
                            disabled={!canScrollLeft}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Previous article"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => scrollTo("right")}
                            disabled={!canScrollRight}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Next article"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Carousel track */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <style>{`
                        .blog-carousel-track::-webkit-scrollbar { display: none; }
                    `}</style>
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="blog-carousel-card group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden snap-start shrink-0"
                            style={{ width: "min(100%, 360px)" }}
                        >
                            {/* Hero image */}
                            {post.heroImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={`/blog/images/${post.heroImage}`}
                                    alt={post.heroAlt || post.title}
                                    width={600}
                                    height={338}
                                    className="aspect-video w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo.png" alt="Visual Fitment" width={48} height={48} className="opacity-40" />
                                </div>
                            )}

                            {/* Card content */}
                            <div className="flex flex-col flex-1 p-5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                                    {post.category}
                                </span>
                                <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                                    {post.subtitle}
                                </p>
                                <span className="text-xs text-muted-foreground/70">
                                    {post.readTime} min read
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Indicator dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    {posts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToIndex(i)}
                            className={`h-2 rounded-full transition-all ${i === activeIndex
                                    ? "w-6 bg-primary"
                                    : "w-2 bg-border hover:bg-muted-foreground/40"
                                }`}
                            aria-label={`Go to article ${i + 1}`}
                        />
                    ))}
                </div>

                {/* "Read more" link */}
                <div className="mt-8 text-center">
                    <Link
                        href="/blog"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Read more on the blog →
                    </Link>
                </div>
            </div>
        </section>
    )
}
