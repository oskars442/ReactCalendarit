// src/app/api/health/db/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// (use a singleton in real apps to avoid exhausting connections)
const prisma = new PrismaClient();

// do not pre-render; always run on the server
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
