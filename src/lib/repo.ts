// src/lib/repo.ts
import { prisma } from "@/lib/db";
import type { DayLog, ISODate, RecurringEvent } from "./types";

// keep recurring in-memory if you want
const recurring = new Map<string, RecurringEvent>();

export const repo = {
  // ---------- DayLog (DB) ----------
  async getDayLog(userId: number, date: ISODate): Promise<DayLog | null> {
    const row = await prisma.dayLog.findUnique({
      where: { daylog_user_date_unique: { userId, date: new Date(date) } },
      select: {
        date: true, dayColor: true,
      },
    });
    if (!row) return null;
    return {
      date,
      dayColor   : (row.dayColor ?? undefined) as DayLog["dayColor"],
    };
  },

  async upsertDayLog(userId: number, input: DayLog): Promise<DayLog> {
    const date = new Date(input.date);
    await prisma.dayLog.upsert({
      where: { daylog_user_date_unique: { userId, date } },
      create: {
        userId, date,
        dayColor    : input.dayColor   ?? null,
      },
      update: {
        dayColor    : input.dayColor   ?? null,
      },
    });
    return input;
  },

  /** Pull all day logs in range to build a color map efficiently */
  async getDayLogsInRange(userId: number, fromISO: ISODate, toISO: ISODate) {
    const rows = await prisma.dayLog.findMany({
      where: { userId, date: { gte: new Date(fromISO), lte: new Date(toISO) } },
      select: { date: true, dayColor: true },
    });
    const map = new Map<ISODate, string | undefined>();
    for (const r of rows) {
      const iso = r.date.toISOString().slice(0, 10) as ISODate;
      map.set(iso, r.dayColor ?? undefined);
    }
    return map;
  },

  // ---------- Recurring (unchanged) ----------
  listRecurring(): RecurringEvent[] {
    return [...recurring.values()];
  },
  saveRecurring(input: Omit<RecurringEvent, "id"> & { id?: string }) {
    const id = input.id ?? crypto.randomUUID();
    const obj: RecurringEvent = { ...(input as any), id };
    recurring.set(id, obj);
    return obj;
  },
  deleteRecurring(id: string) {
    return recurring.delete(id);
  },
};
