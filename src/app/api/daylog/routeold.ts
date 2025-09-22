// src/app/api/daylog/route.ts
import { NextResponse } from "next/server";
import { DayLogSchema, isoDateRegex } from "@/lib/zodSchemas";
import { repo } from "@/lib/repo";
import { ruleMatchesDate, materializeForDate } from "@/lib/recurrence";
import type { ISODate, DayLog } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") as ISODate | null;
    if (!date || !isoDateRegex.test(date)) {
      return NextResponse.json({ error: "Missing or invalid 'date' (YYYY-MM-DD)" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 1;

    const dayLog = await repo.getDayLog(userId, date);
    const rules = repo.listRecurring();
    const occurrences = rules
      .filter(r => ruleMatchesDate(r, date))
      .map(r => materializeForDate(r, date));

    return NextResponse.json({ dayLog, occurrences });
  } catch (err) {
    console.error("GET /api/daylog failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 1;

    const json = await req.json();
    const parsed = DayLogSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input: DayLog = parsed.data as DayLog;
    const saved = await repo.upsertDayLog(userId, input);
    return NextResponse.json({ ok: true, dayLog: saved });
  } catch (err) {
    console.error("POST /api/daylog failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
