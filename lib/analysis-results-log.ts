/**
 * Server-side writes to the analysis_results log table.
 */
import type { Json } from '@/types/supabase'
import { getSupabaseAdmin } from '@/lib/pipeline'
import type { DetectedProduct } from '@/lib/analysis-stages'

/** Products can only be attached once, shortly after the fitment row is written. */
const PRODUCTS_WRITE_WINDOW_MS = 15 * 60 * 1000

/**
 * Attach detected products to the most recent fitment row for this image.
 * Write-once and time-boxed; failures are logged, never thrown.
 */
export async function attachProductsToLatestResult(imageUrl: string, products: DetectedProduct[]) {
  if (products.length === 0) return
  const supabase = getSupabaseAdmin()

  const { data: record, error: fetchError } = await supabase
    .from('analysis_results')
    .select('id, analysis_data, created_at')
    .eq('image_url', imageUrl)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError || !record) {
    // Products-only analyses have no fitment row to attach to
    if (fetchError) console.error('analysis_results lookup failed:', fetchError.message)
    return
  }

  const existing = (record.analysis_data ?? {}) as Record<string, unknown>
  const ageMs = Date.now() - new Date(record.created_at).getTime()
  if ('detectedProducts' in existing || ageMs > PRODUCTS_WRITE_WINDOW_MS) return

  const { error: updateError } = await supabase
    .from('analysis_results')
    .update({ analysis_data: { ...existing, detectedProducts: products } as unknown as Json })
    .eq('id', record.id)

  if (updateError) console.error('Error attaching products to analysis_results:', updateError.message)
}
