// src/services/workDiary.ts  For Daily event log

import type { ISODate } from "@/lib/types";
export async function add(input: { date: ISODate; text: string }): Promise<void> {
  await new Promise(r => setTimeout(r, 200));
  console.info("[workDiary] added", input);
}
