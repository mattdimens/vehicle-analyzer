/**
 * Server-side Gemini analysis stages.
 *
 * These functions accept pre-fetched image parts (inlineData) and are NOT
 * Server Actions, so they cannot be called from the browser. Public entry
 * points (app/actions.ts, app/api/*) must validate image URLs and fetch the
 * images themselves before calling in here.
 */
import { z } from 'zod'
import { DetectedProductSchema, PartIdentificationSchema } from '@/lib/schemas'
import {
  getAI,
  SCOUT_MODEL,
  SNIPER_MODEL,
  CASCADE_CONFIDENCE_THRESHOLD,
  cleanJsonResponse,
  buildSpecificLogicInstruction,
  sanitizePromptContext,
  sanitizePromptText,
} from '@/lib/gemini'

export type ImagePart = { inlineData: { data: string; mimeType: string } }

/** Upper bound on product types refined per analysis (each one is 1-2 Gemini calls). */
export const MAX_PRODUCT_TYPES = 8

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------
export interface PrimaryVehicle {
  make: string
  model: string
  year: string // Using string to allow for ranges like "2021-2024"
  trim: string
  cabStyle: string | null
  bedLength: string | null
  vehicleType: string
  color: string
  condition: string
  confidence: number
}

export interface OtherPossibility {
  name: string // e.g., "Ford F-150"
  vehicle?: string
  yearRange?: string
  trim?: string
  confidence: number
}

export interface AnalysisResults {
  vehicle_present?: boolean
  primary: PrimaryVehicle
  engineDetails: string | null
  otherPossibilities: OtherPossibility[]
  recommendedAccessories: string[]
  tieredRecommendations?: {
    title: string
    items: string[]
  }[]
  confidence_score?: number
  seo_optimized_alt_text?: string
}

export interface DetectedProduct {
  type: string
  brand: string
  model: string
  confidence: number
  reasoning: string
}

export interface PartIdentification {
  partName: string
  category: string
  function: string
  estimatedVehicle: string | null
  confidence: number
  amazonSearchTerm: string
  reasoning: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function callGemini(model: string, prompt: string, imageParts: ImagePart[]) {
  const response = await getAI().models.generateContent({
    model,
    contents: [{ role: 'user' as const, parts: [{ text: prompt }, ...imageParts] }],
  })
  return cleanJsonResponse(response.text ?? '')
}

/** JSON.parse that returns undefined instead of throwing. */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Stage 0: Vehicle fitment (scout + sniper cascade)
// ---------------------------------------------------------------------------
export function buildFitmentPrompt(promptContext?: string): string {
  const safeContext = sanitizePromptContext(promptContext)
  const contextInstruction = safeContext
    ? ` PAY SPECIAL ATTENTION to ${safeContext}. Ensure your analysis is relevant to users interested in ${safeContext}.`
    : ''
  const specificLogicInstruction = buildSpecificLogicInstruction(safeContext)

  return (
    'You are an expert vehicle mechanic and fitment specialist. Analyze the vehicle shown in these images (they are different views of the same vehicle). ' +
    contextInstruction +
    'Identify the following for the **primary, most likely vehicle**: ' +
    '1. `make` (string) ' +
    '2. `model` (string) ' +
    '3. `year` (string, use a range like "2021-2024" if exact year is uncertain) ' +
    '4. `trim` (string, e.g., "XLT", "Lariat", "Base") ' +
    '5. `cabStyle` (string, e.g., "SuperCrew", "Quad Cab", or null if not applicable/visible) ' +
    '6. `bedLength` (string, e.g., "67.1\\" (Short)", or null if not applicable/visible) ' +
    '7. `vehicleType` (string, e.g., "SUV", "Sedan", "Pickup Truck") ' +
    '8. `color` (string) ' +
    '9. `condition` (string, e.g., "new", "used", "damaged") ' +
    '10. `confidence` (number, 0-100, representing your confidence in this primary identification) ' +
    'Also identify: ' +
    '* `vehicle_present` (boolean): Set to true when ANY identifiable road vehicle (car, truck, SUV, van, motorcycle, trailer, or similar) is visible in the image, even if blurry, partial, or hard-to-identify. Set to false ONLY when the image contains no vehicle at all (e.g. a person, animal, landscape, document, or unrelated object). This is independent of your identification confidence. ' +
    '* `engineDetails` (string, e.g., "5.0L V8", "2.7L EcoBoost V6", or "No details available" if not visible/determinable) ' +
    '* `otherPossibilities` (an array of 2-3 other likely possibilities, each with its own vehicle name, year range, trim, and confidence) ' +
    '* `recommendedAccessories` (an array of 3-5 recommended aftermarket accessories as strings. ALWAYS format each string as "Product Name (e.g. Example 1, Example 2)". IF tiered recommendations are requested, keep this as a fallback summary list). ' +
    specificLogicInstruction +
    '* `confidence_score` (integer 0-100, your overall confidence in the ENTIRE analysis, covering vehicle identification + any aftermarket part detection) ' +
    '* `seo_optimized_alt_text` (string, a descriptive, SEO-friendly alt text for this vehicle image, e.g., "2022 Ford F-150 Lariat SuperCrew with aftermarket wheels and tonneau cover") ' +
    'Respond ONLY with a valid, minified JSON object with this exact structure: ' +
    '{' +
    '"vehicle_present": boolean, ' +
    '"primary": {' +
    '"make": string, "model": string, "year": string, "trim": string, "cabStyle": string | null, "bedLength": string | null, ' +
    '"vehicleType": string, "color": string, "condition": string, "confidence": number' +
    '}, ' +
    '"engineDetails": string | null, ' +
    '"otherPossibilities": [' +
    '{ "vehicle": string, "yearRange": string, "trim": string, "confidence": number }' +
    '], ' +
    '"recommendedAccessories": [string], ' +
    '"tieredRecommendations": [{ "title": string, "items": [string] }] (OPTIONAL, include only if instructed), ' +
    '"confidence_score": number, ' +
    '"seo_optimized_alt_text": string' +
    '}'
  )
}

/**
 * Runs the fitment cascade and returns the raw (unvalidated) JSON object.
 * Callers validate with AnalysisResultsSchema before trusting the shape.
 */
export async function runFitmentAnalysis(
  imageParts: ImagePart[],
  promptContext?: string
): Promise<{ success: true; data: Record<string, unknown>; modelUsed: string } | { success: false; error: string }> {
  try {
    const prompt = buildFitmentPrompt(promptContext)

    const scoutRaw = tryParseJson(await callGemini(SCOUT_MODEL, prompt, imageParts))
    if (!scoutRaw || typeof scoutRaw !== 'object') {
      return { success: false, error: 'The analysis returned an unexpected format, please try again.' }
    }

    let finalResult = scoutRaw as Record<string, unknown>
    let modelUsed = SCOUT_MODEL

    const confidenceScore = typeof finalResult.confidence_score === 'number' ? finalResult.confidence_score : 0
    if (confidenceScore <= CASCADE_CONFIDENCE_THRESHOLD) {
      console.log(`Scout confidence_score ${confidenceScore} ≤ ${CASCADE_CONFIDENCE_THRESHOLD}: escalating to Sniper`)
      const sniperRaw = tryParseJson(await callGemini(SNIPER_MODEL, prompt, imageParts))
      if (sniperRaw && typeof sniperRaw === 'object') {
        finalResult = sniperRaw as Record<string, unknown>
        modelUsed = SNIPER_MODEL
      } else {
        console.warn('Sniper model returned invalid JSON, keeping Scout result')
      }
    }

    return { success: true, data: finalResult, modelUsed }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------------------------------------------------------------------------
// Stage 1: Detect visible product types
// ---------------------------------------------------------------------------
export async function detectProductTypes(
  imageParts: ImagePart[],
  vehicleDetails: string | null,
  promptContext?: string
): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
  try {
    const safeVehicle = sanitizePromptText(vehicleDetails, 120)
    const vehicleContext = safeVehicle ? `Given that this is a ${safeVehicle}, scan` : 'Scan'

    const safeContext = sanitizePromptContext(promptContext)
    const contextInstruction = safeContext
      ? `Focus specifically on detecting products related to: ${safeContext}. `
      : ''

    const prompt =
      `You are a vehicle product specialist. ${vehicleContext} these images and detect all visible aftermarket or OEM products (like Tonneau Cover, Wheels, Tires, Hitch, Roof Rack, Bumper, Side Steps, etc.). ` +
      contextInstruction +
      'Respond ONLY with a valid, minified JSON array of strings, where each string is a product type. ' +
      'Example: ["Tonneau Cover", "Wheels", "Tires", "Trailer Hitch"]'

    const parsed = z.array(z.string()).safeParse(tryParseJson(await callGemini(SCOUT_MODEL, prompt, imageParts)))
    if (!parsed.success) {
      return { success: true, data: [] }
    }

    const productTypes = parsed.data
      .map((t) => sanitizePromptText(t, 60))
      .filter((t): t is string => Boolean(t))
      .slice(0, MAX_PRODUCT_TYPES)

    return { success: true, data: productTypes }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------------------------------------------------------------------------
// Stage 2: Refine a single product type (scout + sniper cascade)
// ---------------------------------------------------------------------------
export async function refineProduct(
  imageParts: ImagePart[],
  rawProductType: string,
  vehicleDetails: string | null,
  promptContext?: string
): Promise<DetectedProduct> {
  const productType = sanitizePromptText(rawProductType, 60) ?? 'Product'
  try {
    const safeVehicle = sanitizePromptText(vehicleDetails, 120)
    const stage2Context = safeVehicle ? `on this ${safeVehicle}` : ''

    const safeContext = sanitizePromptContext(promptContext)
    const contextInstruction = safeContext
      ? ` Consider that the user is specifically interested in ${safeContext}. Focus heavily on details relevant to this category.`
      : ''

    const prompt =
      `I have detected a "${productType}" ${stage2Context}. Look very closely at this product in the provided images. ` +
      contextInstruction +
      'Use logos, design patterns, and any other visual cues to determine its exact brand and model (e.g., "BAK / BAKFlip MX4", "Ford / 20-inch 6-Spoke Dark Alloy"). ' +
      'Also provide a confidence score (0-100) for your brand/model identification and a brief reasoning. ' +
      'Respond ONLY with a valid, minified JSON object: {"type": string, "brand": string, "model": string, "confidence": number, "reasoning": string}. ' +
      'If you can identify the type but not brand/model, return {"type": "' +
      productType +
      '", "brand": "Unknown", "model": "Unknown", "confidence": 50, "reasoning": "Insufficient visual details"}.'

    // --- Cascading Model: Scout pass (Flash) ---
    const scoutParse = DetectedProductSchema.safeParse(tryParseJson(await callGemini(SCOUT_MODEL, prompt, imageParts)))
    if (!scoutParse.success) {
      console.error(`Scout product validation failed for ${productType}:`, scoutParse.error.flatten())
      return {
        type: productType,
        brand: 'Unknown Brand',
        model: 'Unknown Model',
        confidence: 0,
        reasoning: 'AI response did not match expected format.',
      }
    }
    let product = scoutParse.data

    // --- Gatekeeper: check Scout confidence (skip if hardcoded unknown fallback) ---
    const isHardcodedUnknown = product.brand === 'Unknown' && product.model === 'Unknown' && product.confidence === 50

    if (product.confidence <= CASCADE_CONFIDENCE_THRESHOLD && !isHardcodedUnknown) {
      console.log(`Scout product confidence ${product.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD} for ${productType}: escalating to Sniper`)
      const sniperParse = DetectedProductSchema.safeParse(tryParseJson(await callGemini(SNIPER_MODEL, prompt, imageParts)))
      if (sniperParse.success) {
        product = sniperParse.data // Sniper overrides Scout
      } else {
        console.warn(`Sniper product validation failed for ${productType}, keeping Scout result`)
      }
    }

    return product
  } catch (err) {
    console.error(`Error refining ${productType}:`, err)
    return {
      type: productType,
      brand: 'Unknown Brand',
      model: 'Unknown Model',
      confidence: 0,
      reasoning: 'Error during product refinement. Could not analyze.',
    }
  }
}

// ---------------------------------------------------------------------------
// Part identification (scout + sniper cascade)
// ---------------------------------------------------------------------------
const PART_PROMPT =
  'You are an expert automotive parts specialist. Analyze this image and identify the car part shown. ' +
  'Provide the following information: ' +
  '1. `partName` (string): The specific name of the part (e.g., "Brake Caliper", "Mass Air Flow Sensor", "CV Axle") ' +
  '2. `category` (string): The category (e.g., "Braking System", "Engine", "Suspension", "Exhaust", "Electrical", "Interior", "Exterior", "Drivetrain") ' +
  '3. `function` (string): A concise 1-2 sentence description of what this part does ' +
  '4. `estimatedVehicle` (string | null): If you can identify the make/model/year from the part\'s design, OEM number, or branding, include it. Otherwise null. ' +
  '5. `confidence` (number, 0-100): How certain you are about this identification ' +
  '6. `amazonSearchTerm` (string): A good Amazon search query to find this part (e.g., "2019 Ford F-150 brake caliper front") ' +
  '7. `reasoning` (string): Brief explanation of how you identified this part (visual cues, logos, shape, etc.) ' +
  'If the image does NOT appear to be a car/vehicle part, still respond with your best guess but set confidence below 30 and explain in reasoning why it may not be a car part. ' +
  'Respond ONLY with a valid, minified JSON object: ' +
  '{"partName": string, "category": string, "function": string, "estimatedVehicle": string | null, "confidence": number, "amazonSearchTerm": string, "reasoning": string}'

export async function runPartIdentification(
  imageParts: ImagePart[]
): Promise<{ identification: PartIdentification; modelUsed: string }> {
  // --- Cascading Model: Scout pass (Flash) ---
  const scoutParse = PartIdentificationSchema.safeParse(tryParseJson(await callGemini(SCOUT_MODEL, PART_PROMPT, imageParts)))
  if (!scoutParse.success) {
    console.error('Scout part identification validation failed:', scoutParse.error.flatten())
    throw new Error('The AI returned an unexpected response format. Please try again.')
  }
  let identification = scoutParse.data
  let modelUsed = SCOUT_MODEL

  // --- Gatekeeper: check Scout confidence ---
  if (identification.confidence <= CASCADE_CONFIDENCE_THRESHOLD) {
    console.log(`Scout part confidence ${identification.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD}: escalating to Sniper (Pro)`)
    const sniperParse = PartIdentificationSchema.safeParse(tryParseJson(await callGemini(SNIPER_MODEL, PART_PROMPT, imageParts)))
    if (sniperParse.success) {
      identification = sniperParse.data
      modelUsed = SNIPER_MODEL
    } else {
      console.warn('Sniper part identification validation failed, keeping Scout result')
    }
  }

  return { identification, modelUsed }
}

// ---------------------------------------------------------------------------
// Stages 1 + 2 together: detect product types, then refine them in parallel
// ---------------------------------------------------------------------------
export async function detectAndRefineProducts(
  imageParts: ImagePart[],
  vehicleDetails: string | null,
  promptContext?: string
): Promise<{ success: true; data: DetectedProduct[] } | { success: false; error: string }> {
  const detectRes = await detectProductTypes(imageParts, vehicleDetails, promptContext)
  if (!detectRes.success) return detectRes

  const refinements = await Promise.allSettled(
    detectRes.data.map((type) => refineProduct(imageParts, type, vehicleDetails, promptContext))
  )
  const products: DetectedProduct[] = []
  for (const r of refinements) {
    if (r.status === 'fulfilled') products.push(r.value)
  }
  return { success: true, data: products }
}
