import { fetchImageForGemini } from '@/lib/gemini'
import { assertSupabaseStorageUrl, UrlValidationError } from '@/lib/url-validation'
import type { ImagePart } from '@/lib/analysis-stages'

export const MAX_IMAGE_URLS = 10

/**
 * Validate caller-supplied image URLs (must be our Supabase storage, 1..10)
 * and fetch each one exactly once. Throws UrlValidationError on bad input.
 */
export async function fetchValidatedImages(imageUrls: unknown): Promise<{ urls: string[]; parts: ImagePart[] }> {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new UrlValidationError('imageUrls must be a non-empty array')
  }
  if (imageUrls.length > MAX_IMAGE_URLS) {
    throw new UrlValidationError(`Too many image URLs (max ${MAX_IMAGE_URLS})`)
  }
  for (const url of imageUrls) assertSupabaseStorageUrl(url)

  const urls = imageUrls as string[]
  const parts = await Promise.all(urls.map((url) => fetchImageForGemini(url)))
  return { urls, parts }
}
