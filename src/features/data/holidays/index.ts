import holidays2025 from "../holidays-2025.json";
import holidays2026 from "../holidays-2026.json";

export type Holiday = {
  date: string; title: string;
  type: "holiday" | "preHoliday" | "movedDay";
  shortHours?: number; description?: string;
};

export const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: holidays2025 as Holiday[],
  2026: holidays2026 as Holiday[],
};

export function getHolidaysForYear(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}
