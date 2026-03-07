import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogFaq {
    question: string
    answer: string
}

export interface BlogFrontmatter {
    title: string
    subtitle: string
    metaDescription: string
    category: string
    categorySlug: string
    tags: string[]
    author: string
    authorSlug: string
    authorImage?: string
    publishedAt: string
    modifiedAt: string
    heroImage?: string
    heroAlt?: string
    keywords: string
    readTime: number
    isPublished: boolean
    ctaCopy?: string
    ctaButtonText?: string
    ctaLink?: string
    relatedSlugs?: string[]
    faq: BlogFaq[]
}

export interface BlogPost {
    slug: string
    frontmatter: BlogFrontmatter
    content: string
    wordCount: number
}

/**
 * Calculate the word count from raw MDX content,
 * stripping JSX tags and frontmatter artifacts.
 */
function calculateWordCount(content: string): number {
    const stripped = content
        .replace(/<[^>]+>/g, '') // strip HTML/JSX tags
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // strip JSX comments
        .replace(/```[\s\S]*?```/g, '') // strip code blocks
        .replace(/---/g, '') // strip horizontal rules
        .replace(/[#*_>\[\]()!`|]/g, '') // strip markdown symbols
        .trim()

    return stripped.split(/\s+/).filter(Boolean).length
}

/**
 * Read and parse a single MDX blog post by slug.
 * Returns null if the file does not exist.
 */
export function getPostBySlug(slug: string): BlogPost | null {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`)

    if (!fs.existsSync(filePath)) {
        return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    const frontmatter = data as BlogFrontmatter

    return {
        slug,
        frontmatter,
        content,
        wordCount: calculateWordCount(content),
    }
}

/**
 * Read all published blog posts, sorted by publishedAt descending.
 */
export function getAllPosts(): BlogPost[] {
    if (!fs.existsSync(BLOG_DIR)) {
        return []
    }

    const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

    const posts = files
        .map((filename) => {
            const slug = filename.replace(/\.mdx$/, '')
            return getPostBySlug(slug)
        })
        .filter((post): post is BlogPost => post !== null && post.frontmatter.isPublished)
        .sort(
            (a, b) =>
                new Date(b.frontmatter.publishedAt).getTime() -
                new Date(a.frontmatter.publishedAt).getTime()
        )

    return posts
}

/**
 * Get all published slugs for generateStaticParams.
 */
export function getAllSlugs(): string[] {
    return getAllPosts().map((post) => post.slug)
}

/**
 * Format an ISO date string to a human-readable date.
 * e.g. "2026-03-07T09:00:00Z" → "March 7, 2026"
 */
export function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}
