'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// Initialize the server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initialize the Google AI client
const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!})

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

// Function 1: Get Signed URL
export async function createSignedUploadUrl(fileName: string, fileType: string) {

  // THIS IS THE FIX: 
  // The 'expiresIn' and 'contentType' parameters are not valid here.
  // The only valid option is 'upsert'.
  const { data, error } = await supabase.storage
 .from('vehicle_images')
 .createSignedUploadUrl(fileName, {
      upsert: true, // This is the only valid option
    })

  if (error) {
    console.error('Error creating signed URL:', error.message)
    return { failure: error.message }
  }
  return { success: data }
}

// Function 2: Analyze Image
export async function analyzeVehicleImage(publicImageUrl: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' }) 

    const prompt =
  'You are an expert vehicle mechanic. Identify the vehicle\'s year, make, model, type (e.g., "SUV", "Sedan", "Pickup Truck"), color, and condition (e.g., "new", "used", "damaged"). Also list 3-5 recommended aftermarket accessories as a simple array of strings. Respond ONLY with a valid, minified JSON object with this exact structure: { "year": number | null, "make": string, "model": string, "vehicleType": string, "color": string, "condition": string, "recommendedAccessories": [string] }'

    const imagePart = await urlToGenerativePart(publicImageUrl, 'image/jpeg') 

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response
    const text = response.text()

    // Parse the JSON
    const jsonData = JSON.parse(text)

    // Save to Supabase
const { data: dbData, error: dbError } = await supabase
   .from('analysis_results')
   .insert({ 
      analysis_data: jsonData, // This is the JSON from the AI
      image_url: publicImageUrl // This is the URL of the image
    })
   .select()

    if (dbError) {
      console.error('Supabase DB error:', dbError.message)
      throw new Error(dbError.message)
    }

    return { success: jsonData }
  } catch (error: any) {
    console.error('Error in analyzeVehicleImage:', error)
    return { failure: error.message }
  }
}
