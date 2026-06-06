import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (() => {
  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://')) {
    try {
      return createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.error('Falha ao instanciar cliente Supabase:', e);
      return null;
    }
  }
  return null;
})();

export const getSupabase = (customUrl?: string, customKey?: string) => {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseKey;
  if (url && key && url.startsWith('https://')) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Falha ao instanciar cliente Supabase customizado:', e);
      return null;
    }
  }
  return null;
};
