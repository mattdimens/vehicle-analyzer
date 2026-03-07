import { Metadata } from 'next'
import Link from 'next/link'

import { getAllPosts, formatDate } from '@/lib/blog'

const POSTS_PER_PAGE = 12

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

type PageProps = {
    searchParams: Promise<{ page?: string }>
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams
    const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10))
    const allPosts = getAllPosts()
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
    const startIdx = (currentPage - 1) * POSTS_PER_PAGE
    const posts = allPosts.slice(startIdx, startIdx + POSTS_PER_PAGE)

    return (
        <div className="blog-index">
            <h1 className="blog-index-title">Blog</h1>
            <p className="blog-index-subtitle">
                Guides, how-tos, and technical deep dives on vehicle identification and fitment.
            </p>

            <div className="blog-index-grid">
                {posts.map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="blog-index-card"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/blog/images/${post.frontmatter.heroImage}.webp`}
                            alt={post.frontmatter.heroAlt}
                            width={400}
                            height={225}
                            loading="lazy"
                        />
                        <div className="card-content">
                            <span className="card-category">{post.frontmatter.category}</span>
                            <div className="card-title">{post.frontmatter.title}</div>
                            <p className="card-subtitle">{post.frontmatter.subtitle}</p>
                            <div className="card-meta">
                                <time dateTime={post.frontmatter.publishedAt}>
                                    {formatDate(post.frontmatter.publishedAt)}
                                </time>
                                <span>·</span>
                                <span>{post.frontmatter.readTime} min read</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <nav className="blog-pagination" aria-label="Blog pagination">
                    {currentPage > 1 && (
                        <Link href={`/blog?page=${currentPage - 1}`}>← Prev</Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Link
                            key={page}
                            href={`/blog?page=${page}`}
                            className={page === currentPage ? 'active' : ''}
                        >
                            {page}
                        </Link>
                    ))}
                    {currentPage < totalPages && (
                        <Link href={`/blog?page=${currentPage + 1}`}>Next →</Link>
                    )}
                </nav>
            )}
        </div>
    )
}
