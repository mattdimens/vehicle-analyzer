'use server'

// Every exported async function in this file is a public, browser-callable
// endpoint. Gemini analysis lives behind the /api/analyze* routes (covered by
// the firewall's rate limit and URL validation); only the upload-link action
// remains here.

import { createClient } from '@supabase/supabase-js'

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

// ---------------------------------------------------------------------------
// Get a signed upload URL (with file validation)
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
