import { GoogleGenAI } from '@google/genai'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const SCOUT_MODEL = 'gemini-3-flash-preview'
export const SNIPER_MODEL = 'gemini-3-pro-preview'
export const CASCADE_CONFIDENCE_THRESHOLD = 85

// ---------------------------------------------------------------------------
// Client singleton (lazy, avoids crashing client bundles)
// ---------------------------------------------------------------------------
let _ai: GoogleGenAI | null = null

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
    _ai = new GoogleGenAI({ apiKey })
  }
  return _ai
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip markdown code fences from AI responses. */
export function cleanJsonResponse(text: string): string {
  return text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
}

/** Fetch an image URL and convert it to Gemini inlineData format. */
export async function fetchImageForGemini(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)

  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString('base64')

  return { inlineData: { data: base64Data, mimeType } }
}

// ---------------------------------------------------------------------------
// Prompt context validation (Issue #16: allowlist for known categories)
// ---------------------------------------------------------------------------
const ALLOWED_PROMPT_CONTEXTS = [
  'truck bed cover',
  'tonneau',
  'wheels',
  'rims',
  'tires',
  'wheels and rims',
  'nerf bars',
  'running boards',
  'side steps',
  'nerf bars and running boards',
  'truck bed covers and tonneau covers',
] as const

/**
 * Sanitize promptContext: pass through known categories, strip instruction-like
 * patterns from unknown inputs to defend against prompt injection.
 */
export function sanitizePromptContext(promptContext?: string): string | undefined {
  if (!promptContext) return undefined

  const lower = promptContext.toLowerCase()
  // If it matches a known category, pass through unchanged
  if (ALLOWED_PROMPT_CONTEXTS.some(ctx => lower.includes(ctx))) return promptContext

  // Strip instruction-like keywords from unknown contexts
  const sanitized = promptContext
    .replace(/(?:ignore|override|forget|instead|system|prompt|instruction|disregard|pretend)/gi, '')
    .trim()
  return sanitized || undefined
}

// ---------------------------------------------------------------------------
// Category-specific tiered recommendation instruction builder
// ---------------------------------------------------------------------------
export function buildSpecificLogicInstruction(promptContext?: string): string {
  if (!promptContext) return ''

  const lower = promptContext.toLowerCase()

  if (lower.includes('truck bed cover') || lower.includes('tonneau')) {
    return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Essential Bed Protection & Organization Add-ons": Bed Mats/Rugs (e.g. BedRug, Dee Zee), Swing-out cases (e.g. UnderCover SwingCase), BedSlides (e.g. BEDSLIDE S), Cargo Bars, Tailgate Seals, Electronic Tailgate Locks.
      2. "Compatible Hauling Hardware & Rack Systems": Bed Racks (e.g. Yakima OverHaul, Thule), Toolboxes (e.g. UWS Low Profile).
      3. "Alternative Truck Bed Enclosure Solutions": Camper Shells (e.g. LEER, ARE), Soft Toppers (e.g. Softopper), Canvas Tarps.
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
  }

  if (lower.includes('wheels') || lower.includes('rims') || lower.includes('tires')) {
    return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Essential Tire Integration & Installation Hardware": Tires (e.g. Nitto Ridge Grappler, Falken Wildpeak), TPMS Sensors (e.g. Autel MX-Sensor), Hub Centric Rings (e.g. Gorilla), Aftermarket Lug Nuts (e.g. McGard, Gorilla).
      2. "Stance Modification & Clearance Components": Suspension (e.g. Bilstein 5100, Rough Country Lift), Fender Flares (e.g. Bushwacker Pocket Style), Wheel Spacers (e.g. Bora, Spidertrax).
      3. "Cosmetic Overlay & Restoration Alternatives": Wheel Skins (e.g. Coast to Coast), Hubcaps, Caliper Covers (e.g. MGP).
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
  }

  if (lower.includes('nerf bars') || lower.includes('running boards') || lower.includes('side steps')) {
    return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Supplemental Access Points & Paint Protection": Rear Access (e.g. AMP Research BedStep), Hitch Steps (e.g. WeatherTech BumpStep), Mud Flaps (e.g. WeatherTech No-Drill), Door Sill Guards (e.g. AVS).
      2. "Heavy-Duty Frame Protection & Lighting Integration": Rock Sliders (e.g. N-Fab RKR, Tyger Auto), LED Light Strips (e.g. OPT7), Gap Guards (e.g. Performance Accessories).
      3. "Automated & Compact Step Alternatives": Power Steps (e.g. AMP Research PowerStep), Hoop Steps (e.g. Bully, N-Fab), Drop Steps (e.g. Westin HDX).
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
  }

  return ''
}
