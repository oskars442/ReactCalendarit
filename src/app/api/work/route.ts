// src/app/api/work/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client"; // TS types only, no enums imported

// ---- auth placeholder (swap with NextAuth etc.)
async function getUserId() {
  return 1; // dev only
}

// ---- datetime helpers
function parseLocalSql(s: string): Date {
  // "YYYY-MM-DD HH:MM:SS" -> Date
  return new Date(s.replace(" ", "T"));
}
function toSqlLocal(dt: Date | null | undefined): string | null {
  if (!dt) return null;
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---- runtime coercion for type/status (works whether those fields are enums or strings)
const TYPE_ALLOWED = ["task", "job", "meeting", "other"] as const;
const STATUS_ALLOWED = ["planned", "in_progress", "done", "cancelled"] as const;

function coerceType(v: unknown): Prisma.WorkDiaryEntryCreateInput["type"] {
  const val =
    typeof v === "string" && TYPE_ALLOWED.includes(v as any) ? v : "task";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["type"];
}

function coerceStatus(v: unknown): Prisma.WorkDiaryEntryCreateInput["status"] {
  const val =
    typeof v === "string" && STATUS_ALLOWED.includes(v as any) ? v : "planned";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["status"];
}

// ---- DB row -> UI (snake_case) mapper
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

// ====== GET
export async function GET(req: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json([]);

  const rows = await prisma.workDiaryEntry.findMany({
    where: {
      userId,
      startAt: { gte: parseLocalSql(from), lte: parseLocalSql(to) },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(rows.map(mapOut));
}

// ====== POST
export async function POST(req: Request) {
  const userId = await getUserId();
  const b = await req.json();

  try {
    const created = await prisma.workDiaryEntry.create({
      data: {
        userId,
        type: coerceType(b.type),
        label: b.label ?? null,              // used when type="other"
        typeColor: b.type_color ?? null,
        title: b.title ?? null,
        notes: b.notes ?? null,
        location: b.location ?? null,
        startAt: parseLocalSql(b.start_at),
        ...(b.end_at ? { endAt: parseLocalSql(b.end_at) } : {}), // don't pass null
        allDay: !!b.all_day,
        status: coerceStatus(b.status),
      },
    });

    return NextResponse.json(mapOut(created), { status: 201 });
  } catch (e: any) {
    const code = e?.meta?.code || e?.code || e?.cause?.code;
    if (code === "23514") {
      // check constraint: endAt > startAt
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create." }, { status: 500 });
  }
}

// ====== PUT
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const b = await req.json();

  try {
    const updated = await prisma.workDiaryEntry.update({
      where: { id },
      data: {
        type: coerceType(b.type),
        label: b.label ?? null,
        typeColor: b.type_color ?? null,
        title: b.title ?? null,
        notes: b.notes ?? null,
        location: b.location ?? null,
        startAt: parseLocalSql(b.start_at),
        ...(b.end_at ? { endAt: parseLocalSql(b.end_at) } : {}),
        allDay: !!b.all_day,
        status: coerceStatus(b.status),
      },
    });

    return NextResponse.json(mapOut(updated));
  } catch (e: any) {
    const code = e?.meta?.code || e?.code || e?.cause?.code;
    if (code === "23514") {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

// ====== DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.workDiaryEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
