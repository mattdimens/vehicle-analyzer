import type { MetadataRoute } from 'next'

const BASE_URL = 'https://visualfitment.com'

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    /**
     * Central route registry — add new pages here and they
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
            { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
        ]

    return routes.map(({ path, priority, changeFrequency }) => ({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
    }))
}
