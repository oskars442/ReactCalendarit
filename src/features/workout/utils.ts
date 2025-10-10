export const uid = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID?.()) ||
  Math.random().toString(36).slice(2);

export const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function loadLocal(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function saveLocal(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
export function buildWeek(dateISO: string, all: any[]) {
  const base = startOfWeek(new Date(dateISO));
  const days: { dateISO: string; minutes: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const minutes = all.filter((s) => s.dateISO === iso).reduce((a, s) => a + s.durationMin, 0);
    days.push({ dateISO: iso, minutes });
  }
  return days;
}

/* i18n-aware formatters (t padod no komponenta) */
export function fmtMins(m: number, t: (k: string, o?: any) => string) {
  return t("mins", { value: Math.floor(m) });
}
export function fmtKm(k: number | null | undefined, t: (k: string, o?: any) => string) {
  if (k == null) return "—";
  return t("kms", { value: Number(k).toFixed(2) });
}
