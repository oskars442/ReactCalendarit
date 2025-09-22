// src/lib/date.ts
export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function ymKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function parseMonthParam(monthParam?: string): Date {
  // monthParam is "YYYY-MM"
  if (!monthParam) return new Date();
  const [y, m] = monthParam.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfCalendarGrid(d: Date) {
  // Monday-first grid; shift to previous Monday
  const first = startOfMonth(d);
  const day = (first.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - day);
  gridStart.setHours(0, 0, 0, 0);
  return gridStart;
}

export function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function monthLabel(d: Date, locale = "en") {
  return d.toLocaleString(locale, { month: "long", year: "numeric" });
}
