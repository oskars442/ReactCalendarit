export async function createRecurringYearly(title: string, baseDateISO: string) {
  const res = await fetch("/api/recurring", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title,
      baseDate: baseDateISO,   // YYYY-MM-DD
      recurrence: "YEARLY",
      notes: "",
      skips: [],
      overrides: [],
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Failed to save recurring event");
  }
  return res.json();
}

export async function listRecurringForDate(dateISO: string) {
  const r = await fetch(`/api/recurring?date=${dateISO}`);
  if (!r.ok) throw new Error("Failed to load recurring events");
  return r.json() as Promise<{ occurrences: any[] }>;
}
