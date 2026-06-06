import { NextResponse } from 'next/server';
import { cleanEnvValue, cleanUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const supabaseUrl = cleanUrl(rawUrl);
  const supabaseKey = cleanEnvValue(rawKey);

  return NextResponse.json({
    supabaseUrl,
    supabaseKey,
  });
}
