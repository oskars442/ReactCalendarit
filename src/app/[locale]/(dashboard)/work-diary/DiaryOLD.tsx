// src/app/[locale]/(dashboard)/work-diary/Diary.tsx
// Working diary before adding Week view

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

/* =========================
   Types
   ========================= */
type DiaryType = "task" | "job" | "meeting" | "other";

export type DiaryItem = {
  id: number | string;
  type: DiaryType;
  label?: string | null;
  type_color?: string | null;
  title?: string | null;
  notes?: string | null;
  location?: string | null;
  start_at: string; // "YYYY-MM-DD HH:MM:SS"
  end_at?: string | null;
  all_day?: 0 | 1;
  status?: string;
};

type FormState = {
  id: number | string | null;
  typeSelect: DiaryType;
  customType: string;
  typeColor: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
};

/* =========================
   Config / Helpers
   ========================= */
const fmtDateLocal = (d: Date | string) => {
  const dt = new Date(d);
  // Force local YYYY-MM-DD (avoid UTC shifting the day)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
};
const toLocalSQL = (dateStr: string, timeStr?: string) =>
  `${dateStr} ${(timeStr || "00:00")}:00`;

const API = "/api/work";

async function apiFetch<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? res.json() : res.text()) as T;
}

const parseDT = (str: string) => new Date(str.replace(" ", "T"));
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const pad2 = (n: number) => String(n).padStart(2, "0");
const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + mins;
  const t2 = Math.max(0, Math.min(24 * 60 - 1, t));
  const H = Math.floor(t2 / 60), M = t2 % 60;
  return `${pad2(H)}:${pad2(M)}`;
};
const cmpHM = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1);

const DEFAULT_COLORS: Record<Exclude<DiaryType, "other">, string> = {
  meeting: "#0dcaf0",
  job: "#ffc107",
  task: "#6c757d",
};

function colorForItem(it: DiaryItem) {
  if (it.type === "other" && it.type_color) return it.type_color;
  return DEFAULT_COLORS[(it.type as Exclude<DiaryType, "other">)] || DEFAULT_COLORS.task;
}
function readableOn(bgHex: string) {
  try {
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#111827" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

/* =========================
   Component
   ========================= */
export default function Diary() {
  const t = useTranslations("diary");

  const [day, setDay] = useState<string>(fmtDateLocal(new Date()));
  const [items, setItems] = useState<DiaryItem[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Layout controls
  const DEFAULT_START_H = 7;
  const DEFAULT_END_H = 20;
  const ROW_BASE_PX = 56;
  const ROW_MIN_OCC_PX = 96;

  const from = `${day} 00:00:00`;
  const to = `${day} 23:59:59`;

  async function load() {
    try {
      setLoading(true);
      const data = await apiFetch<DiaryItem[]>(
        `${API}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      alert(t("errors.load", { msg: e.message }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const openNew = () =>
    setForm({
      id: null,
      typeSelect: "task",
      customType: "",
      typeColor: "#6c757d",
      title: "",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      notes: "",
    });

  const KNOWN: DiaryType[] = ["task", "job", "meeting"];

  const openEdit = (it: DiaryItem) => {
    const isKnown = KNOWN.includes(it.type);
    setForm({
      id: it.id,
      typeSelect: isKnown ? it.type : "other",
      customType: isKnown ? "" : (it.label || it.type || ""),
      typeColor:
        it.type_color ||
        (isKnown ? (DEFAULT_COLORS[it.type as Exclude<DiaryType, "other">] || "#6c757d") : "#6c757d"),
      title: it.title || "",
      startTime: it.start_at.slice(11, 16),
      endTime: it.end_at ? it.end_at.slice(11, 16) : "",
      location: it.location ?? "",
      notes: it.notes ?? "",
    });
  };

  async function save() {
    if (!form) return;
    try {
      if (form.endTime && cmpHM(form.endTime, form.startTime) < 0) {
        alert(t("errors.endBeforeStart"));
        return;
      }

      const finalTypeEnum: DiaryType = form.typeSelect === "other" ? "other" : form.typeSelect;
      const finalLabel = form.typeSelect === "other" ? (form.customType || t("types.other")) : null;
      const finalColorHex = form.typeSelect === "other" ? form.typeColor : null;

      const body = {
        type: finalTypeEnum,
        label: finalLabel,
        type_color: finalColorHex,
        title: form.title,
        notes: form.notes,
        location: form.location,
        start_at: toLocalSQL(day, form.startTime),
        end_at: form.endTime ? toLocalSQL(day, form.endTime) : null,
        all_day: 0,
        status: "planned",
      };

      const opts: RequestInit = {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
      const url = `${API}${form.id ? `/${encodeURIComponent(String(form.id))}` : ""}`;
      await apiFetch(url, opts);

      // close & refresh
      setForm(null);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(t("errors.save", { msg: e.message }));
    }
  }

  async function delItem(id: DiaryItem["id"]) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await apiFetch(`${API}/${encodeURIComponent(String(id))}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      console.error(e);
      alert(t("errors.delete", { msg: e.message }));
    }
  }

  /* =========================
     Layout pipeline
     ========================= */
  type Mapped = { it: DiaryItem; absStart: number; absEnd: number; lane?: number };
  function normalize(data: DiaryItem[]): Mapped[] {
    return data
      .map((it) => {
        const s = parseDT(it.start_at);
        const e = it.end_at ? parseDT(it.end_at) : new Date(s.getTime() + 60 * 60000);
        const absStart = s.getHours() * 60 + s.getMinutes();
        const absEnd = e.getHours() * 60 + e.getMinutes();
        return { it, absStart, absEnd };
      })
      .filter((p) => p.absEnd > 0 && p.absStart < 24 * 60)
      .sort(
        (a, b) =>
          a.absStart - b.absStart ||
          (a.absEnd - a.absStart) - (b.absEnd - b.absStart)
      );
  }

  const mapped = useMemo(() => normalize(items), [items]);

  let dynStartH = DEFAULT_START_H;
  let dynEndH = DEFAULT_END_H;
  if (mapped.length) {
    const minH = Math.floor(Math.min(...mapped.map(p => p.absStart)) / 60);
    const maxH = Math.ceil(Math.max(...mapped.map(p => p.absEnd)) / 60);
    dynStartH = Math.min(DEFAULT_START_H, clamp(minH, 0, 23));
    dynEndH = Math.max(DEFAULT_END_H, clamp(maxH, 1, 24));
  }
  const HOURS = dynEndH - dynStartH;

  function assignLanes(list: Mapped[]) {
    const laneEnds: number[] = [];
    for (const p of list) {
      let lane = 0;
      while (lane < laneEnds.length && p.absStart < laneEnds[lane]) lane++;
      if (lane === laneEnds.length) laneEnds.push(p.absEnd);
      else laneEnds[lane] = p.absEnd;
      p.lane = lane;
    }
    return { placed: list, lanes: Math.max(1, laneEnds.length) };
  }
  const { placed, lanes } = useMemo(() => assignLanes(mapped), [mapped]);

  const hourHeights = useMemo(() => {
    const arr = Array(HOURS).fill(ROW_BASE_PX);
    for (const p of placed) {
      const startH = Math.floor(p.absStart / 60);
      const endH = Math.max(startH, Math.ceil(p.absEnd / 60) - 1);
      for (let h = startH; h <= endH; h++) {
        const idx = h - dynStartH;
        if (idx >= 0 && idx < HOURS) arr[idx] = Math.max(arr[idx], ROW_MIN_OCC_PX);
      }
    }
    return arr;
  }, [HOURS, placed, dynStartH]);

  const hourTops = useMemo(() => {
    const tops = [0];
    for (let i = 0; i < HOURS; i++) tops.push(tops[i] + hourHeights[i]);
    return tops;
  }, [HOURS, hourHeights]);

  const totalHeight = hourTops[hourTops.length - 1];

  function yFromAbsMin(absMin: number) {
    const mm = clamp(absMin - dynStartH * 60, 0, HOURS * 60 - 0.0001);
    const h = Math.floor(mm / 60);
    const within = mm - h * 60;
    return hourTops[h] + (hourHeights[h] / 60) * within;
  }
  function heightFromAbsRange(a: number, b: number) {
    const y1 = yFromAbsMin(a);
    const y2 = yFromAbsMin(b);
    return Math.max(28, y2 - y1);
  }

  const gutterPct = 2;
  const laneW = (100 - gutterPct * (lanes - 1)) / lanes;
  const hourMarks = Array.from({ length: HOURS + 1 }, (_, i) => dynStartH + i);

  const onStartChange = (v: string) => {
    if (!form) return;
    let end = form.endTime || v;
    if (cmpHM(end, v) <= 0) end = addMinutes(v, 60);
    setForm({ ...form, startTime: v, endTime: end });
  };
  const onEndChange = (v: string) => {
    if (!form) return;
    if (cmpHM(v, form.startTime) < 0) v = form.startTime;
    setForm({ ...form, endTime: v });
  };
  const onTypeSelect = (val: DiaryType) => {
    if (!form) return;
    if (val === "other") {
      setForm({ ...form, typeSelect: val, customType: "", typeColor: "#6c757d" });
    } else {
      setForm({
        ...form,
        typeSelect: val,
        customType: "",
        typeColor: DEFAULT_COLORS[val as Exclude<DiaryType, "other">] || "#6c757d",
      });
    }
  };

  // localized badge text
  const badgeTextFor = (it: DiaryItem) => {
    if (it.type === "other") return it.label || t("types.other");
    return t(`types.${it.type}` as const);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-56 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            aria-label={t("aria.pickDate")}
          />
          <button
            className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            onClick={openNew}
          >
            {t("actions.new")}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-12">
          {/* Time rail */}
          <div className="col-span-2 relative border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
            <div className="sticky top-0">
              {hourMarks.slice(0, -1).map((h, idx) => (
                <div
                  key={h}
                  className="border-b border-gray-200 px-3 py-1 text-xs text-gray-500 dark:border-gray-800"
                  style={{ height: hourHeights[idx] }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
              <div
                className="px-3 py-1 text-xs text-gray-500"
                style={{ height: hourHeights[HOURS - 1] }}
              >
                {String(dynEndH).padStart(2, "0")}:00
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="col-span-10 relative" style={{ minHeight: totalHeight }}>
            {/* Hour lines */}
            {hourMarks.map((h, idx) => (
              <div
                key={h}
                className={`absolute w-full border-t ${idx === hourMarks.length - 1 ? "border-b" : ""} border-gray-200 dark:border-gray-800`}
                style={{ top: hourTops[idx], height: 0 }}
              />
            ))}

            {/* Entries */}
            {placed.map(({ it, absStart, absEnd, lane }) => {
              const top = yFromAbsMin(absStart);
              const height = heightFromAbsRange(absStart, absEnd);
              const leftPct = (lane || 0) * (laneW + gutterPct);

              const timeStr = `${it.start_at.slice(11, 16)}${it.end_at ? ` – ${it.end_at.slice(11, 16)}` : ""}`;
              const color = colorForItem(it);
              const badgeTxt = badgeTextFor(it);
              const badgeStyle: React.CSSProperties = { backgroundColor: color, color: readableOn(color) };

              return (
                <div
                  key={String(it.id)}
                  className="absolute p-1"
                  style={{ top, left: `${leftPct}%`, width: `${laneW}%`, height, zIndex: 1 }}
                >
                  <div
                    className="flex h-full flex-col rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-2 pt-1">
                      <div className="min-w-0 text-sm">
                        <strong>{t("fields.title")}:</strong>{" "}
                        <span className="font-medium truncate" title={it.title || ""}>{it.title || "-"}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-gray-500">{timeStr}</span>
                        <span className="rounded px-2 py-0.5 text-xs font-medium" style={badgeStyle}>{badgeTxt}</span>
                      </div>
                    </div>

                    {/* Location + actions */}
                    <div className="flex items-start justify-between gap-3 px-2 text-xs">
                      <div className="min-w-0">
                        <strong>{t("fields.location")}:</strong>{" "}
                        <span className="text-gray-500 truncate" title={it.location || ""}>{it.location || "-"}</span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                          onClick={() => openEdit(it)}
                        >
                          {t("actions.edit")}
                        </button>
                        <button
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => delItem(it.id)}
                        >
                          {t("actions.delete")}
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="px-2 pb-2 text-xs">
                      <strong>{t("fields.notes")}:</strong>{" "}
                      <span className="text-gray-500 break-words whitespace-pre-wrap">{it.notes || "-"}</span>
                    </div>

                    <div className="flex-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">{t("loading")}</div>}

      {/* Modal */}
      {form && (
        <div
          className="fixed inset-0 z-[5000] bg-black/45"
          onKeyDown={(e) => e.key === "Escape" && setForm(null)}
        >
          <div className="flex h-full items-center justify-center p-4">
            <div className="w-[560px] overflow-hidden rounded border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div className="font-medium">{form.id ? t("modal.edit") : t("modal.new")}</div>
                <button className="h-6 w-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setForm(null)} aria-label={t("aria.close")}>✕</button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("fields.title")}</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">{t("fields.type")}</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={form.typeSelect}
                      onChange={(e) => onTypeSelect(e.target.value as DiaryType)}
                    >
                      <option value="task">{t("types.task")}</option>
                      <option value="job">{t("types.job")}</option>
                      <option value="meeting">{t("types.meeting")}</option>
                      <option value="other">{t("types.otherMore")}</option>
                    </select>
                  </div>

                  {form.typeSelect === "other" && (
                    <>
                      <div className="col-span-5">
                        <label className="mb-1 block text-sm font-medium">{t("fields.customLabel")}</label>
                        <input
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                          placeholder={t("fields.customPlaceholder")}
                          value={form.customType}
                          onChange={(e) => setForm({ ...form, customType: e.target.value })}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="mb-1 block text-sm font-medium">{t("fields.color")}</label>
                        <input
                          type="color"
                          className="h-[38px] w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                          value={form.typeColor}
                          onChange={(e) => setForm({ ...form, typeColor: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">{t("fields.start")}</label>
                    <input
                      type="time"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={form.startTime}
                      onChange={(e) => onStartChange(e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">{t("fields.end")}</label>
                    <input
                      type="time"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={form.endTime}
                      onChange={(e) => onEndChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t("fields.location")}</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t("fields.notes")}</label>
                  <textarea
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                <button
                  className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  onClick={() => setForm(null)}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                  onClick={save}
                >
                  {t("actions.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
