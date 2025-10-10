export type WorkoutKind = "run" | "walk" | "ride" | "swim" | "strength" | "yoga" | "other";

export type StrengthSet = {
  movement: string;
  sets?: number | null;
  reps?: number | null;
  weightKg?: number | null;
};

export type WorkoutSession = {
  id: string;
  userId?: number | string;
  dateISO: string;
  kind: WorkoutKind;
  durationMin: number;
  distanceKm?: number | null;
  perceivedEffort?: number | null;
  notes?: string;
  tags?: string[];
  strengthSets?: StrengthSet[];
  createdAt: number;
  updatedAt: number;
  source?: "manual" | "wearable";
};

export type QuickFormState = {
  kind: WorkoutKind;
  durationMin: number;
  distanceKm?: number | null;
  perceivedEffort?: number | null;
  notes?: string;
  strengthSets?: StrengthSet[];
};

export const KIND_META = (t: (k: string) => string) =>
  ({
    run: { label: t("workout.kinds.run"), emoji: "🏃", color: "from-rose-500 to-pink-500" },
    walk: { label: t("workout.kinds.walk"), emoji: "🚶", color: "from-emerald-500 to-teal-500" },
    ride: { label: t("workout.kinds.ride"), emoji: "🚴", color: "from-sky-500 to-cyan-500" },
    swim: { label: t("workout.kinds.swim"), emoji: "🏊", color: "from-blue-500 to-indigo-500" },
    strength: { label: t("workout.kinds.strength"), emoji: "🏋️", color: "from-amber-500 to-orange-500" },
    yoga: { label: t("workout.kinds.yoga"), emoji: "🧘", color: "from-fuchsia-500 to-purple-500" },
    other: { label: t("workout.kinds.other"), emoji: "✨", color: "from-zinc-500 to-neutral-500" },
  }) as const;
