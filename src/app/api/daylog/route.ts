// src/app/api/daylog/route.ts (tikai GET daļa – POST var atstāt kā iepriekš)
import { NextResponse } from "next/server";
import { DayLogSchema, isoDateRegex } from "@/lib/zodSchemas";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ISODate } from "@/lib/types";

/* helpers */
function dayRange(dateISO: ISODate) {
  const start = new Date(`${dateISO}T00:00:00.000Z`);
  const end = new Date(`${dateISO}T23:59:59.999Z`);
  return { start, end };
}
function sameYMD(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
function sameMonthDay(a: Date, b: Date) {
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}
function parseOverrides(ov: unknown): Record<string, any> | null {
  if (!ov) return null;
  try {
    if (typeof ov === "object") return ov as Record<string, any>;
    if (typeof ov === "string") return JSON.parse(ov) as Record<string, any>;
  } catch {}
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") as ISODate | null;

    if (!date || !isoDateRegex.test(date)) {
      return NextResponse.json(
        { error: "Missing or invalid 'date' (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // ——— userId
    const session = await getServerSession(authOptions);
    const rawId = (session?.user as any)?.id;
    const userId = rawId == null ? null : (typeof rawId === "string" ? Number(rawId) : rawId);
    const userFilter = userId ? { userId } : { userId: null as any };

    // ——— DayLog pa dienas intervālu (droši pret TZ)
    const { start, end } = dayRange(date);
    const dayLog = await prisma.dayLog.findFirst({
      where: { ...userFilter, date: { gte: start, lte: end } },
    });

    // ——— Recurring occurrences šai dienai
    const target = new Date(`${date}T00:00:00Z`);

    // Atlasām YEARLY ierakstus un pēc tam klient-pusē filtrējam pēc baseDate mēneša/dienas,
    // kā arī ņemam vērā skips/overrides.
    const rec = await prisma.recurringEvent.findMany({
      where: { ...userFilter, recurrence: "YEARLY" as any },
      select: {
        id: true,
        title: true,
        notes: true,
        recurrence: true,
        baseDate: true,
        skips: true,
        overrides: true,
      },
      orderBy: { id: "asc" },
    });

    const occurrences = rec.flatMap((r) => {
      // 1) override: ja overrides satur tieši šo datumu – ņemam override saturu
      const ov = parseOverrides(r.overrides);
      const overrideForDay = ov && ov[date] ? (ov[date] as any) : null;
      if (overrideForDay) {
        return [
          {
            id: r.id,
            title: overrideForDay.title ?? r.title ?? "",
            note: overrideForDay.note ?? r.notes ?? null,
            recurrence: r.recurrence,
            date, // informatīvi
          },
        ];
      }

      // 2) ja ir skip šai dienai – nerādām
      const isSkipped =
        Array.isArray(r.skips) &&
        r.skips.some((s) => sameYMD(new Date(s as any), target));
      if (isSkipped) return [];

      // 3) YEARLY: rādam, ja baseDate mēnesis/diena sakrīt ar target
      if (sameMonthDay(new Date(r.baseDate), target)) {
        return [
          {
            id: r.id,
            title: r.title ?? "",
            note: r.notes ?? null,
            recurrence: r.recurrence,
            date,
          },
        ];
      }

      return [];
    });

    return NextResponse.json({ dayLog, occurrences }, { status: 200 });
  } catch (err) {
    console.error("GET /api/daylog failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
