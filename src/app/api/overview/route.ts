// src/app/api/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/* ----------------------------- helpers ----------------------------- */
// YYYY-MM-DD in server's local tz (matches how you format on the client)
function toISODateLocal(d: Date): string {
  return d.toLocaleDateString("sv-SE"); // 2025-09-20
}
// HH:MM in server's local tz (24h)
function toHHMMLocal(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// 🔸 PRIORITY normalizer: Prisma var atdot 'LOW'/'MED'/'HIGH' vai 'low'/'med'/'high'
type UiPriority = "low" | "med" | "high";
function toUiPriority(p: unknown): UiPriority {
  const s = String(p ?? "").toLowerCase();
  if (s.startsWith("h")) return "high";
  if (s.startsWith("l")) return "low";
  return "med";
}

/* ------------------------------- types ----------------------------- */
type Item =
  | { kind: "work"; id: string; title: string; dateISO: string; timeHHMM?: string }
  | { kind: "todo"; id: string; title: string; dateISO: string; priority: UiPriority } // ⬅️ pievienots priority
  | { kind: "recurring-monthly"; id: string; title: string; dateISO: string }
  | { kind: "recurring-yearly"; id: string; title: string; dateISO: string };

/* -------------------------------- GET ------------------------------ */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from/to are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Inclusive local range [from 00:00 .. to 23:59:59.999]
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59.999`);

  const session = await getServerSession(authOptions);
  const userFilter =
    session?.user && (session.user as any).id
      ? { userId: Number((session.user as any).id) }
      : {};

  /* ------------------------ 1) Work diary ------------------------- */
  const work: Item[] = await prisma.workDiaryEntry
    .findMany({
      where: { startAt: { gte: start, lte: end }, ...userFilter },
      select: { id: true, title: true, startAt: true },
      orderBy: { startAt: "asc" },
    })
    .then((rows) =>
      rows.map((r) => ({
        kind: "work" as const,
        id: String(r.id),
        title: r.title ?? "(untitled)",
        dateISO: r.startAt ? toISODateLocal(r.startAt) : toISODateLocal(start),
        timeHHMM: r.startAt ? toHHMMLocal(r.startAt) : undefined,
      }))
    );

  /* --------------------------- 2) To-dos -------------------------- */
  const todos: Item[] = await prisma.todoItem
    .findMany({
      where: { ...userFilter, done: false, due: { gte: start, lte: end } },
      // ⬇️ pievieno "priority" laukam select
      select: { id: true, title: true, due: true, priority: true },
      orderBy: { due: "asc" },
    })
    .then((rows) =>
      rows
        .filter((r) => !!r.due)
        .map((r) => ({
          kind: "todo" as const,
          id: String(r.id),
          title: r.title ?? "(untitled)",
          dateISO: toISODateLocal(r.due as Date),
          priority: toUiPriority(r.priority), // ⬅️ normalizē līdz "low|med|high"
        }))
    );

  /* ---------------------- 3) Recurring events --------------------- */
  const rec = await prisma.recurringEvent.findMany({
    where: { ...userFilter },
    select: { id: true, title: true, baseDate: true, recurrence: true },
  });

  const recItems: Item[] = [];
  const day = new Date(start);

  while (day <= end) {
    for (const r of rec) {
      if (!r.baseDate) continue;
      const base = new Date(r.baseDate);

      const sameDay = day.getDate() === base.getDate();
      const sameMonth = day.getMonth() === base.getMonth();

      if (r.recurrence === "MONTHLY" && sameDay) {
        recItems.push({
          kind: "recurring-monthly",
          id: `${r.id}@${toISODateLocal(day)}`,
          title: r.title,
          dateISO: toISODateLocal(day),
        });
      } else if (r.recurrence === "YEARLY" && sameDay && sameMonth) {
        recItems.push({
          kind: "recurring-yearly",
          id: `${r.id}@${toISODateLocal(day)}`,
          title: r.title,
          dateISO: toISODateLocal(day),
        });
      }
    }
    day.setDate(day.getDate() + 1);
  }

  /* ---------------------------- merge ----------------------------- */
  const items: Item[] = [...work, ...todos, ...recItems];

  return NextResponse.json({ items });
}
