'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

// Function 1: Get Signed URL (No changes needed here)
export async function createSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<
  | { success: true; data: { signedUrl: string; path: string } }
  | { success: false; error: string }
> {
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
}

export interface DetectedProduct {
  type: string
  brand: string
  model: string
  confidence: number
  reasoning: string
}
// --- End of new interfaces ---

// Function 2: Analyze Image (Updated)
export async function analyzeVehicleImage(publicImageUrl: string): Promise<
  | {
    success: true
    data: AnalysisResults // Use the new interface
  }
  | { success: false; error: string }
> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // --- v2: This is the new, more detailed prompt ---
    const prompt =
      'You are an expert vehicle mechanic and fitment specialist. Analyze the vehicle in the image. ' +
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
      '* `recommendedAccessories` (an array of 3-5 recommended aftermarket accessories as strings) ' +
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
      '"recommendedAccessories": [string]' +
      '}'

    const imagePart = await urlToGenerativePart(publicImageUrl, 'image/jpeg')

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response
    const text = response.text()

    // Clean the AI's response to remove the markdown wrapper
    const cleanedText = text.replace('```json', '').replace('```', '').trim()

    // Parse the JSON
    const analysis: AnalysisResults = JSON.parse(cleanedText) // Cast to our new interface

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_data: analysis, // This is the full JSON from the AI
        image_url: publicImageUrl,
      })
      .select()

    if (dbError) {
      console.error('Supabase DB error:', dbError.message)
      throw new Error(dbError.message)
    }

    // --- v2: Return the new data structure ---
    return {
      success: true,
      data: {
        primary: analysis.primary,
        engineDetails: analysis.engineDetails,
        otherPossibilities: analysis.otherPossibilities,
        recommendedAccessories: analysis.recommendedAccessories,
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
  publicImageUrl: string,
  vehicleDetails: string | null
): Promise<
  | { success: true; data: string[] }
  | { success: false; error: string }
> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const imagePart = await urlToGenerativePart(publicImageUrl, 'image/jpeg')

    const vehicleContext = vehicleDetails
      ? `Given that this is a ${vehicleDetails}`
      : ''

    const prompt =
      `You are a vehicle product specialist. ${vehicleContext}, scan the image and detect all visible aftermarket or OEM products (like Tonneau Cover, Wheels, Tires, Hitch, Roof Rack, Bumper, Side Steps, etc.). ` +
      'Respond ONLY with a valid, minified JSON array of strings, where each string is a product type. ' +
      'Example: ["Tonneau Cover", "Wheels", "Tires", "Trailer Hitch"]'

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text()
    const cleanedText = text.replace('```json', '').replace('```', '').trim()

    const productTypes = JSON.parse(cleanedText) as string[]

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

// Function 4: Refine Product Details (Stage 2)
export async function refineProductDetails(
  publicImageUrl: string,
  productType: string,
  vehicleDetails: string | null
): Promise<DetectedProduct> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const imagePart = await urlToGenerativePart(publicImageUrl, 'image/jpeg')

    const stage2Context = vehicleDetails ? `on this ${vehicleDetails}` : ''

    const prompt =
      `I have detected a "${productType}" ${stage2Context}. Look very closely at just this product in the image. ` +
      'Use logos, design patterns, and any other visual cues to determine its exact brand and model (e.g., "BAK / BAKFlip MX4", "Ford / 20-inch 6-Spoke Dark Alloy"). ' +
      'Also provide a confidence score (0-100) for your brand/model identification and a brief reasoning. ' +
      'Respond ONLY with a valid, minified JSON object: {"type": string, "brand": string, "model": string, "confidence": number, "reasoning": string}. ' +
      'If you can identify the type but not brand/model, return {"type": "' +
      productType +
      '", "brand": "Unknown", "model": "Unknown", "confidence": 50, "reasoning": "Insufficient visual details"}.'

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response
      .text()
      .replace('```json', '')
      .replace('```', '')
      .trim()

    return JSON.parse(text) as DetectedProduct
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
  publicImageUrl: string
): Promise<
  | { success: true; data: ImageQualityResult }
  | { success: false; error: string }
> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const imagePart = await urlToGenerativePart(publicImageUrl, 'image/jpeg')

    const prompt =
      'Analyze this vehicle image for quality issues that might affect AI identification. Check for: ' +
      '1. Blurriness or low resolution. ' +
      '2. Bad lighting (too dark, too bright, or strong glare). ' +
      '3. Bad angle (too close, extreme angle, or only a small part of the vehicle is visible). ' +
      '4. Obstructions or cropping (is the main body of the vehicle fully visible?). ' +
      'Respond ONLY with a valid, minified JSON object: ' +
      '{ "isHighQuality": boolean, "score": number (0-100), "issues": string[] (list of specific problems found, or empty if good) }. ' +
      'Set isHighQuality to false if the score is below 70.'

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response
      .text()
      .replace('```json', '')
      .replace('```', '')
      .trim()

    return { success: true, data: JSON.parse(text) as ImageQualityResult }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}