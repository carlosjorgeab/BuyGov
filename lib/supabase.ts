import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Clean functions to sanitize inputs with surrounding quotes, whitespace, etc.
export function cleanEnvValue(value: string): string {
  if (!value) return '';
  let cleaned = value.trim();
  // Remove wrapping double or single quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

export function cleanUrl(url: string): string {
  const cleaned = cleanEnvValue(url);
  if (!cleaned) return '';
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return cleaned;
    }
  } catch (e) {
    // Ignore invalid URL formatting
  }
  return '';
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabaseUrl = cleanUrl(rawUrl);
export const supabaseKey = cleanEnvValue(rawKey);

// Singleton cache for dynamically initialized client
let customClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

console.error('URL: ' || supabaseUrl || ' KEY: ' || supabaseKey);

export const supabase = (() => {
  if (supabaseUrl && supabaseKey) {
    try {
      return createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.error('Falha ao instanciar cliente Supabase inicial:', e);
      return null;
    }
  }
  return null;
})();

export const getSupabase = (customUrl?: string, customKey?: string) => {
  const cleanCustomUrl = customUrl ? cleanUrl(customUrl) : '';
  const cleanCustomKey = customKey ? cleanEnvValue(customKey) : '';

  const url = cleanCustomUrl || lastUrl || supabaseUrl;
  const key = cleanCustomKey || lastKey || supabaseKey;
  
  if (url && key) {
    if (cleanCustomUrl && cleanCustomKey) {
      // Intentionally initializing or updating custom credentials at runtime
      try {
        customClient = createClient(url, key);
        lastUrl = url;
        lastKey = key;
        return customClient;
      } catch (e) {
        console.error('Falha ao instanciar cliente Supabase dinamicamente:', e);
        return null;
      }
    }
    
    // Default caching fallback logic
    if (customClient) return customClient;
    if (supabase && url === supabaseUrl && key === supabaseKey) return supabase;
    
    try {
      customClient = createClient(url, key);
      lastUrl = url;
      lastKey = key;
      return customClient;
    } catch (e) {
      console.error('Falha ao instanciar cliente Supabase:', e);
      return null;
    }
  }
  return null;
};

