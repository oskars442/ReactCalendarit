// src/app/api/health/db/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const r = await prisma.$queryRawUnsafe('select 1 as ok');
    return NextResponse.json({ ok: true, r });
  } catch (e) {
    console.error('DB_HEALTH_ERROR', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
