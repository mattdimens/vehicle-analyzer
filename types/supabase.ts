export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            analysis_results: {
                Row: {
                    id: number
                    created_at: string
                    image_url: string | null
                    vehicle_make: string | null
                    vehicle_model: string | null
                    vehicle_year: number | null
                    accessories_found: Json | null
                    analysis_data: Json | null
                    model_used: string | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    image_url?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_year?: number | null
                    accessories_found?: Json | null
                    analysis_data?: Json | null
                    model_used?: string | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    image_url?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_year?: number | null
                    accessories_found?: Json | null
                    analysis_data?: Json | null
                    model_used?: string | null
                }
                Relationships: []
            }
            garage_vehicles: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    year: number
                    make: string
                    model: string
                    trim: string | null
                    nickname: string | null
                    photo_url: string | null
                    identified_via: string | null
                    ai_identification_data: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    year: number | string
                    make: string
                    model: string
                    trim?: string | null
                    nickname?: string | null
                    photo_url?: string | null
                    identified_via?: string | null
                    ai_identification_data?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    year?: number | string
                    make?: string
                    model?: string
                    trim?: string | null
                    nickname?: string | null
                    photo_url?: string | null
                    identified_via?: string | null
                    ai_identification_data?: Json | null
                }
                Relationships: []
            }
            identified_parts: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    part_name: string
                    part_category: string
                    brand: string | null
                    part_number: string | null
                    estimated_price: number | null
                    affiliate_url: string | null
                    description: string | null
                    confidence: number | null
                    vehicle_year: string | null
                    vehicle_make: string | null
                    vehicle_model: string | null
                    vehicle_trim: string | null
                    photo_url: string | null
                    ai_identification_data: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    part_name: string
                    part_category: string
                    brand?: string | null
                    part_number?: string | null
                    estimated_price?: number | null
                    affiliate_url?: string | null
                    description?: string | null
                    confidence?: number | null
                    vehicle_year?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_trim?: string | null
                    photo_url?: string | null
                    ai_identification_data?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    part_name?: string
                    part_category?: string
                    brand?: string | null
                    part_number?: string | null
                    estimated_price?: number | null
                    affiliate_url?: string | null
                    description?: string | null
                    confidence?: number | null
                    vehicle_year?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_trim?: string | null
                    photo_url?: string | null
                    ai_identification_data?: Json | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// --- Convenience types for use throughout the app ---
export type GarageVehicleRow = Database['public']['Tables']['garage_vehicles']['Row']
export type GarageVehicleInsert = Database['public']['Tables']['garage_vehicles']['Insert']
export type IdentifiedPartRow = Database['public']['Tables']['identified_parts']['Row']
export type IdentifiedPartInsert = Database['public']['Tables']['identified_parts']['Insert']
export type AnalysisResultRow = Database['public']['Tables']['analysis_results']['Row']
