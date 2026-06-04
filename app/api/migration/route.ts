import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'supabase_migration.sql');
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ sql: content });
  } catch (error) {
    return NextResponse.json({ sql: '-- Arquivo de migração não encontrado.' }, { status: 404 });
  }
}
