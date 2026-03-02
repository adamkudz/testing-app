import { createClient } from '@supabase/supabase-js'

export function useServiceSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )
}
