// src/app/api/recurring/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecurringEventSchema, isoDateRegex } from "@/lib/zodSchemas";

type ISODate = `${number}-${number}-${number}`; // YYYY-MM-DD

/* ---------- helpers (UTC, date-only safe) ---------- */
function parseISO(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd));
}
const pad2 = (n: number) => String(n).padStart(2, "0");
const isoUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

function daysInMonthUTC(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const session = await getServerSession(authOptions);
    const userId =
      session?.user && (session.user as any).id
        ? Number((session.user as any).id)
        : null;

    /* ---------- MONTH VIEW: /api/recurring?month=YYYY-MM ---------- */
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const [yy, mm] = monthParam.split("-").map(Number);
      if (!yy || !mm) {
        return NextResponse.json({ error: "Invalid month" }, { status: 400 });
      }

      const rows = await prisma.recurringEvent.findMany({
        where: { ...(userId ? { userId } : { userId: null }) },
        orderBy: { id: "desc" },
      });

      const last = daysInMonthUTC(yy, mm);
      const hitDates = new Set<string>();

      for (let d = 1; d <= last; d++) {
        const cellISO = `${yy}-${pad2(mm)}-${pad2(d)}`;

        for (const r of rows) {
          // Apply recurrence
          const base = r.baseDate; // Date (UTC midnight because @db.Date)
          const matchesYearly =
            r.recurrence === "YEARLY" &&
            base.getUTCMonth() + 1 === mm &&
            base.getUTCDate() === d;

          const matchesMonthly =
            r.recurrence === "MONTHLY" && base.getUTCDate() === d;

          if (!(matchesYearly || matchesMonthly)) continue;

          // Apply skips (array of Date stored as @db.Date)
          const skipHit =
            Array.isArray(r.skips) &&
            r.skips.some((s) => isoUTC(s) === cellISO);
          if (skipHit) continue;

          // We don’t need overrides to render an icon (they modify title/notes)
          hitDates.add(cellISO);
        }
      }

      return NextResponse.json({ dates: [...hitDates] });
    }

    /* ---------- SINGLE DAY: /api/recurring?date=YYYY-MM-DD ---------- */
    const date = searchParams.get("date");
    if (!date || !isoDateRegex.test(date)) {
      return NextResponse.json(
        { error: "Missing/invalid date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    const target = parseISO(date);

    const rows = await prisma.recurringEvent.findMany({
      where: { ...(userId ? { userId } : { userId: null }) },
      orderBy: { id: "desc" },
    });

    const occurrences = rows
      .filter((r) => {
        if (r.recurrence === "YEARLY") {
          return (
            r.baseDate.getUTCMonth() === target.getUTCMonth() &&
            r.baseDate.getUTCDate() === target.getUTCDate()
          );
        }
        if (r.recurrence === "MONTHLY") {
          return r.baseDate.getUTCDate() === target.getUTCDate();
        }
        return false;
      })
      .filter((r) => {
        // apply skips
        const tISO = isoUTC(target);
        return !(
          Array.isArray(r.skips) && r.skips.some((s) => isoUTC(s) === tISO)
        );
      })
      .map((r) => {
        // apply overrides for this exact date (title/notes only)
        const tISO = isoUTC(target);
        let title = r.title;
        let notes = r.notes ?? undefined;

        if (Array.isArray(r.overrides)) {
          const ov = (r.overrides as any[]).find((o) => o?.date === tISO);
          if (ov) {
            title = ov.title ?? title;
            notes = ov.notes ?? notes;
          }
        }
        return { ...r, title, notes };
      });

    return NextResponse.json({ occurrences });
  } catch (err) {
    console.error("GET /api/recurring failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId =
      session?.user && (session.user as any).id
        ? Number((session.user as any).id)
        : null;

    const body = await req.json();
    const parsed = RecurringEventSchema.parse(body);

    const baseDate = parseISO(parsed.baseDate);
    const skips = (parsed.skips ?? []).map(parseISO);
    const overrides = parsed.overrides ?? [];

    const saved = await prisma.recurringEvent.create({
      data: {
        title: parsed.title,
        baseDate,
        recurrence: parsed.recurrence, // 'MONTHLY' | 'YEARLY'
        notes: parsed.notes ?? null,
        skips,
        overrides,
        ...(userId ? { userId } : { userId: null }),
      },
    });

    return NextResponse.json({ ok: true, recurring: saved });
  } catch (err) {
    console.error("POST /api/recurring failed:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
