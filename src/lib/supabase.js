import { createClient } from "@supabase/supabase-js";

// Follow the current Vite origin in development, not a fixed local port.
const supabaseUrl = import.meta.env.DEV
  ? new URL("/supabase", window.location.origin).href
  : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
