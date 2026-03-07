import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = 'https://visualfitment.com'

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    /**
     * Central route registry: add new pages here and they
     * automatically appear in the generated /sitemap.xml.
     */
    const routes: {
        path: string
        priority: number
        changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    }[] = [
            { path: '/', priority: 1.0, changeFrequency: 'daily' },
            { path: '/wheels-rims', priority: 0.8, changeFrequency: 'weekly' },
            { path: '/truck-bed-covers', priority: 0.8, changeFrequency: 'weekly' },
            { path: '/nerf-bars-running-boards', priority: 0.8, changeFrequency: 'weekly' },
            { path: '/part-identifier', priority: 0.9, changeFrequency: 'weekly' },
            { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
            { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
        ]

    const staticPages = routes.map(({ path, priority, changeFrequency }) => ({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
    }))

    // Blog post URLs
    const blogPosts = getAllPosts().map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.frontmatter.modifiedAt.split('T')[0],
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [...staticPages, ...blogPosts]
}
