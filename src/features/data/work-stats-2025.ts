// src/features/data/work-stats-2025.ts
export type WorkStats = { days: number; hours: number };

export const WORK_STATS_2025: Record<number, WorkStats> = {
  1: { days: 22, hours: 176 }, // Janvāris
  2: { days: 20, hours: 160 }, // Februāris
  3: { days: 21, hours: 168 }, // Marts
  4: { days: 20, hours: 158 }, // Aprīlis
  5: { days: 20, hours: 160 }, // Maijs
  6: { days: 19, hours: 152 }, // Jūnijs
  7: { days: 23, hours: 184 }, // Jūlijs
  8: { days: 21, hours: 168 }, // Augusts
  9: { days: 22, hours: 176 }, // Septembris
  10: { days: 23, hours: 184 }, // Oktobris
  11: { days: 19, hours: 151 }, // Novembris
  12: { days: 19, hours: 150 }, // Decembris
};
