import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton to avoid "supabaseUrl is required" at build/SSR time
let _client: SupabaseClient | null = null

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    const value = (_client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(_client)
    }
    return value
  },
})
