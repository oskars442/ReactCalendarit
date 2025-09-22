// src/services/groceries.ts  For Daily event log

import type { ISODate } from "@/lib/types";

export async function addForDate(date: ISODate, item: { title: string }) {
  // translate to API's expected payload
  const res = await fetch("/api/groceries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: item.title, date }), // API can ignore date or store it
  });
  if (!res.ok) throw new Error("groceries:add");
  return res.json(); // { item }
}