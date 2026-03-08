import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'

import { getPostBySlug, getAllSlugs, getAllPosts, formatDate } from '@/lib/blog'
import type { BlogPost } from '@/lib/blog'
import { mdxComponents } from '@/components/blog/mdx-components'

// ---------------------------------------------------------------------------
// Static Params
// ---------------------------------------------------------------------------
export function generateStaticParams() {
    return getAllSlugs().map((slug) => ({ slug }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const post = getPostBySlug(slug)
    if (!post || !post.frontmatter.isPublished) return {}

    const { frontmatter: fm } = post
    const url = `https://visualfitment.com/blog/${slug}`
    const heroUrl = fm.heroImage ? `https://visualfitment.com/blog/images/${fm.heroImage}` : 'https://visualfitment.com/logo.png'

    return {
        title: `${fm.title} | Visual Fitment`,
        description: fm.metaDescription,
        authors: [{ name: fm.author }],
        alternates: { canonical: url },
        robots: {
            index: true,
            follow: true,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
            'max-video-preview': -1,
        },
        openGraph: {
            type: 'article',
            title: fm.title,
            description: fm.metaDescription,
            url,
            siteName: 'Visual Fitment',
            images: [{ url: heroUrl, width: 1200, height: 630 }],
            publishedTime: fm.publishedAt,
            modifiedTime: fm.modifiedAt,
            authors: [fm.author],
            section: fm.category,
            tags: fm.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: fm.title,
            description: fm.metaDescription,
            images: [heroUrl],
        },
    }
}

// ---------------------------------------------------------------------------
// Helper: extract h2 headings from MDX content for TOC
// ---------------------------------------------------------------------------
function extractHeadings(content: string): { id: string; text: string }[] {
    const regex = /^##\s+(.+)$/gm
    const headings: { id: string; text: string }[] = []
    let match

    while ((match = regex.exec(content)) !== null) {
        const text = match[1].trim()
        // Replicate rehype-slug's slugification
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        headings.push({ id, text })
    }

    return headings
}

// ---------------------------------------------------------------------------
// Helper: build related articles list
// ---------------------------------------------------------------------------
function getRelatedPosts(currentSlug: string, relatedSlugs?: string[]): BlogPost[] {
    const related: BlogPost[] = []

    // First, try to get posts from relatedSlugs
    if (relatedSlugs) {
        for (const slug of relatedSlugs) {
            if (related.length >= 3) break
            const post = getPostBySlug(slug)
            if (post && post.frontmatter.isPublished && post.slug !== currentSlug) {
                related.push(post)
            }
        }
    }

    // Backfill with recent posts if needed
    if (related.length < 3) {
        const allPosts = getAllPosts()
        for (const post of allPosts) {
            if (related.length >= 3) break
            if (
                post.slug !== currentSlug &&
                !related.some((r) => r.slug === post.slug)
            ) {
                related.push(post)
            }
        }
    }

    return related
}

// ---------------------------------------------------------------------------
// JSON-LD Schema Generators
// ---------------------------------------------------------------------------
function buildBlogPostingSchema(post: BlogPost, slug: string) {
    const fm = post.frontmatter
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://visualfitment.com/blog/${slug}`,
        },
        headline: fm.title,
        description: fm.metaDescription,
        image: fm.heroImage
            ? [`https://visualfitment.com/blog/images/${fm.heroImage}`]
            : [],
        datePublished: fm.publishedAt,
        dateModified: fm.modifiedAt,
        author: {
            '@type': 'Person',
            name: fm.author,
            url: 'https://visualfitment.com/about',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Visual Fitment',
            logo: {
                '@type': 'ImageObject',
                url: 'https://visualfitment.com/logo.png',
            },
            url: 'https://visualfitment.com',
            sameAs: [],
        },
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['.article-subtitle', '.speakable-summary'],
        },
        keywords: fm.keywords,
        wordCount: post.wordCount,
        articleSection: fm.category,
    }
}

function buildBreadcrumbSchema(post: BlogPost) {
    const fm = post.frontmatter
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://visualfitment.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://visualfitment.com/blog' },
            {
                '@type': 'ListItem',
                position: 3,
                name: fm.category,
                item: `https://visualfitment.com/blog/category/${fm.categorySlug}`,
            },
            { '@type': 'ListItem', position: 4, name: fm.title },
        ],
    }
}

function buildFaqSchema(post: BlogPost) {
    if (!post.frontmatter.faq || post.frontmatter.faq.length === 0) return null
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.frontmatter.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default async function BlogArticlePage({ params }: PageProps) {
    const { slug } = await params
    const post = getPostBySlug(slug)

    if (!post || !post.frontmatter.isPublished) {
        notFound()
    }

    const fm = post.frontmatter
    const headings = extractHeadings(post.content)
    const showToc = headings.length >= 3
    const relatedPosts = getRelatedPosts(slug, fm.relatedSlugs)
    const faqSchema = buildFaqSchema(post)

    const ctaCopy =
        fm.ctaCopy ||
        'Upload a photo of any vehicle and get instant identification of make, model, trim, and compatible parts.'
    const ctaButtonText = fm.ctaButtonText || 'Upload a Photo'
    const ctaLink = fm.ctaLink || '/#upload-zone'

    return (
        <>
            {/* JSON-LD Schema Blocks */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(buildBlogPostingSchema(post, slug)),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(buildBreadcrumbSchema(post)),
                }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(faqSchema),
                    }}
                />
            )}

            {/* Breadcrumbs */}
            <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span className="separator">›</span>
                <Link href="/blog">Blog</Link>
                <span className="separator">›</span>
                <span aria-current="page">{fm.title}</span>
            </nav>

            <article>
                {/* Article Header */}
                <header className="article-header">
                    <span className="article-category">{fm.category}</span>
                    <h1>{fm.title}</h1>
                    <p className="article-subtitle">{fm.subtitle}</p>
                    <div className="article-meta">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fm.authorImage || '/logo.png'}
                            alt={fm.author || 'VisualFitment Team'}
                            className="author-avatar"
                            width={36}
                            height={36}
                        />
                        <div>
                            <span className="author-name">{fm.author || 'VisualFitment Team'}</span>
                            <span className="meta-dot"> · </span>
                            <time dateTime={fm.publishedAt}>{formatDate(fm.publishedAt)}</time>
                            <span className="meta-dot"> · </span>
                            <span>{fm.readTime} min read</span>
                        </div>
                    </div>
                </header>

                {/* Hero Image */}
                {fm.heroImage && (
                    <figure className="article-hero">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/blog/images/${fm.heroImage}`}
                            alt={fm.heroAlt}
                            width={960}
                            height={540}
                            loading="eager"
                        />
                    </figure>
                )}

                {/* Table of Contents */}
                {showToc && (
                    <nav className="toc" aria-label="Table of contents">
                        <div className="toc-title">In this article</div>
                        <ol>
                            {headings.map((h) => (
                                <li key={h.id}>
                                    <a href={`#${h.id}`}>{h.text}</a>
                                </li>
                            ))}
                            {fm.faq && fm.faq.length > 0 && (
                                <li>
                                    <a href="#faqs">Frequently Asked Questions</a>
                                </li>
                            )}
                        </ol>
                    </nav>
                )}

                {/* Article Body (MDX Content) */}
                <div className="article-body">
                    <MDXRemote
                        source={post.content}
                        components={mdxComponents}
                        options={{
                            mdxOptions: {
                                rehypePlugins: [rehypeSlug],
                            },
                        }}
                    />
                </div>

                {/* CTA Section */}
                <div className="article-cta">
                    <p>{ctaCopy}</p>
                    <a href={ctaLink} className="cta-button">
                        {ctaButtonText}
                    </a>
                </div>

                {/* FAQ Section */}
                {fm.faq && fm.faq.length > 0 && (
                    <section className="faq-section" id="faqs">
                        <h2>Frequently Asked Questions</h2>
                        {fm.faq.map((item, i) => (
                            <div className="faq-item" key={i}>
                                <h3>{item.question}</h3>
                                <p>{item.answer}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Author Bio */}
                <div className="article-body">
                    <aside className="author-bio">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fm.authorImage || '/logo.png'}
                            alt={fm.author || 'VisualFitment Team'}
                            width={56}
                            height={56}
                        />
                        <div>
                            <div className="bio-name">{fm.author || 'VisualFitment Team'}</div>
                            <p className="bio-text">
                                The Visual Fitment team builds tools that help people identify vehicles and find compatible aftermarket parts from photos.
                            </p>
                        </div>
                    </aside>
                </div>
            </article>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
                <section className="related-articles">
                    <h2>You Might Also Like</h2>
                    <div className="related-grid">
                        {relatedPosts.map((related) => (
                            <Link
                                key={related.slug}
                                href={`/blog/${related.slug}`}
                                className="related-card"
                            >
                                {related.frontmatter.heroImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={`/blog/images/${related.frontmatter.heroImage}`}
                                        alt={related.frontmatter.heroAlt || ''}
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
                                <div className="card-body">
                                    <span className="card-category">
                                        {related.frontmatter.category}
                                    </span>
                                    <div className="card-title">
                                        {related.frontmatter.title}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </>
    )
}
