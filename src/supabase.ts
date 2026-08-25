import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const configurationError = !url || !publishableKey
  ? 'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the local environment and GitHub repository variables.'
  : null;

export const supabase = createClient(
  url || 'https://configuration-required.supabase.co',
  publishableKey || 'configuration-required',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function throwIfUnconfigured() {
  if (configurationError) throw new Error(configurationError);
}
