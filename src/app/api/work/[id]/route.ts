import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** ---------- keep helpers consistent with /api/work/route.ts ---------- */

// auth placeholder (swap with NextAuth etc.)
async function getUserId() {
  return 1; // dev only
}

// "YYYY-MM-DD HH:MM:SS" -> Date
function parseLocalSql(s: string): Date {
  return new Date(String(s).replace(" ", "T"));
}

// Date -> "YYYY-MM-DD HH:MM:SS" (local-shaped string)
function toSqlLocal(dt: Date | null | undefined): string | null {
  if (!dt) return null;
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const TYPE_ALLOWED = ["task", "job", "meeting", "other"] as const;
const STATUS_ALLOWED = ["planned", "in_progress", "done", "cancelled"] as const;

function coerceType(v: unknown): Prisma.WorkDiaryEntryCreateInput["type"] {
  const val = typeof v === "string" && TYPE_ALLOWED.includes(v as any) ? v : "task";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["type"];
}

function coerceStatus(v: unknown): Prisma.WorkDiaryEntryCreateInput["status"] {
  const val = typeof v === "string" && STATUS_ALLOWED.includes(v as any) ? v : "planned";
  return val as unknown as Prisma.WorkDiaryEntryCreateInput["status"];
}

// DB row -> API shape (snake_case fields like your Diary.tsx expects)
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

/** ---------- GET /api/work/[id] (optional: fetch single) ---------- */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const row = await prisma.workDiaryEntry.findFirst({
    where: { id, userId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(mapOut(row));
}

/** ---------- PATCH /api/work/[id] (update one) ---------- */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const b = await req.json();

  try {
    // updateMany to enforce user scope; then fetch row
    const { count } = await prisma.workDiaryEntry.updateMany({
      where: { id, userId },
      data: {
        ...(b.type !== undefined ? { type: coerceType(b.type) } : {}),
        ...(b.label !== undefined ? { label: b.label ?? null } : {}),
        ...(b.type_color !== undefined ? { typeColor: b.type_color ?? null } : {}),
        ...(b.title !== undefined ? { title: b.title ?? null } : {}),
        ...(b.notes !== undefined ? { notes: b.notes ?? null } : {}),
        ...(b.location !== undefined ? { location: b.location ?? null } : {}),
        ...(b.start_at !== undefined ? { startAt: parseLocalSql(b.start_at) } : {}),
        ...(b.end_at !== undefined
          ? b.end_at
            ? { endAt: parseLocalSql(b.end_at) }
            : { endAt: null }
          : {}),
        ...(b.all_day !== undefined ? { allDay: !!b.all_day } : {}),
        ...(b.status !== undefined ? { status: coerceStatus(b.status) } : {}),
      },
    });

    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = await prisma.workDiaryEntry.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(mapOut(row));
  } catch (e: any) {
    const code = e?.meta?.code || e?.code || e?.cause?.code;
    if (code === "23514") {
      // e.g. DB check constraint on end > start
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }
    console.error("PATCH /api/work/[id] error:", e);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

/** ---------- DELETE /api/work/[id] (delete one) ---------- */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { count } = await prisma.workDiaryEntry.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
