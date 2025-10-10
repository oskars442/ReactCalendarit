// src/app/[locale]/(dashboard)/CalendarMonthClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarMonth from "@/components/CalendarMonth";
import { useRecurringMonth } from "@/hooks/useRecurringMonth";

type DayItem = { id: string; title: string };

export type DayDTO = {
  dateISO: string;
  day: number;
  inMonth: boolean;
  items: DayItem[];      // work-diary items (we’ll render as a briefcase only)
  dayColor?: string;
  hasTodos?: boolean;
  todoPriority?: "low" | "med" | "high"; // ⬅️ jauns lauks
};

export default function CalendarMonthClient({
  days,
  weekdayLabels,
}: {
  days: DayDTO[];
  weekdayLabels: string[];
}) {
  const [localDays, setLocalDays] = useState<DayDTO[]>(days);
  useEffect(() => setLocalDays(days), [days]);

  // Day color live update
  useEffect(() => {
    const onSavedColor = (e: Event) => {
      const detail = (e as CustomEvent).detail as { date?: string; dayColor?: string | null } | undefined;
      const date = detail?.date;
      if (!date) return;
      const dayColor = detail?.dayColor ?? undefined;
      setLocalDays((prev) => prev.map((d) => (d.dateISO === date ? { ...d, dayColor } : d)));
    };
    window.addEventListener("calendarit:daylogSaved", onSavedColor);
    return () => window.removeEventListener("calendarit:daylogSaved", onSavedColor);
  }, []);

  // To-Do icon live update
  useEffect(() => {
    const onTodos = (e: Event) => {
      const detail = (e as CustomEvent).detail as { date?: string } | undefined;
      const date = detail?.date;
      if (!date) return;
      setLocalDays((prev) => prev.map((d) => (d.dateISO === date ? { ...d, hasTodos: true } : d)));
    };
    window.addEventListener("calendarit:todosChanged", onTodos);
    return () => window.removeEventListener("calendarit:todosChanged", onTodos);
  }, []);

  // Work Diary icon live update
  useEffect(() => {
    const onDiary = (e: Event) => {
      const detail = (e as CustomEvent).detail as { date?: string } | undefined;
      const date = detail?.date;
      if (!date) return;
      setLocalDays((prev) =>
        prev.map((d) =>
          d.dateISO === date
            ? { ...d, items: d.items && d.items.length > 0 ? d.items : [{ id: "optimistic", title: "" }] }
            : d
        )
      );
    };
    window.addEventListener("calendarit:workDiaryChanged", onDiary);
    return () => window.removeEventListener("calendarit:workDiaryChanged", onDiary);
  }, []);

  const handleOpenDate = (iso: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("d", iso);
    history.pushState({}, "", url.toString());
    window.dispatchEvent(new CustomEvent("calendarit:openDay", { detail: { date: iso } }));
  };

  // Determine visible year/month from any in-month day
  const { year, month } = useMemo(() => {
    const probe =
      localDays.find((d) => d.inMonth) ??
      localDays[Math.min(15, Math.max(0, localDays.length - 1))] ??
      { dateISO: new Date().toISOString().slice(0, 10) };
    const [y, m] = probe.dateISO.split("-").map(Number);
    return { year: y, month: m };
  }, [localDays]);

  const recurringDates = useRecurringMonth(year, month); // Set<string>

  return (
    <CalendarMonth
      days={localDays}
      weekdayLabels={weekdayLabels}
      onOpenDate={handleOpenDate}
      recurringDates={recurringDates}
    />
  );
}
