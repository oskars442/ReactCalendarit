// src/lib/recurrence.ts
import type { ISODate, RecurringEvent } from "@/lib/types";

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10) as ISODate;
}
export function parseISO(iso: ISODate): Date {
  // ensure midnight UTC to be consistent with @db.Date
  return new Date(`${iso}T00:00:00Z`);
}

export function ruleMatchesDate(r: RecurringEvent, dateISO: ISODate) {
  const d = parseISO(dateISO);
  const base = new Date(`${r.baseDate}T00:00:00Z`);

  // handle skips
  if (Array.isArray(r.skips) && r.skips.length) {
    const hitSkip = r.skips.some((s) => toISO(new Date(s)) === dateISO);
    if (hitSkip) return false;
  }

  if (r.recurrence === "YEARLY") {
    return d.getUTCMonth() === base.getUTCMonth() && d.getUTCDate() === base.getUTCDate();
  }
  if (r.recurrence === "MONTHLY") {
    return d.getUTCDate() === base.getUTCDate();
  }
  return false;
}

export function materializeForDate(r: RecurringEvent, dateISO: ISODate) {
  // apply simple overrides by date (optional)
  let title = r.title;
  let notes = r.notes;

  if (r.overrides && Array.isArray(r.overrides)) {
    const ov = (r.overrides as any[]).find((o) => o?.date === dateISO);
    if (ov) {
      if (ov.title) title = ov.title;
      if (ov.notes) notes = ov.notes;
    }
  }

  return {
    id: String(r.id),
    title,
    notes: notes ?? undefined,
    on: dateISO,
  };
}
