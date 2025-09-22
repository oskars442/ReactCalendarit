// src/app/[locale]/(dashboard)/calendar/page.tsx
import { prisma } from "@/lib/db";
import {
  parseMonthParam,
  startOfMonth,
  endOfMonth,
  startOfCalendarGrid,
  addDays,
  monthLabel,
  ymKey,
} from "@/lib/date";
import MonthSwitcher from "@/components/MonthSwitcher";
import CalendarMonthClient from "./CalendarMonthClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ISODate } from "@/lib/types";

// keep only what the grid needs
type EventLike = {
  id: string;
  title: string;
  start?: Date | null;
  startsAt?: Date | null;
};

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  // scope to user if you have auth
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && (session.user as any).id
      ? Number((session.user as any).id)
      : null;

  const { locale } = await params;
  const { month } = await searchParams;

  const monthDate = parseMonthParam(month);
  const label = monthLabel(monthDate, locale ?? "en");
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  /* ---------------- Work-diary events (for briefcase icon) ---------------- */
  let events: EventLike[] = [];
  try {
    const dbEvents = await prisma.workDiaryEntry.findMany({
      where: {
        startAt: { gte: start, lte: end },
        ...(userId ? { userId } : {}),
      },
      select: { id: true, title: true, startAt: true },
      orderBy: { startAt: "asc" },
    });
    events = dbEvents.map((e) => ({
      id: String(e.id),
      title: e.title ?? "(untitled)",
      start: e.startAt,
      startsAt: e.startAt,
    }));
  } catch {
    events = [];
  }

  /* ---------------- Day colors (from DayLog table) ---------------- */
  const dayLogs = await prisma.dayLog.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(userId ? { userId } : {}),
    },
    select: { date: true, dayColor: true },
  });

  const colorMap = new Map<string, string>();
  for (const dl of dayLogs) {
    if (!dl.dayColor) continue;
    const iso = dl.date.toISOString().slice(0, 10); // YYYY-MM-DD
    colorMap.set(iso, dl.dayColor);
  }

  /* ---------------- To-dos due per day (for notepad icon) ---------------- */
  let todoDates = new Set<string>();
  try {
    const todos = await prisma.todoItem.findMany({
      where: {
        ...(userId ? { userId } : {}),
        done: false,
        due: { gte: start, lte: end }, // only todos with a due date within month
      },
      select: { due: true },
    });
    todoDates = new Set(
      todos
        .map((t) => (t.due ? new Date(t.due) : null))
        .filter(Boolean)
        .map((d) => (d as Date).toISOString().slice(0, 10))
    );
  } catch {
    todoDates = new Set();
  }

  /* ---------------- Build 6x7 grid ---------------- */
  const gridStart = startOfCalendarGrid(monthDate);
  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = addDays(gridStart, i);
    const inMonth = ymKey(d) === ymKey(monthDate);
    const dateISO = d.toLocaleDateString("sv-SE") as ISODate; // YYYY-MM-DD
    const day = d.getDate();

    const items =
      events
        .filter((e) => {
          const raw = e.start ?? e.startsAt ?? null;
          const dt = raw ? new Date(raw) : null;
          return !!dt && dt.toISOString().slice(0, 10) === dateISO;
        })
        .map((e) => ({ id: e.id, title: e.title })) ?? [];

    const dayColor = colorMap.get(dateISO);
    const hasTodos = todoDates.has(dateISO);

    return { dateISO, day, inMonth, items, dayColor, hasTodos };
  });

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 2 + i).toLocaleDateString(locale ?? "en", {
      weekday: "short",
    })
  );

  return (
    <div className="grid gap-4">
      <div className="mb-2 flex items-center justify-center gap-3">
        <MonthSwitcher direction="prev" />
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {label}
        </h2>
        <MonthSwitcher direction="next" />
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        <CalendarMonthClient days={days} weekdayLabels={weekdayLabels} />
      </div>

      <CalendarClient />
    </div>
  );
}

// keep import after component to avoid circular warnings
import CalendarClient from "./CalendarClient";
