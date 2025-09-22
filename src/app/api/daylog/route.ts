// src/app/api/daylog/route.ts
import { NextResponse } from "next/server";
import { DayLogSchema, isoDateRegex } from "@/lib/zodSchemas";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ISODate } from "@/lib/types";

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

    const session = await getServerSession(authOptions);
    const userId =
      session?.user && (session.user as any).id
        ? Number((session.user as any).id)
        : null;

    const dayLog = await prisma.dayLog.findFirst({
      where: {
        date: new Date(date),
        ...(userId ? { userId } : { userId: null }),
      },
    });

    return NextResponse.json({ dayLog, occurrences: [] });
  } catch (err) {
    console.error("GET /api/daylog failed:", err);
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

    const json = await req.json();
    // DayLogSchema should now only validate: { date: ISODate, dayColor?: string }
    const parsed = DayLogSchema.parse(json);

    const dateObj = new Date(parsed.date);
    const newColor: string | null = parsed.dayColor ?? null; // null clears color

    const existing = await prisma.dayLog.findFirst({
      where: {
        date: dateObj,
        ...(userId ? { userId } : { userId: null }),
      },
    });

    const saved = existing
      ? await prisma.dayLog.update({
          where: { id: existing.id },
          data: { dayColor: newColor },
        })
      : await prisma.dayLog.create({
          data: {
            date: dateObj,
            dayColor: newColor,
            ...(userId ? { userId } : { userId: null }),
          },
        });

    return NextResponse.json({ ok: true, dayLog: saved });
  } catch (err) {
    console.error("POST /api/daylog failed:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
