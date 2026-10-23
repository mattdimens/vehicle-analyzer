import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { getAllVehicleRoutes } from '@/data/vehicles/index'
import { getProductTypeRoutes } from '@/data/vehicles/catalog'

const BASE_URL = 'https://visualfitment.com'

export default function sitemap(): MetadataRoute.Sitemap {
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
            { path: '/vehicles', priority: 0.7, changeFrequency: 'weekly' },
            { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
        ]

    // No lastModified on static and vehicle pages: a build date that changes on
    // every deploy teaches Google to ignore lastmod. Blog posts use modifiedAt.
    const staticPages = routes.map(({ path, priority, changeFrequency }) => ({
        url: `${BASE_URL}${path}`,
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

    // Vehicle page URLs (dynamically from data registry)
    const vehiclePages = getAllVehicleRoutes().map((route) => {
        let path = `/vehicles/${route.make}`
        let priority = 0.7 // make hub

        if (route.model) {
            path += `/${route.model}`
            priority = 0.8 // model hub (primary SEO target)
        }
        if (route.generation) {
            path += `/${route.generation}`
            priority = 0.7 // generation page
        }

        return {
            url: `${BASE_URL}${path}`,
            changeFrequency: 'weekly' as const,
            priority,
        }
    })

    // Product-type pages, e.g. /vehicles/toyota/tacoma/bed-racks. They only
    // exist once a model has enough researched products (data/vehicles/catalog).
    const productTypePages = getProductTypeRoutes().map((route) => ({
        url: `${BASE_URL}/vehicles/${route.make}/${route.model}/${route.productType}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [...staticPages, ...blogPosts, ...vehiclePages, ...productTypePages]
}
