// src/lib/zodSchemas.ts
import { z } from "zod";

export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const DayLogSchema = z
  .object({
    date: z.string().regex(isoDateRegex),
    // string = set color, null = clear color, undefined = not provided
    dayColor: z.union([z.string().regex(hexColorRegex), z.null()]).optional(),
  })
  // require the field to be present so accidental empty saves don't pass
  .refine((v) => v.dayColor !== undefined, {
    message: "At least one field must be provided.",
  });

export const RecurringEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120),
  baseDate: z.string().regex(isoDateRegex),
  recurrence: z.enum(["MONTHLY", "YEARLY"]),
  notes: z.string().max(500).optional(),
  skips: z.array(z.string().regex(isoDateRegex)).optional(),
  overrides: z
    .array(
      z.object({
        date: z.string().regex(isoDateRegex),
        title: z.string().max(120).optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .optional(),
});
