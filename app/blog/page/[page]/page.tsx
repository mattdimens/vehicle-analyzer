import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogIndex, blogPageHref, getBlogPageCount } from '@/components/blog/blog-index'

type PageProps = {
    params: Promise<{ page: string }>
}

// Only prerendered page numbers exist; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
    const count = getBlogPageCount()
    return Array.from({ length: Math.max(0, count - 1) }, (_, i) => ({ page: String(i + 2) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { page } = await params
    return {
        title: `Blog, Page ${page} | Visual Fitment`,
        alternates: { canonical: `https://visualfitment.com${blogPageHref(Number(page))}` },
    }
}

export default async function BlogIndexPagedPage({ params }: PageProps) {
    const { page } = await params
    const currentPage = Number(page)
    if (!Number.isInteger(currentPage) || currentPage < 2 || currentPage > getBlogPageCount()) {
        notFound()
    }
    return <BlogIndex currentPage={currentPage} />
}
