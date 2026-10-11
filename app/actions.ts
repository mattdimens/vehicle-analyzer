'use server'

// Every exported async function in this file is a public, browser-callable
// endpoint. Accept only plain values (image URLs, short strings), validate
// them, and delegate the Gemini work to lib/analysis-stages.ts.

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { DetectedProductSchema } from '@/lib/schemas'
import { fetchImageForGemini } from '@/lib/gemini'
import { assertSupabaseStorageUrl } from '@/lib/url-validation'
import {
  detectProductTypes,
  refineProduct,
  runPartIdentification,
  type DetectedProduct,
  type PartIdentification,
} from '@/lib/analysis-stages'

export type {
  PrimaryVehicle,
  OtherPossibility,
  AnalysisResults,
  DetectedProduct,
  PartIdentification,
} from '@/lib/analysis-stages'

// Initialize the server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- File upload validation constants ---
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

const MAX_IMAGE_URLS = 10

/** Validate a caller-supplied list of image URLs and fetch them once. */
async function fetchValidatedImages(imageUrls: unknown) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0 || imageUrls.length > MAX_IMAGE_URLS) {
    throw new Error(`Expected between 1 and ${MAX_IMAGE_URLS} image URLs`)
  }
  for (const url of imageUrls) {
    assertSupabaseStorageUrl(url)
  }
  return Promise.all((imageUrls as string[]).map((url) => fetchImageForGemini(url)))
}

// ---------------------------------------------------------------------------
// Function 1: Get Signed URL (with file validation)
// ---------------------------------------------------------------------------
export async function createSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<
  | { success: true; data: { signedUrl: string; path: string } }
  | { success: false; error: string }
> {
  // Server-side file type validation. The extension is derived from the
  // validated MIME type, never from the client-supplied filename.
  const extension = typeof fileType === 'string' ? MIME_TO_EXTENSION[fileType.toLowerCase()] : undefined
  if (!extension) {
    return { success: false, error: `Invalid file type: ${fileType}. Only JPEG, PNG, GIF, and WebP images are allowed.` }
  }

  // Generate an opaque UUID filename to prevent enumeration
  const opaqueFilename = `${crypto.randomUUID()}.${extension}`

  const { data, error } = await supabase.storage
    .from('vehicle_images')
    .createSignedUploadUrl(opaqueFilename, {
      upsert: true,
    })

  if (error) {
    return { success: false, error: error.message ?? String(error) }
  }

  if (!data) {
    return { success: false, error: 'No data returned from storage API' }
  }

  return { success: true, data: { signedUrl: data.signedUrl, path: data.path } }
}

// ---------------------------------------------------------------------------
// Function 2: Detect Visible Products (Stage 1)
// ---------------------------------------------------------------------------
export async function detectVisibleProducts(
  imageUrls: string[],
  vehicleDetails: string | null,
  promptContext?: string
): Promise<
  | { success: true; data: string[] }
  | { success: false; error: string }
> {
  try {
    const imageParts = await fetchValidatedImages(imageUrls)
    return await detectProductTypes(imageParts, vehicleDetails, promptContext)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ---------------------------------------------------------------------------
// Function 3: Refine Product Details (Stage 2)
// ---------------------------------------------------------------------------
export async function refineProductDetails(
  imageUrls: string[],
  productType: string,
  vehicleDetails: string | null,
  promptContext?: string
): Promise<DetectedProduct> {
  try {
    const imageParts = await fetchValidatedImages(imageUrls)
    return await refineProduct(imageParts, productType, vehicleDetails, promptContext)
  } catch (err) {
    console.error('Error refining product:', err)
    return {
      type: typeof productType === 'string' ? productType.slice(0, 60) : 'Product',
      brand: 'Unknown Brand',
      model: 'Unknown Model',
      confidence: 0,
      reasoning: 'Error during product refinement. Could not analyze.',
    }
  }
}

// ---------------------------------------------------------------------------
// Function 5: Identify a Car Part from an Image
// ---------------------------------------------------------------------------
export async function identifyPart(
  publicImageUrl: string
): Promise<
  | { success: true; data: PartIdentification }
  | { success: false; error: string }
> {
  try {
    const imageParts = await fetchValidatedImages([publicImageUrl])
    const { identification, modelUsed } = await runPartIdentification(imageParts)

    // Save to Supabase (Issue #29: include model_used)
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_data: identification,
        image_url: publicImageUrl,
        model_used: modelUsed,
      })

    if (dbError) {
      console.error('Supabase DB error:', dbError.message)
      // Don't throw; part identification still succeeded
    }

    return { success: true, data: identification }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ---------------------------------------------------------------------------
// Function 6: Update Analysis Results with Detected Products
// ---------------------------------------------------------------------------

/** Products can only be attached once, shortly after the fitment row is written. */
const PRODUCTS_WRITE_WINDOW_MS = 15 * 60 * 1000

export async function updateAnalysisResultsProducts(
  imageUrl: string,
  detectedProducts: DetectedProduct[]
) {
  try {
    assertSupabaseStorageUrl(imageUrl)
    const products = z.array(DetectedProductSchema).max(20).parse(detectedProducts)

    // Get the most recent analysis for this image
    const { data: record, error: fetchError } = await supabase
      .from('analysis_results')
      .select('id, analysis_data, created_at')
      .eq('image_url', imageUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !record) {
      console.error('Could not find record to update:', fetchError)
      return { success: false, error: fetchError?.message || 'Record not found' }
    }

    const existing = (record.analysis_data ?? {}) as Record<string, unknown>
    const ageMs = Date.now() - new Date(record.created_at).getTime()
    if ('detectedProducts' in existing || ageMs > PRODUCTS_WRITE_WINDOW_MS) {
      return { success: false, error: 'Record can no longer be updated' }
    }

    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({ analysis_data: { ...existing, detectedProducts: products } })
      .eq('id', record.id)

    if (updateError) {
      console.error('Error updating analysis_results:', updateError.message)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
