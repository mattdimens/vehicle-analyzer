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
