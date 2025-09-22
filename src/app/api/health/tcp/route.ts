// src/app/api/health/tcp/route.ts
import { NextResponse } from 'next/server';
import net from 'node:net';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function probe(host: string, port: number, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (ok: boolean) => {
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('error', () => onDone(false));
    socket.once('timeout', () => onDone(false));
    socket.connect(port, host, () => onDone(true));
  });
}

export async function GET() {
  const host = 'db.uxnlfkbvqbuazacggvdc.supabase.co';
  const p5432 = await probe(host, 5432);
  const p6543 = await probe(host, 6543);
  return NextResponse.json({ host, p5432, p6543 });
}
