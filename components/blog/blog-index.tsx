import Link from 'next/link'

import { getAllPosts, formatDate } from '@/lib/blog'

export const POSTS_PER_PAGE = 12

/** Total number of index pages (at least 1). */
export function getBlogPageCount(): number {
    return Math.max(1, Math.ceil(getAllPosts().length / POSTS_PER_PAGE))
}

/** Page 1 lives at /blog; later pages are static routes at /blog/page/N. */
export function blogPageHref(page: number): string {
    return page <= 1 ? '/blog' : `/blog/page/${page}`
}

/** Blog index grid + pagination, rendered statically for each page. */
export function BlogIndex({ currentPage }: { currentPage: number }) {
    const allPosts = getAllPosts()
    const totalPages = getBlogPageCount()
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
                        {post.frontmatter.heroImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={`/blog/images/${post.frontmatter.heroImage}`}
                                alt={post.frontmatter.heroAlt || ''}
                                width={400}
                                height={225}
                                loading="lazy"
                            />
                        ) : (
                            <div className="card-image-placeholder">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo.png" alt="Visual Fitment" width={48} height={48} />
                            </div>
                        )}
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
                        <Link href={blogPageHref(currentPage - 1)}>← Prev</Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Link
                            key={page}
                            href={blogPageHref(page)}
                            className={page === currentPage ? 'active' : ''}
                        >
                            {page}
                        </Link>
                    ))}
                    {currentPage < totalPages && (
                        <Link href={blogPageHref(currentPage + 1)}>Next →</Link>
                    )}
                </nav>
            )}
        </div>
    )
}
