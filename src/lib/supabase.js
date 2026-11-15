import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY // clave pública: la seguridad la dan las políticas RLS

export const supabaseConfigurado = Boolean(url && key)
export const supabase = supabaseConfigurado ? createClient(url, key) : null
