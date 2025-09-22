// src/lib/types.ts

/** Date-only ISO string, e.g. "2025-09-20" */
export type ISODate = `${number}-${number}-${number}`; // YYYY-MM-DD

// Keep if anything else still imports it
export type MoneyCents = number;

/** Hex color like "#0ea5e9" or "#000" */
export type HexColor = `#${string}`;

/** Minimal Day Log: only date + color */
export interface DayLog {
  date: ISODate;

  /**
   * Color for the day number in the month grid.
   * - string: set color
   * - null: clear color
   * - undefined: no change (when editing)
   */
  dayColor?: HexColor | null;
}

export type Recurrence = "MONTHLY" | "YEARLY";

/** Client-side shape for recurring events */
export interface RecurringEvent {
  // Prisma returns a number; some client code may coerce it to string
  id: number | string;

  title: string;

  /** Seed date; day+month matter for matching, year is the anchor */
  baseDate: ISODate; // date-only

  recurrence: Recurrence; // 'MONTHLY' | 'YEARLY'

  notes?: string | null;

  /** Dates to skip (date-only) */
  skips?: ISODate[];

  /** Per-date overrides (title/notes) */
  overrides?: Array<{ date: ISODate; title?: string; notes?: string }>;
}
