"use client";

import { useState } from "react";
import type { QuickFormState, StrengthSet, WorkoutKind } from "../types";
import { clamp } from "../utils";
import { useTranslations } from "@/lib/i18n/i18n";

type Props = {
  onSubmit: (v: QuickFormState) => void;
  defaultKind?: WorkoutKind;
  /** ja vajag, vari rādīt kompaktāku versiju (šobrīd tikai props rezervēts) */
  compact?: boolean;
};

export default function QuickLog({ onSubmit, defaultKind = "run" }: Props) {
  const t = useTranslations("workout");

  const [kind, setKind] = useState<WorkoutKind>(defaultKind);
  const [durationMin, setDurationMin] = useState<number>(30);
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [effort, setEffort] = useState<number | "">(6);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const [sets, setSets] = useState<StrengthSet[]>([]);

  const isCardio =
    kind === "run" || kind === "walk" || kind === "ride" || kind === "swim";
  const isStrength = kind === "strength";

  function addSet() {
    setSets((s) => [...s, { movement: "", sets: 3, reps: 10, weightKg: null }]);
  }
  function updateSet(i: number, patch: Partial<StrengthSet>) {
    setSets((arr) => arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeSet(i: number) {
    setSets((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setBusy(true);
    const payload: QuickFormState = {
      kind,
      durationMin: clamp(Number(durationMin) || 0, 1, 1440),
      distanceKm: isCardio
        ? distanceKm === ""
          ? null
          : Math.max(0, Number(distanceKm))
        : undefined,
      perceivedEffort: effort === "" ? null : clamp(Number(effort), 1, 10),
      notes: notes.trim() || undefined,
      strengthSets: isStrength
        ? sets.filter((s) => (s.movement || "").trim().length > 0)
        : undefined,
    };
    onSubmit(payload);
    // reset
    setNotes("");
    setSets([]);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Type & base fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabeledInput label={t("fields.type")}>
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as WorkoutKind)}
          >
            <option value="run">{t("kinds.run")}</option>
            <option value="walk">{t("kinds.walk")}</option>
            <option value="ride">{t("kinds.ride")}</option>
            <option value="swim">{t("kinds.swim")}</option>
            <option value="strength">{t("kinds.strength")}</option>
            <option value="yoga">{t("kinds.yoga")}</option>
            <option value="other">{t("kinds.other")}</option>
          </select>
        </LabeledInput>

        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label={t("fields.duration")}>
            <input
              type="number"
              min={1}
              max={1440}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value || "0"))}
              className="input w-full"
            />
          </LabeledInput>

          {isCardio && (
            <LabeledInput label={t("fields.distance")} hint={t("optional")}>
              <input
                type="number"
                step="0.01"
                min={0}
                value={distanceKm}
                onChange={(e) =>
                  setDistanceKm(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input w-full"
              />
            </LabeledInput>
          )}
        </div>
      </div>

      {/* Strength sets editor */}
      {isStrength && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("fields.sets")}
          </div>
          <div className="rounded-xl border divide-y">
            {sets.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                {t("noSetsYet")}
              </div>
            )}
            {sets.map((row, i) => (
              <div key={i} className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    className="input"
                    placeholder={t("placeholders.exercise")}
                    value={row.movement}
                    onChange={(e) => updateSet(i, { movement: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder={t("fields.setsShort")}
                    value={row.sets ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        sets: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder={t("fields.reps")}
                    value={row.reps ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        reps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    min={0}
                    placeholder={t("fields.kg")}
                    value={row.weightKg ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        weightKg:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    className="icon-btn"
                    title={t("actions.remove")}
                    onClick={() => removeSet(i)}
                  >
                    ✖️
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn subtle" onClick={addSet}>
            {t("actions.addSet")}
          </button>
        </div>
      )}

      {/* Common optional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabeledInput label={t("fields.rpe")} hint={t("optional")}>
          <input
            type="number"
            min={1}
            max={10}
            value={effort}
            onChange={(e) =>
              setEffort(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input w-full"
          />
        </LabeledInput>
        <LabeledInput label={t("fields.notes")} hint={t("optional")}>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
            placeholder={
              isStrength ? t("placeholders.strength") : t("placeholders.cardio")
            }
          />
        </LabeledInput>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn primary" onClick={submit} disabled={busy}>
          {t("actions.saveWorkout")}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setKind(defaultKind);
            setDurationMin(30);
            setDistanceKm("");
            setEffort(6);
            setNotes("");
            setSets([]);
          }}
        >
          {t("actions.reset")}
        </button>
      </div>
    </div>
  );
}

/* small local primitive */
function LabeledInput({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: any;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label} {hint && <em className="not-italic opacity-70">({hint})</em>}
      </span>
      {children}
    </label>
  );
}
