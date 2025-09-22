// src/hooks/useRecurringMonth.ts
"use client";
import * as React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function useRecurringMonth(year: number, month: number) {
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  const { data, mutate } = useSWR<{ dates: string[] }>(
    `/api/recurring?month=${ym}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  React.useEffect(() => {
    const h = () => mutate();
    window.addEventListener("calendarit:recurringChanged", h);
    return () => window.removeEventListener("calendarit:recurringChanged", h);
  }, [mutate]);

  return new Set(data?.dates ?? []);
}
