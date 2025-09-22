//src/lib/recurrence.ts   For Daily event log

import type { ISODate, RecurringEvent } from "./types";

export function parseISO(d: ISODate): Date {
  const [y,m,day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m-1, day));
}
export function toISO(date: Date): ISODate {
  return new Date(date.getTime() - date.getTimezoneOffset()*60000)
    .toISOString().slice(0,10) as ISODate;
}

export function ruleMatchesDate(rule: RecurringEvent, dateISO: ISODate): boolean {
  const d = parseISO(dateISO);
  const base = parseISO(rule.baseDate);
  if (d < base) return false;
  if (rule.skips?.includes(dateISO)) return false;

  if (rule.recurrence === "MONTHLY") {
    return d.getUTCDate() === base.getUTCDate();
  } else {
    return d.getUTCDate() === base.getUTCDate() && d.getUTCMonth() === base.getUTCMonth();
  }
}

export function materializeForDate(rule: RecurringEvent, dateISO: ISODate) {
  const override = rule.overrides?.find(o => o.date === dateISO);
  return {
    ...rule,
    title: override?.title ?? rule.title,
    notes: override?.notes ?? rule.notes,
  };
}

export function listOccurrencesForMonth(
  rules: RecurringEvent[],
  year: number,
  month1to12: number
): Record<ISODate, number> {
  const counts: Record<ISODate, number> = {};
  const start = new Date(Date.UTC(year, month1to12-1, 1));
  const end = new Date(Date.UTC(year, month1to12, 0));
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate()+1)) {
    const iso = toISO(d);
    let c = 0;
    for (const r of rules) if (ruleMatchesDate(r, iso)) c++;
    if (c > 0) counts[iso] = c;
  }
  return counts;
}
