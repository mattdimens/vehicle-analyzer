'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

// Initialize the server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// --- Cascading model constants ---
const SCOUT_MODEL = 'gemini-3-flash-preview'   // Fast + cheap — always runs first
const SNIPER_MODEL = 'gemini-3-pro-preview'      // Slower + smarter — fallback
const CASCADE_CONFIDENCE_THRESHOLD = 85           // Scout confidence ≤ this → escalate to Sniper

// Helper: clean markdown-wrapped JSON from AI responses
function cleanJsonResponse(text: string): string {
  return text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
}

// Helper function to fetch an image from a URL and convert it to base64
async function urlToGenerativePart(url: string, mimeType: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  }
}

// --- File upload validation constants ---
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

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

  const { data, error } = await supabase.storage
    .from('vehicle_images')
    .createSignedUploadUrl(fileName, {
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

// --- Zod schemas for runtime validation of AI responses ---
const PrimaryVehicleSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.string(),
  trim: z.string(),
  cabStyle: z.string().nullable(),
  bedLength: z.string().nullable(),
  vehicleType: z.string(),
  color: z.string(),
  condition: z.string(),
  confidence: z.number(),
})

const AnalysisResultsSchema = z.object({
  primary: PrimaryVehicleSchema,
  engineDetails: z.string().nullable(),
  otherPossibilities: z.array(z.object({
    name: z.string().default(''),
    vehicle: z.string().optional(),
    yearRange: z.string().optional(),
    trim: z.string().optional(),
    confidence: z.number(),
  }).transform(item => ({
    name: item.name || item.vehicle || 'Unknown',
    confidence: item.confidence,
  }))),
  recommendedAccessories: z.array(z.string()),
  tieredRecommendations: z.array(z.object({
    title: z.string(),
    items: z.array(z.string()),
  })).optional(),
})

const DetectedProductSchema = z.object({
  type: z.string(),
  brand: z.string(),
  model: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
})
// --- End of Zod schemas ---

// Function 2: Analyze Image (Updated)
export async function analyzeVehicleImage(
  publicImageUrls: string[],
  promptContext?: string
): Promise<
  | {
    success: true
    data: AnalysisResults // Use the new interface
  }
  | { success: false; error: string }
> {
  try {
    const contextInstruction = promptContext
      ? ` PAY SPECIAL ATTENTION to ${promptContext}. Ensure your analysis is relevant to users interested in ${promptContext}.`
      : ''

    let specificLogicInstruction = '';
    if (promptContext && (promptContext.toLowerCase().includes('truck bed cover') || promptContext.toLowerCase().includes('tonneau'))) {
      specificLogicInstruction = `
        For the "recommendedAccessories", follow this STRICT hierarchy:
        1. "Essential Bed Protection & Organization Add-ons": Bed Mats/Rugs (e.g. BedRug, Dee Zee), Swing-out cases (e.g. UnderCover SwingCase), BedSlides (e.g. BEDSLIDE S), Cargo Bars, Tailgate Seals, Electronic Tailgate Locks.
        2. "Compatible Hauling Hardware & Rack Systems": Bed Racks (e.g. Yakima OverHaul, Thule), Toolboxes (e.g. UWS Low Profile).
        3. "Alternative Truck Bed Enclosure Solutions": Camper Shells (e.g. LEER, ARE), Soft Toppers (e.g. Softopper), Canvas Tarps.

        IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
        
        INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
      `;
    } else if (promptContext && (promptContext.toLowerCase().includes('wheels') || promptContext.toLowerCase().includes('rims') || promptContext.toLowerCase().includes('tires'))) {
      specificLogicInstruction = `
        For the "recommendedAccessories", follow this STRICT hierarchy:
        1. "Essential Tire Integration & Installation Hardware": Tires (e.g. Nitto Ridge Grappler, Falken Wildpeak), TPMS Sensors (e.g. Autel MX-Sensor), Hub Centric Rings (e.g. Gorilla), Aftermarket Lug Nuts (e.g. McGard, Gorilla).
        2. "Stance Modification & Clearance Components": Suspension (e.g. Bilstein 5100, Rough Country Lift), Fender Flares (e.g. Bushwacker Pocket Style), Wheel Spacers (e.g. Bora, Spidertrax).
        3. "Cosmetic Overlay & Restoration Alternatives": Wheel Skins (e.g. Coast to Coast), Hubcaps, Caliper Covers (e.g. MGP).

        IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
        
        INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
      `;
    } else if (promptContext && (promptContext.toLowerCase().includes('nerf bars') || promptContext.toLowerCase().includes('running boards') || promptContext.toLowerCase().includes('side steps'))) {
      specificLogicInstruction = `
        For the "recommendedAccessories", follow this STRICT hierarchy:
        1. "Supplemental Access Points & Paint Protection": Rear Access (e.g. AMP Research BedStep), Hitch Steps (e.g. WeatherTech BumpStep), Mud Flaps (e.g. WeatherTech No-Drill), Door Sill Guards (e.g. AVS).
        2. "Heavy-Duty Frame Protection & Lighting Integration": Rock Sliders (e.g. N-Fab RKR, Tyger Auto), LED Light Strips (e.g. OPT7), Gap Guards (e.g. Performance Accessories).
        3. "Automated & Compact Step Alternatives": Power Steps (e.g. AMP Research PowerStep), Hoop Steps (e.g. Bully, N-Fab), Drop Steps (e.g. Westin HDX).

        IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
        
        INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
      `;
    }

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
      '* `engineDetails` (string, e.g., "5.0L V8", "2.7L EcoBoost V6", or "No details available" if not visible/determinable) ' +
      '* `otherPossibilities` (an array of 2-3 other likely possibilities, each with its own vehicle name, year range, trim, and confidence) ' +
      '* `recommendedAccessories` (an array of 3-5 recommended aftermarket accessories as strings. ALWAYS format each string as "Product Name (e.g. Example 1, Example 2)". IF tiered recommendations are requested, keep this as a fallback summary list). ' +
      specificLogicInstruction +
      'Respond ONLY with a valid, minified JSON object with this exact structure: ' +
      '{' +
      '"primary": {' +
      '"make": string, "model": string, "year": string, "trim": string, "cabStyle": string | null, "bedLength": string | null, ' +
      '"vehicleType": string, "color": string, "condition": string, "confidence": number' +
      '}, ' +
      '"engineDetails": string | null, ' +
      '"otherPossibilities": [' +
      '{ "vehicle": string, "yearRange": string, "trim": string, "confidence": number }' +
      '], ' +
      '"recommendedAccessories": [string], ' +
      '"tieredRecommendations": [{ "title": string, "items": [string] }] (OPTIONAL, include only if instructed)' +
      '}'

    const imageParts = await Promise.all(
      publicImageUrls.map((url) => urlToGenerativePart(url, 'image/jpeg'))
    )

    // --- Cascading Model: Scout pass (Flash) ---
    const scoutModel = genAI.getGenerativeModel({ model: SCOUT_MODEL })
    const scoutResult = await scoutModel.generateContent([prompt, ...imageParts])
    const scoutText = cleanJsonResponse(scoutResult.response.text())

    const scoutRaw = JSON.parse(scoutText)
    const scoutParse = AnalysisResultsSchema.safeParse(scoutRaw)
    if (!scoutParse.success) {
      console.error('Scout AI response validation failed:', scoutParse.error.flatten())
      throw new Error('The AI returned an unexpected response format. Please try again.')
    }
    let analysis: AnalysisResults = scoutParse.data

    // --- Gatekeeper: check Scout confidence ---
    if (analysis.primary.confidence <= CASCADE_CONFIDENCE_THRESHOLD) {
      console.log(`Scout confidence ${analysis.primary.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD} — escalating to Sniper (Pro)`)
      const sniperModel = genAI.getGenerativeModel({ model: SNIPER_MODEL })
      const sniperResult = await sniperModel.generateContent([prompt, ...imageParts])
      const sniperText = cleanJsonResponse(sniperResult.response.text())

      const sniperRaw = JSON.parse(sniperText)
      const sniperParse = AnalysisResultsSchema.safeParse(sniperRaw)
      if (sniperParse.success) {
        analysis = sniperParse.data // Sniper overrides Scout
      } else {
        // Sniper failed validation — keep Scout result rather than crashing
        console.warn('Sniper response validation failed, keeping Scout result:', sniperParse.error.flatten())
      }
    }

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_data: analysis,
        image_url: publicImageUrls[0],
      })
      .select()

    if (dbError) {
      console.error('Supabase DB error:', dbError.message)
      throw new Error(dbError.message)
    }

    return {
      success: true,
      data: {
        primary: analysis.primary,
        engineDetails: analysis.engineDetails,
        otherPossibilities: analysis.otherPossibilities,
        recommendedAccessories: analysis.recommendedAccessories,
        tieredRecommendations: analysis.tieredRecommendations,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// Function 3: Detect Visible Products (Stage 1)
export async function detectVisibleProducts(
  publicImageUrls: string[],
  vehicleDetails: string | null,
  promptContext?: string
): Promise<
  | { success: true; data: string[] }
  | { success: false; error: string }
> {
  try {
    const model = genAI.getGenerativeModel({ model: SCOUT_MODEL })
    const imageParts = await Promise.all(
      publicImageUrls.map((url) => urlToGenerativePart(url, 'image/jpeg'))
    )

    const vehicleContext = vehicleDetails
      ? `Given that this is a ${vehicleDetails}`
      : ''

    const contextInstruction = promptContext
      ? `Focus specifically on detecting products related to: ${promptContext}. `
      : ''

    const prompt =
      `You are a vehicle product specialist. ${vehicleContext}, scan these images and detect all visible aftermarket or OEM products (like Tonneau Cover, Wheels, Tires, Hitch, Roof Rack, Bumper, Side Steps, etc.). ` +
      contextInstruction +
      'Respond ONLY with a valid, minified JSON array of strings, where each string is a product type. ' +
      'Respond ONLY with a valid, minified JSON array of strings, where each string is a product type. ' +
      'Example: ["Tonneau Cover", "Wheels", "Tires", "Trailer Hitch"]'

    const result = await model.generateContent([prompt, ...imageParts])
    const cleanedText = cleanJsonResponse(result.response.text())

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
} // End of detectVisibleProducts

// Function 4: Refine Product Details (Stage 2)
export async function refineProductDetails(
  publicImageUrls: string[],
  productType: string,
  vehicleDetails: string | null,
  promptContext?: string
): Promise<DetectedProduct> {
  try {
    const imageParts = await Promise.all(
      publicImageUrls.map((url) => urlToGenerativePart(url, 'image/jpeg'))
    )

    const stage2Context = vehicleDetails ? `on this ${vehicleDetails}` : ''

    const contextInstruction = promptContext
      ? ` Consider that the user is specifically interested in ${promptContext}. Focus heavily on details relevant to this category.`
      : ''

    const prompt =
      `I have detected a "${productType}" ${stage2Context}. Look very closely at this product in the provided images. ` +
      contextInstruction +
      'Use logos, design patterns, and any other visual cues to determine its exact brand and model (e.g., "BAK / BAKFlip MX4", "Ford / 20-inch 6-Spoke Dark Alloy"). ' +
      'Use logos, design patterns, and any other visual cues to determine its exact brand and model (e.g., "BAK / BAKFlip MX4", "Ford / 20-inch 6-Spoke Dark Alloy"). ' +
      'Also provide a confidence score (0-100) for your brand/model identification and a brief reasoning. ' +
      'Respond ONLY with a valid, minified JSON object: {"type": string, "brand": string, "model": string, "confidence": number, "reasoning": string}. ' +
      'If you can identify the type but not brand/model, return {"type": "' +
      productType +
      '", "brand": "Unknown", "model": "Unknown", "confidence": 50, "reasoning": "Insufficient visual details"}.'

    // --- Cascading Model: Scout pass (Flash) ---
    const scoutModel = genAI.getGenerativeModel({ model: SCOUT_MODEL })
    const scoutResult = await scoutModel.generateContent([prompt, ...imageParts])
    const scoutText = cleanJsonResponse(scoutResult.response.text())

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

    // --- Gatekeeper: check Scout confidence ---
    if (product.confidence <= CASCADE_CONFIDENCE_THRESHOLD) {
      console.log(`Scout product confidence ${product.confidence} ≤ ${CASCADE_CONFIDENCE_THRESHOLD} for ${productType} — escalating to Sniper`)
      const sniperModel = genAI.getGenerativeModel({ model: SNIPER_MODEL })
      const sniperResult = await sniperModel.generateContent([prompt, ...imageParts])
      const sniperText = cleanJsonResponse(sniperResult.response.text())

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
      confidence: 0.8,
      reasoning: "Detected based on visual features."
    }
  }
}

export interface ImageQualityResult {
  isHighQuality: boolean
  score: number
  issues: string[]
}

// Function 5: Check Image Quality
export async function checkImageQuality(
  publicImageUrls: string[]
): Promise<
  | { success: true; data: ImageQualityResult }
  | { success: false; error: string }
> {
  try {
    const model = genAI.getGenerativeModel({ model: SCOUT_MODEL })
    const imageParts = await Promise.all(
      publicImageUrls.map((url) => urlToGenerativePart(url, 'image/jpeg'))
    )

    const prompt =
      'Analyze these vehicle images for quality issues that might affect AI identification. Check for: ' +
      '1. Blurriness or low resolution. ' +
      '2. Bad lighting (too dark, too bright, or strong glare). ' +
      '3. Bad angle (too close, extreme angle, or only a small part of the vehicle is visible). ' +
      '4. Obstructions or cropping (is the main body of the vehicle fully visible?). ' +
      'Respond ONLY with a valid, minified JSON object: ' +
      '{ "isHighQuality": boolean, "score": number (0-100), "issues": string[] (list of specific problems found across the images, or empty if good) }. ' +
      'Set isHighQuality to false if the score is below 70.'

    const result = await model.generateContent([prompt, ...imageParts])
    const cleanedText = cleanJsonResponse(result.response.text())

    return { success: true, data: JSON.parse(cleanedText) as ImageQualityResult }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}