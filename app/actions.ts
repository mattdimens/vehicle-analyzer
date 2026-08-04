'use server'

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { DetectedProductSchema, PartIdentificationSchema } from '@/lib/schemas'
import {
  getAI,
  SCOUT_MODEL,
  SNIPER_MODEL,
  CASCADE_CONFIDENCE_THRESHOLD,
  cleanJsonResponse,
  fetchImageForGemini,
  buildSpecificLogicInstruction,
  sanitizePromptContext,
} from '@/lib/gemini'
import { assertSupabaseStorageUrl, assertSupabaseStorageUrls } from '@/lib/url-validation'

// Initialize the server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- File upload validation constants ---
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export type ImageInput = string | { inlineData: { data: string, mimeType: string } }

async function resolveImageParts(inputs: ImageInput[]) {
  const { fetchImageForGemini } = await import('@/lib/gemini')
  return Promise.all(
    inputs.map((input) => {
      if (typeof input === 'string') {
        assertSupabaseStorageUrl(input)
        return fetchImageForGemini(input)
      }
      return input
    })
  )
}

export async function analyzeVehicleFitment(
  imageInputs: ImageInput[],
  promptContext?: string
): Promise<{ success: true, data: Record<string, unknown>, modelUsed: string } | { success: false, error: string }> {
  try {
    const { getAI, SCOUT_MODEL, SNIPER_MODEL, CASCADE_CONFIDENCE_THRESHOLD, cleanJsonResponse, buildSpecificLogicInstruction } = await import('@/lib/gemini')
    const imageParts = await resolveImageParts(imageInputs)
    const contextInstruction = promptContext ? ` PAY SPECIAL ATTENTION to ${promptContext}. Ensure your analysis is relevant to users interested in ${promptContext}.` : ''
    const specificLogicInstruction = buildSpecificLogicInstruction(promptContext)
    
    const prompt =
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
    
    const scoutResponse = await getAI().models.generateContent({
        model: SCOUT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
    })
    const scoutText = cleanJsonResponse(scoutResponse.text ?? '')
    let finalResult: Record<string, unknown>
    let modelUsed: string = SCOUT_MODEL
    try {
        finalResult = JSON.parse(scoutText)
    } catch {
        return { success: false, error: 'Scout model returned invalid JSON' }
    }
    const confidenceScore = typeof finalResult.confidence_score === 'number' ? finalResult.confidence_score : 0
    if (confidenceScore <= CASCADE_CONFIDENCE_THRESHOLD) {
        const sniperResponse = await getAI().models.generateContent({
            model: SNIPER_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
        })
        const sniperText = cleanJsonResponse(sniperResponse.text ?? '')
        try {
            finalResult = JSON.parse(sniperText)
            modelUsed = SNIPER_MODEL
        } catch { }
    }
    return { success: true, data: finalResult, modelUsed }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Function 1: Get Signed URL (with file validation)
export async function createSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<
  | { success: true; data: { signedUrl: string; path: string } }
  | { success: false; error: string }
> {
  // Server-side file type validation
  if (!ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
    return { success: false, error: `Invalid file type: ${fileType}. Only JPEG, PNG, GIF, and WebP images are allowed.` }
  }

  // Generate an opaque UUID filename to prevent enumeration
  const extension = fileName.split('.').pop()
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

// --- v2: Define new interfaces for the analysis data ---
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
  confidence: number
}

export interface AnalysisResults {
  primary: PrimaryVehicle
  engineDetails: string | null
  otherPossibilities: OtherPossibility[]
  recommendedAccessories: string[]
  tieredRecommendations?: {
    title: string
    items: string[]
  }[]
}

export interface DetectedProduct {
  type: string
  brand: string
  model: string
  confidence: number
  reasoning: string
}
// --- End of new interfaces ---



// ---------------------------------------------------------------------------
// Helper: call Gemini via the new @google/genai SDK
// ---------------------------------------------------------------------------
async function callGemini(model: string, prompt: string, imageParts: ReturnType<typeof fetchImageForGemini> extends Promise<infer T> ? T[] : never[]) {
  const response = await getAI().models.generateContent({
    model,
    contents: [{ role: 'user' as const, parts: [{ text: prompt }, ...imageParts] }],
  })
  return cleanJsonResponse(response.text ?? '')
}

// ---------------------------------------------------------------------------
// Function 2: Detect Visible Products (Stage 1)
// ---------------------------------------------------------------------------
export async function detectVisibleProducts(
  imageInputs: ImageInput[],
  vehicleDetails: string | null,
  promptContext?: string
): Promise<
  | { success: true; data: string[] }
  | { success: false; error: string }
> {
  try {
    const imageParts = await resolveImageParts(imageInputs)

    const vehicleContext = vehicleDetails
      ? `Given that this is a ${vehicleDetails}`
      : ''

    const safeContext = sanitizePromptContext(promptContext)
    const contextInstruction = safeContext
      ? `Focus specifically on detecting products related to: ${safeContext}. `
      : ''

    const prompt =
      `You are a vehicle product specialist. ${vehicleContext}, scan these images and detect all visible aftermarket or OEM products (like Tonneau Cover, Wheels, Tires, Hitch, Roof Rack, Bumper, Side Steps, etc.). ` +
      contextInstruction +
      'Respond ONLY with a valid, minified JSON array of strings, where each string is a product type. ' +
      'Example: ["Tonneau Cover", "Wheels", "Tires", "Trailer Hitch"]'

    const cleanedText = await callGemini(SCOUT_MODEL, prompt, imageParts)

    const rawProductTypes = JSON.parse(cleanedText)
    const productTypesResult = z.array(z.string()).safeParse(rawProductTypes)
    const productTypes = productTypesResult.success ? productTypesResult.data : []

    if (!Array.isArray(productTypes)) {
      return { success: true, data: [] }
    }

    return { success: true, data: productTypes }
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
  imageInputs: ImageInput[],
  productType: string,
  vehicleDetails: string | null,
  promptContext?: string
): Promise<DetectedProduct> {
  try {
    const imageParts = await resolveImageParts(imageInputs)

    const stage2Context = vehicleDetails ? `on this ${vehicleDetails}` : ''

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
    const scoutText = await callGemini(SCOUT_MODEL, prompt, imageParts)

    const scoutRaw = JSON.parse(scoutText)
    const scoutParse = DetectedProductSchema.safeParse(scoutRaw)
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

    // --- Gatekeeper: check Scout confidence (Skip if hardcoded unknown fallback) ---
    const isHardcodedUnknown = product.brand === 'Unknown' && product.model === 'Unknown' && product.confidence === 50
    
    if (product.confidence <= CASCADE_CONFIDENCE_THRESHOLD && !isHardcodedUnknown) {
      console.log(`Scout product confidence ${product.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD} for ${productType}: escalating to Sniper`)
      const sniperText = await callGemini(SNIPER_MODEL, prompt, imageParts)

      const sniperRaw = JSON.parse(sniperText)
      const sniperParse = DetectedProductSchema.safeParse(sniperRaw)
      if (sniperParse.success) {
        product = sniperParse.data // Sniper overrides Scout
      } else {
        console.warn(`Sniper product validation failed for ${productType}, keeping Scout result:`, sniperParse.error.flatten())
      }
    }

    return product
  } catch (err) {
    console.error(`Error refining ${productType}:`, err)
    return {
      type: productType,
      brand: "Unknown Brand",
      model: "Unknown Model",
      confidence: 0,
      reasoning: "Error during product refinement. Could not analyze."
    }
  }
}

// --- Visual Part Identifier ---

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
// Function 5: Identify a Car Part from an Image
// ---------------------------------------------------------------------------
export async function identifyPart(
  publicImageUrl: string
): Promise<
  | { success: true; data: PartIdentification }
  | { success: false; error: string }
> {
  try {
    // Security: validate URL points to our Supabase storage
    assertSupabaseStorageUrl(publicImageUrl)

    const imageParts = [await fetchImageForGemini(publicImageUrl)]

    const prompt =
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

    // --- Cascading Model: Scout pass (Flash) ---
    let modelUsed = SCOUT_MODEL
    const scoutText = await callGemini(SCOUT_MODEL, prompt, imageParts)

    const scoutRaw = JSON.parse(scoutText)
    const scoutParse = PartIdentificationSchema.safeParse(scoutRaw)
    if (!scoutParse.success) {
      console.error('Scout part identification validation failed:', scoutParse.error.flatten())
      throw new Error('The AI returned an unexpected response format. Please try again.')
    }
    let identification = scoutParse.data

    // --- Gatekeeper: check Scout confidence ---
    if (identification.confidence <= CASCADE_CONFIDENCE_THRESHOLD) {
      console.log(`Scout part confidence ${identification.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD}: escalating to Sniper (Pro)`)
      const sniperText = await callGemini(SNIPER_MODEL, prompt, imageParts)

      const sniperRaw = JSON.parse(sniperText)
      const sniperParse = PartIdentificationSchema.safeParse(sniperRaw)
      if (sniperParse.success) {
        identification = sniperParse.data
        modelUsed = SNIPER_MODEL
      } else {
        console.warn('Sniper part identification validation failed, keeping Scout result:', sniperParse.error.flatten())
      }
    }

    // Save to Supabase (Issue #29: include model_used)
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_data: identification,
        image_url: publicImageUrl,
        model_used: modelUsed,
      })
      .select()

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
export async function updateAnalysisResultsProducts(
  imageUrl: string,
  detectedProducts: DetectedProduct[]
) {
  try {
    // Get the most recent analysis for this image
    const { data: record, error: fetchError } = await supabase
      .from('analysis_results')
      .select('id, analysis_data')
      .eq('image_url', imageUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !record) {
      console.error('Could not find record to update:', fetchError)
      return { success: false, error: fetchError?.message || 'Record not found' }
    }

    // append to JSON
    const updatedAnalysisData = {
      ...(record.analysis_data as Record<string, unknown>),
      detectedProducts,
    }

    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({ analysis_data: updatedAnalysisData })
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
