// src/app/[locale]/(dashboard)/calendar/CalendarClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DayDialog from "@/components/day/DayDialog";
import type { ISODate } from "@/lib/types";

function parseDateFromUrl(): ISODate | null {
  try {
    const u = new URL(window.location.href);
    const d = u.searchParams.get("d");
    if (!d) return null;
    // Ļoti vienkārša validācija: YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? (d as ISODate) : null;
  } catch {
    return null;
  }
}

export default function CalendarClient() {
  const [openDate, setOpenDate] = useState<ISODate | null>(null);

  // startā – nolasa ?d
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpenDate(parseDateFromUrl());
  }, []);

  // klausāmies uz custom eventu no CalendarMonthClient.handleOpenDate
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { date?: string } | undefined;
      const iso = detail?.date;
      if (!iso) return;
      setOpenDate(iso as ISODate);
    };
    window.addEventListener("calendarit:openDay", onOpen as EventListener);
    return () => window.removeEventListener("calendarit:openDay", onOpen as EventListener);
  }, []);

  // back/forward – uztur sinhronu ar URL
  useEffect(() => {
    const onPop = () => setOpenDate(parseDateFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // aizverot – izņem ?d no URL (bet paliek tajā pašā mēnesī)
  const handleOpenChange = useCallback((v: boolean) => {
    if (v) return; // open true – neko nemainām
    setOpenDate(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("d");
      history.pushState({}, "", url.toString());
    } catch {}
  }, []);

  const open = useMemo(() => !!openDate, [openDate]);

  return (
    <DayDialog
      date={openDate}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
}
