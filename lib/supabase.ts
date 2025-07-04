import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type FreightRequest = {
  id: string
  user_id?: string
  phone_number: string
  source_address: string
  source_lat: number
  source_lng: number
  destination_address: string
  destination_lat: number
  destination_lng: number
  distance_km: number
  weight_kg: number
  calculated_price: number
  status: string
  created_at: string
}

export type User = {
  id: string
  phone_number: string
  created_at: string
}
