// src/components/WorkDiaryModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type DiaryType = "task" | "job" | "meeting" | "other";

export type WorkDiaryDraft = {
  id?: number | string | null;
  dateISO: string;          // YYYY-MM-DD (required)
  title?: string;
  type?: DiaryType;         // defaults to "task"
  customLabel?: string;     // label when type === "other"
  colorHex?: string;        // color when type === "other"
  startHHMM?: string;       // defaults 09:00
  endHHMM?: string;         // defaults 10:00
  location?: string;
  notes?: string;
};

function toLocalSQL(dateISO: string, timeHHMM = "00:00") {
  return `${dateISO} ${timeHHMM}:00`;
}

const DEFAULT_COLORS: Record<Exclude<DiaryType, "other">, string> = {
  meeting: "#0dcaf0",
  job: "#ffc107",
  task: "#6c757d",
};

export default function WorkDiaryModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: WorkDiaryDraft;        // must include dateISO (and id if editing)
  onSaved?: () => void;           // refetch caller data
}) {
  const t = useTranslations("diary");

  const [title, setTitle] = useState(initial.title ?? "");
  const [type, setType] = useState<DiaryType>(initial.type ?? "task");
  const [customLabel, setCustomLabel] = useState(initial.customLabel ?? "");
  const [colorHex, setColorHex] = useState(initial.colorHex ?? "#6c757d");
  const [start, setStart] = useState(initial.startHHMM ?? "09:00");
  const [end, setEnd] = useState(initial.endHHMM ?? "10:00");
  const [location, setLocation] = useState(initial.location ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");

  // Reset when opened with new initial values
  useEffect(() => {
    if (!open) return;
    setTitle(initial.title ?? "");
    setType(initial.type ?? "task");
    setCustomLabel(initial.customLabel ?? "");
    setColorHex(initial.colorHex ?? "#6c757d");
    setStart(initial.startHHMM ?? "09:00");
    setEnd(initial.endHHMM ?? "10:00");
    setLocation(initial.location ?? "");
    setNotes(initial.notes ?? "");
  }, [open, initial]);

  async function save() {
    const body = {
      type,
      label: type === "other" ? (customLabel || t("types.other")) : null,
      type_color: type === "other" ? colorHex : null,
      title: title || null,
      notes: notes || null,
      location: location || null,
      start_at: toLocalSQL(initial.dateISO, start),
      end_at: end ? toLocalSQL(initial.dateISO, end) : null,
      all_day: 0,
      status: "planned",
    };

    const isEdit = !!initial.id;
    const url = isEdit ? `/api/work/${encodeURIComponent(String(initial.id))}` : "/api/work";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      alert(txt || "Failed to save");
      return;
    }
    onSaved?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[5000] grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initial.id ? t("modal.edit") : t("modal.new")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-2.5 py-1 hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
          >
            {t("close")}
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium opacity-80">{t("fields.title")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium opacity-80">{t("fields.type")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DiaryType)}
                className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
              >
                <option value="task">{t("types.task")}</option>
                <option value="job">{t("types.job")}</option>
                <option value="meeting">{t("types.meeting")}</option>
                <option value="other">{t("types.otherMore")}</option>
              </select>
            </div>

            {type === "other" && (
              <>
                <div className="col-span-1 md:col-span-1">
                  <label className="text-xs font-medium opacity-80">{t("fields.customLabel")}</label>
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium opacity-80">{t("fields.color")}</label>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="mt-1 h-[42px] w-full rounded-xl border border-neutral-200/60 dark:border-neutral-800/80"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium opacity-80">{t("fields.start")}</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium opacity-80">{t("fields.end")}</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium opacity-80">{t("fields.location")}</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="text-xs font-medium opacity-80">{t("fields.notes")}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-3.5 py-2 hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
            >
              {t("cancel")}
            </button>
            <button
              onClick={save}
              className="rounded-xl bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
