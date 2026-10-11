import { Metadata } from 'next'
import { BlogIndex } from '@/components/blog/blog-index'

export const metadata: Metadata = {
    title: 'Blog | Visual Fitment',
    description:
        'Guides, how-tos, and technical deep dives on vehicle identification, fitment specs, and aftermarket parts.',
    alternates: { canonical: 'https://visualfitment.com/blog' },
    openGraph: {
        title: 'Blog | Visual Fitment',
        description:
            'Guides, how-tos, and technical deep dives on vehicle identification, fitment specs, and aftermarket parts.',
        url: 'https://visualfitment.com/blog',
        siteName: 'Visual Fitment',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog | Visual Fitment',
        description:
            'Guides, how-tos, and technical deep dives on vehicle identification, fitment specs, and aftermarket parts.',
    },
}

// Static: page 1 only. Later pages are prerendered at /blog/page/[page].
export default function BlogIndexPage() {
    return <BlogIndex currentPage={1} />
}
