import { WORK_STATS_2025 } from "../work-stats-2025";
import { WORK_STATS_2026 } from "../work-stats-2026";

export type WorkStats = { days: number; hours: number };
export const WORK_STATS_BY_YEAR: Record<number, Record<number, WorkStats>> = {
  2025: WORK_STATS_2025,
  2026: WORK_STATS_2026,
};
export const getWorkStats = (year: number, month1to12: number) =>
  WORK_STATS_BY_YEAR[year]?.[month1to12];
