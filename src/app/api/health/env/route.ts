// src/app/api/health/env/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.DATABASE_URL || '';
  // redact password but show host/port/params
  const shown = url.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@');
  return NextResponse.json({
    runtime: 'nodejs',
    node: process.version,
    DATABASE_URL: shown,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL ? 'set' : 'missing',
  });
}
