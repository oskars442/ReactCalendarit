// src/app/api/work/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/auth-helpers";

/* ---------- time helpers ---------- */
function parseLocalSql(s: string): Date {
  // "YYYY-MM-DD HH:MM:SS" -> Date
  // pieņemam, ka nāk lokālā laikā (bez TZ) un glabājas ar TZ kolonnā (Postgres timestamptz).
  // Ja vajag stingru TZ konversiju, var ieviest papildus loģiku.
  return new Date(s.replace(" ", "T"));
}
function toSqlLocal(dt: Date | null | undefined): string | null {
  if (!dt) return null;
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ---------- coercion helpers ---------- */
const TYPE_ALLOWED = ["task", "job", "meeting", "other"] as const;
const STATUS_ALLOWED = ["planned", "in_progress", "done", "cancelled"] as const;

function coerceType(v: unknown): Prisma.WorkDiaryEntryCreateInput["type"] {
  const val = (typeof v === "string" && TYPE_ALLOWED.includes(v as any)) ? v : "task";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["type"];
}
function coerceStatus(v: unknown): Prisma.WorkDiaryEntryCreateInput["status"] {
  const val = (typeof v === "string" && STATUS_ALLOWED.includes(v as any)) ? v : "planned";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["status"];
}

/* ---------- DB -> API mapper ---------- */
function mapOut(row: any) {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    type_color: row.typeColor,
    title: row.title,
    notes: row.notes,
    location: row.location,
    start_at: toSqlLocal(row.startAt),
    end_at: toSqlLocal(row.endAt),
    all_day: row.allDay ? 1 : 0,
    status: row.status,
  };
}

/* ===================== GET /api/work ===================== */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing 'from' or 'to' query params (YYYY-MM-DD HH:MM:SS)" },
        { status: 400 }
      );
    }

    const fromDt = parseLocalSql(from);
    const toDt = parseLocalSql(to);
    if (isNaN(+fromDt) || isNaN(+toDt)) {
      return NextResponse.json(
        { error: "Bad date format; expected 'YYYY-MM-DD HH:MM:SS'" },
        { status: 400 }
      );
    }

    const rows = await prisma.workDiaryEntry.findMany({
      where: {
        userId,
        startAt: { gte: fromDt, lte: toDt },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(rows.map(mapOut));
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to load entries." }, { status });
  }
}

/* ===================== POST /api/work ===================== */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const b = await req.json();

    // minimāla validācija
    if (!b?.start_at || typeof b.start_at !== "string") {
      return NextResponse.json({ error: "start_at is required" }, { status: 400 });
    }
    const startAt = parseLocalSql(b.start_at);
    if (isNaN(+startAt)) {
      return NextResponse.json({ error: "Invalid start_at" }, { status: 400 });
    }
    const endAt = b.end_at ? parseLocalSql(b.end_at) : null;
    if (b.end_at && isNaN(+endAt!)) {
      return NextResponse.json({ error: "Invalid end_at" }, { status: 400 });
    }
    if (endAt && endAt <= startAt) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const created = await prisma.workDiaryEntry.create({
      data: {
        userId,
        type: coerceType(b.type),
        label: b.label ?? null,             // used when type="other"
        typeColor: b.type_color ?? null,
        title: b.title ?? null,
        notes: b.notes ?? null,
        location: b.location ?? null,
        startAt,
        ...(endAt ? { endAt } : {}),
        allDay: !!b.all_day,
        status: coerceStatus(b.status),
      },
    });

    return NextResponse.json(mapOut(created), { status: 201 });
  } catch (e: any) {
    console.error(e);
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to create." }, { status });
  }
}
