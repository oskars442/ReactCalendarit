// src/app/[locale]/(dashboard)/work-diary/Diary.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

/* =========================
   Types
   ========================= */
type DiaryType = "task" | "job" | "meeting" | "other";
type ViewMode = "day" | "week";

// value the <select> uses: built-in types or "label:<id>"
type TypeSelectValue = DiaryType | `label:${number}`;

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

type SavedLabel = {
  id: number;
  userId: number;
  name: string;
  colorHex: string;
  archived?: boolean;
};

/* =========================
   Helpers
   ========================= */
const fmtDateLocal = (d: Date | string) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
};
const toLocalSQL = (dateStr: string, timeStr?: string) =>
  `${dateStr} ${timeStr || "00:00"}:00`;

const API = "/api/work";

async function apiFetch<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
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
  const H = Math.floor(t2 / 60),
    M = t2 % 60;
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
  return (
    DEFAULT_COLORS[it.type as Exclude<DiaryType, "other">] ||
    DEFAULT_COLORS.task
  );
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
// Monday as start-of-week
function startOfWeekISO(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  const wd = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - wd);
  return fmtDateLocal(d);
}
function addDaysISO(dateISO: string, days: number) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return fmtDateLocal(d);
}

/* Helpers for select values */
function asTypeSelectValueFromLabelId(id: number): TypeSelectValue {
  return `label:${id}`;
}
function parseTypeSelectValue(
  v: string
): { kind: "label"; id: number } | { kind: "builtin"; t: DiaryType } {
  if (v.startsWith("label:"))
    return { kind: "label", id: Number(v.slice("label:".length)) };
  return { kind: "builtin", t: v as DiaryType };
}

/* ------- simple media-query hook (no deps) ------- */
function useMediaQuery(q: string) {
  const [ok, setOk] = useState<boolean>(() =>
    typeof window !== "undefined" ? matchMedia(q).matches : false
  );
  useEffect(() => {
    const mm = matchMedia(q);
    const h = (e: MediaQueryListEvent) => setOk(e.matches);
    setOk(mm.matches);
    mm.addEventListener("change", h);
    return () => mm.removeEventListener("change", h);
  }, [q]);
  return ok;
}

/* =========================
   Component
   ========================= */
export default function Diary() {
  const t = useTranslations("diary");

  // responsive flags
  const isSmall = useMediaQuery("(max-width: 640px)");
  const isLarge = useMediaQuery("(min-width: 1024px)");

  const [mode, setMode] = useState<ViewMode>("day");
  const [day, setDay] = useState<string>(fmtDateLocal(new Date()));
  const [items, setItems] = useState<DiaryItem[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // saved labels
  const [labels, setLabels] = useState<SavedLabel[]>([]);
  function findLabelByName(name?: string | null) {
    if (!name) return undefined;
    const key = name.trim().toLowerCase();
    return labels.find((l) => l.name.trim().toLowerCase() === key);
  }
  async function loadLabels() {
    try {
      const res = await fetch("/api/work/labels", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLabels(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load labels", e);
    }
  }
  useEffect(() => {
    loadLabels();
  }, []);

  // auto-switch to Day on phones
  useEffect(() => {
    if (isSmall && mode === "week") setMode("day");
  }, [isSmall, mode]);

  // Layout controls (responsive)
  const DEFAULT_START_H = 7;
  const DEFAULT_END_H = 20;
  const ROW_BASE_PX = isSmall ? 44 : 56;
  const ROW_MIN_OCC_PX = isSmall ? 80 : 96;

  // content-aware minimum card heights
  const ENTRY_MIN_DAY = isSmall ? 96 : 108;
  const ENTRY_MIN_WEEK = isSmall ? 128 : 132;

  // Period for API fetch based on mode
  const period = useMemo(() => {
    if (mode === "day") {
      return { from: `${day} 00:00:00`, to: `${day} 23:59:59`, days: [day] };
    }
    const weekStart = startOfWeekISO(day);
    const weekEnd = addDaysISO(weekStart, 6);
    return {
      from: `${weekStart} 00:00:00`,
      to: `${weekEnd} 23:59:59`,
      days: Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)),
    };
  }, [day, mode]);

  async function load() {
    try {
      setLoading(true);
      const data = await apiFetch<DiaryItem[]>(
        `${API}?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(
          period.to
        )}`
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
    load(); /* eslint-disable-next-line */
  }, [period.from, period.to]);

  const KNOWN: DiaryType[] = ["task", "job", "meeting"];

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

  const openEdit = (it: DiaryItem) => {
    const isKnown = KNOWN.includes(it.type);
    const candidateColor =
      it.type_color ||
      (isKnown
        ? DEFAULT_COLORS[it.type as Exclude<DiaryType, "other">] || "#6c757d"
        : findLabelByName(it.label || "")?.colorHex ?? "#6c757d");

    setForm({
      id: it.id,
      typeSelect: isKnown ? it.type : "other",
      customType: isKnown ? "" : it.label || it.type || "",
      typeColor: candidateColor,
      title: it.title || "",
      startTime: it.start_at.slice(11, 16),
      endTime: it.end_at ? it.end_at.slice(11, 16) : "",
      location: it.location ?? "",
      notes: it.notes ?? "",
    });
  };

  // what the <select> should show as value
  const selectedTypeValue: TypeSelectValue = useMemo(() => {
    if (!form) return "task";
    if (form.typeSelect !== "other") return form.typeSelect;
    const match = findLabelByName(form.customType);
    return match ? asTypeSelectValueFromLabelId(match.id) : "other";
  }, [form, labels]);

  async function save() {
    if (!form) return;
    try {
      if (form.endTime && cmpHM(form.endTime, form.startTime) < 0) {
        alert(t("errors.endBeforeStart"));
        return;
      }

      // upsert the label when creating a new custom one
      if (form.typeSelect === "other" && form.customType.trim()) {
        try {
          const res = await fetch("/api/work/labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: form.customType.trim(),
              colorHex: form.typeColor || "#6c757d",
            }),
          });
          if (res.ok) {
            const saved: SavedLabel = await res.json();
            setLabels((prev) => {
              const i = prev.findIndex(
                (p) => p.name.toLowerCase() === saved.name.toLowerCase()
              );
              if (i >= 0) {
                const next = prev.slice();
                next[i] = saved;
                return next;
              }
              return [...prev, saved].sort((a, b) =>
                a.name.localeCompare(b.name)
              );
            });
          } else {
            console.warn("Label upsert failed:", await res.text());
          }
        } catch (e) {
          console.warn("Label upsert error:", e);
        }
      }

      const finalTypeEnum: DiaryType =
        form.typeSelect === "other" ? "other" : form.typeSelect;
      const finalLabel =
        form.typeSelect === "other"
          ? form.customType || t("types.other")
          : null;
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
      const url = `${API}${
        form.id ? `/${encodeURIComponent(String(form.id))}` : ""
      }`;
      await apiFetch(url, opts);

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
      await apiFetch(`${API}/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      await load();
    } catch (e: any) {
      console.error(e);
      alert(t("errors.delete", { msg: e.message }));
    }
  }

  /* =========================
     Layout pipeline (shared)
     ========================= */
  type Mapped = {
    it: DiaryItem;
    absStart: number;
    absEnd: number;
    lane?: number;
  };
  function normalize(data: DiaryItem[]): Mapped[] {
    return data
      .map((it) => {
        const s = parseDT(it.start_at);
        const e = it.end_at
          ? parseDT(it.end_at)
          : new Date(s.getTime() + 60 * 60000);
        const absStart = s.getHours() * 60 + s.getMinutes();
        const absEnd = e.getHours() * 60 + e.getMinutes();
        return { it, absStart, absEnd };
      })
      .filter((p) => p.absEnd > 0 && p.absStart < 24 * 60)
      .sort(
        (a, b) =>
          a.absStart - b.absStart ||
          a.absEnd - a.absStart - (b.absEnd - b.absStart)
      );
  }
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

  const mappedAll = useMemo(() => normalize(items), [items]);

  // visible hour range across the whole period
  let dynStartH = DEFAULT_START_H;
  let dynEndH = DEFAULT_END_H;
  if (mappedAll.length) {
    const minH = Math.floor(Math.min(...mappedAll.map((p) => p.absStart)) / 60);
    const maxH = Math.ceil(Math.max(...mappedAll.map((p) => p.absEnd)) / 60);
    dynStartH = Math.min(DEFAULT_START_H, clamp(minH, 0, 23));
    dynEndH = Math.max(DEFAULT_END_H, clamp(maxH, 1, 24));
  }
  const HOURS = dynEndH - dynStartH;

  // min height estimator
  const minHeightFor = (it: DiaryItem, isWeek: boolean) => {
    let h = isWeek ? ENTRY_MIN_WEEK : ENTRY_MIN_DAY;
    if (!it.location) h -= 12;
    if (!it.title) h -= 8;
    if (!isWeek && !it.notes) h -= 12;
    return Math.max(isWeek ? 72 : 72, h);
  };

  // Hour heights (auto-grow if content needs more)
  const hourHeights = useMemo(() => {
    const arr = Array(HOURS).fill(ROW_BASE_PX);

    const touchHour = (hIdx: number, px: number) => {
      if (hIdx >= 0 && hIdx < HOURS) arr[hIdx] = Math.max(arr[hIdx], px);
    };

    for (const p of mappedAll) {
      const startH = Math.floor(p.absStart / 60) - dynStartH;
      const endH = Math.ceil(p.absEnd / 60) - dynStartH;
      for (let h = startH; h < endH; h++) touchHour(h, ROW_MIN_OCC_PX);
    }

    for (const p of mappedAll) {
      const spanStart = Math.max(0, Math.floor(p.absStart / 60) - dynStartH);
      const spanEnd = Math.min(HOURS, Math.ceil(p.absEnd / 60) - dynStartH);
      const span = Math.max(1, spanEnd - spanStart);

      const durationHrs = Math.max(0.25, (p.absEnd - p.absStart) / 60);
      const naturalPx = durationHrs * ROW_BASE_PX;
      const neededPx = minHeightFor(p.it, mode === "week");

      const extra = Math.max(0, neededPx - naturalPx);
      if (extra > 0) {
        const perHour = extra / span;
        for (let h = spanStart; h < spanEnd; h++) {
          arr[h] = Math.max(arr[h], ROW_MIN_OCC_PX + perHour);
        }
      }
    }

    return arr;
  }, [HOURS, mappedAll, dynStartH, mode, ROW_BASE_PX, ROW_MIN_OCC_PX]);

  const hourTops = useMemo(() => {
    const tops = [0];
    for (let i = 0; i < HOURS; i++) tops.push(tops[i] + hourHeights[i]);
    return tops;
  }, [HOURS, hourHeights]);
  const totalHeight = hourTops[hourTops.length - 1];
  const hourMarks = Array.from({ length: HOURS + 1 }, (_, i) => dynStartH + i);

  function yFromAbsMin(absMin: number) {
    const mm = clamp(absMin - dynStartH * 60, 0, HOURS * 60 - 0.0001);
    const h = Math.floor(mm / 60);
    const within = mm - h * 60;
    return hourTops[h] + (hourHeights[h] / 60) * within;
  }
  function heightFromAbsRange(
    a: number,
    b: number,
    it: DiaryItem,
    isWeek: boolean
  ) {
    const y1 = yFromAbsMin(a);
    const y2 = yFromAbsMin(b);
    const natural = Math.max(28, y2 - y1);
    return Math.max(natural, minHeightFor(it, isWeek));
  }

  const gutterPct = 2;

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

  // UPDATED: supports built-ins and saved labels
  const onTypeSelect = (raw: string) => {
    if (!form) return;
    const parsed = parseTypeSelectValue(raw);

    if (parsed.kind === "builtin") {
      if (parsed.t === "other") {
        setForm({
          ...form,
          typeSelect: "other",
          customType: "",
          typeColor: "#6c757d",
        });
      } else {
        setForm({
          ...form,
          typeSelect: parsed.t,
          customType: "",
          typeColor:
            DEFAULT_COLORS[parsed.t as Exclude<DiaryType, "other">] ||
            "#6c757d",
        });
      }
      return;
    }

    // a saved label was chosen
    const lbl = labels.find((l) => l.id === parsed.id);
    if (!lbl) return;
    setForm({
      ...form,
      typeSelect: "other",
      customType: lbl.name,
      typeColor: lbl.colorHex,
    });
  };

  const badgeTextFor = (it: DiaryItem) =>
    it.type === "other"
      ? it.label || t("types.other")
      : t(`types.${it.type}` as const);

  /* =========================
     Week helpers
     ========================= */
  const weekDays = period.days;
  const perDayItems = useMemo(() => {
    const map: Record<string, DiaryItem[]> = Object.fromEntries(
      weekDays.map((d) => [d, []])
    );
    for (const it of items) {
      const d = it.start_at.slice(0, 10);
      if (map[d]) map[d].push(it);
    }
    for (const d of weekDays)
      map[d] = map[d].sort((a, b) => a.start_at.localeCompare(b.start_at));
    return map;
  }, [items, weekDays]);
  const ModeToggle = () => (
    <div className="inline-flex rounded border border-gray-300 p-0.5 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setMode("day")}
        className={`px-3 py-1 text-sm rounded ${
          mode === "day"
            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        aria-pressed={mode === "day"}
      >
        {t("day")}
      </button>
      <button
        type="button"
        onClick={() => setMode("week")}
        className={`px-3 py-1 text-sm rounded ${
          mode === "week"
            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        aria-pressed={mode === "week"}
      >
        {t("week")}
      </button>
    </div>
  );
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Virsraksts kreisajā pusē; atbīda pārējo pa labi */}
        <h1 className="text-lg font-semibold mr-auto">{t("title")}</h1>

        {/* Diena / Nedēļa */}
        <ModeToggle />

        {/* Datums + Jauns — pa labi tajā pašā rindā uz ≥sm */}
        <div className="hidden sm:flex items-center gap-2">
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

        {/* Uz telefona datums + poga krīt nākamajā rindā */}
        <div className="flex sm:hidden w-full items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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

  {/* ==== GRID ==== */}
{mode === "day" ? (
  /* --------- DAY VIEW --------- */
  <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-800">
    {/* Phone: 2 cols [time | canvas]; ≥sm: original 12-col grid */}
    <div className="grid grid-cols-[48px_1fr] sm:grid-cols-12">
      {/* Time rail – visible on phone (compact), spans 2 cols on ≥sm */}
      <div className="relative border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40 sm:col-span-2">
        <div className="sticky top-0">
          {hourMarks.slice(0, -1).map((h, idx) => (
            <div
              key={h}
              className="border-b border-gray-200 px-1.5 py-1 text-[11px] text-gray-500 dark:border-gray-800"
              style={{ height: hourHeights[idx] }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
          <div
            className="px-1.5 py-1 text-[11px] text-gray-500"
            style={{ height: hourHeights[HOURS - 1] }}
          >
            {String(dynEndH).padStart(2, "0")}:00
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative sm:col-span-10"
        style={{ minHeight: totalHeight }}
      >
        {/* Hour lines */}
        {hourMarks.map((h, idx) => (
          <div
            key={h}
            className={`absolute w-full border-t ${
              idx === hourMarks.length - 1 ? "border-b" : ""
            } border-gray-200 dark:border-gray-800`}
            style={{ top: hourTops[idx], height: 0 }}
          />
        ))}

        {/* Entries */}
        {(() => {
          const dayItems = perDayItems[weekDays[0]] || [];
          const { placed, lanes } = assignLanes(normalize(dayItems));
          const laneW = (100 - gutterPct * (lanes - 1)) / lanes;

          return placed.map(({ it, absStart, absEnd, lane }) => {
            const top = yFromAbsMin(absStart);
            const height = heightFromAbsRange(absStart, absEnd, it, false);
            const leftPct = (lane || 0) * (laneW + gutterPct);
            const timeStr = `${it.start_at.slice(11, 16)}${
              it.end_at ? ` – ${it.end_at.slice(11, 16)}` : ""
            }`;
            const color = colorForItem(it);
            const badgeTxt = badgeTextFor(it);
            const badgeStyle: React.CSSProperties = {
              backgroundColor: color,
              color: readableOn(color),
            };

            return (
              <div
                key={String(it.id)}
                className="absolute p-1"
                style={{
                  top,
                  left: `${leftPct}%`,
                  width: `${laneW}%`,
                  height,
                  zIndex: 1,
                }}
              >
                <div
                  className="flex h-full flex-col rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="flex items-center justify-between gap-3 px-2 pt-1">
                    <div className="min-w-0 text-sm">
                      <strong>{t("fields.title")}:</strong>{" "}
                      <span className="font-medium truncate" title={it.title || ""}>
                        {it.title || "-"}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-gray-500">{timeStr}</span>
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={badgeStyle}
                      >
                        {badgeTxt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 px-2 text-xs">
                    <div className="min-w-0">
                      <strong>{t("fields.location")}:</strong>{" "}
                      <span className="text-gray-500 truncate" title={it.location || ""}>
                        {it.location || "-"}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {/* icon-only on phone */}
                      <button
                        className="sm:hidden rounded border border-gray-300 px-1.5 py-0.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={() => openEdit(it)}
                        aria-label={t("actions.edit")}
                      >
                        ✎
                      </button>
                      <button
                        className="sm:hidden rounded border border-red-300 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => delItem(it.id)}
                        aria-label={t("actions.delete")}
                      >
                        🗑
                      </button>
                      {/* text on ≥sm */}
                      <button
                        className="hidden sm:inline-block rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={() => openEdit(it)}
                      >
                        {t("actions.edit")}
                      </button>
                      <button
                        className="hidden sm:inline-block rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => delItem(it.id)}
                      >
                        {t("actions.delete")}
                      </button>
                    </div>
                  </div>

                  <div className="px-2 pb-2 text-xs">
                    <strong>{t("fields.notes")}:</strong>{" "}
                    <span className="text-gray-500 break-words whitespace-pre-wrap">
                      {it.notes || "-"}
                    </span>
                  </div>
                  <div className="flex-1" />
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  </div>
) : (
  /* --------- WEEK VIEW (stacked, responsive) --------- */
  <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-800">
    {/* Week header – phone: 2 cols [time label | days]; ≥sm: original */}
    <div className="grid grid-cols-[48px_1fr] sm:grid-cols-12 border-b border-gray-200 bg-gray-50 text-xs font-medium dark:border-gray-800 dark:bg-gray-900/40">
      <div className="px-2 py-2 text-[11px] text-gray-500 sm:col-span-2">
        {t("time")}
      </div>
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] overflow-x-auto sm:col-span-10 sm:grid-cols-3 lg:grid-cols-7 sm:auto-cols-auto sm:overflow-visible">
        {weekDays.map((d) => (
          <div
            key={d}
            className="border-l border-gray-200 px-3 py-2 dark:border-gray-800"
          >
            {d}
          </div>
        ))}
      </div>
    </div>

    {/* Body – phone: 2 cols [time | columns]; ≥sm: original */}
    <div className="grid grid-cols-[48px_1fr] sm:grid-cols-12">
      {/* Time rail – visible on phone (compact) and spans 2 cols on ≥sm */}
      <div className="relative border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40 sm:col-span-2">
        <div className="sticky top-0">
          {hourMarks.slice(0, -1).map((h, idx) => (
            <div
              key={h}
              className="border-b border-gray-200 px-1.5 py-1 text-[11px] text-gray-500 dark:border-gray-800"
              style={{ height: hourHeights[idx] }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
          <div
            className="px-1.5 py-1 text-[11px] text-gray-500"
            style={{ height: hourHeights[HOURS - 1] }}
          >
            {String(dynEndH).padStart(2, "0")}:00
          </div>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] overflow-x-auto sm:col-span-10 sm:grid-cols-3 lg:grid-cols-7 sm:auto-cols-auto sm:overflow-visible">
        {weekDays.map((d) => {
          const dayItems = perDayItems[d] || [];
          const { placed, lanes } = assignLanes(normalize(dayItems));
          const laneW = (100 - gutterPct * (lanes - 1)) / lanes;

          return (
            <div
              key={d}
              className="relative border-l border-gray-200 dark:border-gray-800"
              style={{ minHeight: totalHeight }}
            >
              {/* Hour lines */}
              {hourMarks.map((h, idx) => (
                <div
                  key={h}
                  className={`absolute w-full border-t ${
                    idx === hourMarks.length - 1 ? "border-b" : ""
                  } border-gray-200 dark:border-gray-800`}
                  style={{ top: hourTops[idx], height: 0 }}
                />
              ))}

              {/* Entries (stacked lines) */}
              {placed.map(({ it, absStart, absEnd, lane }) => {
                const top = yFromAbsMin(absStart);
                const height = heightFromAbsRange(absStart, absEnd, it, true);
                const leftPct = (lane || 0) * (laneW + gutterPct);
                const timeStr = `${it.start_at.slice(11, 16)}${
                  it.end_at ? ` – ${it.end_at.slice(11, 16)}` : ""
                }`;
                const color = colorForItem(it);
                const badgeTxt = badgeTextFor(it);
                const badgeStyle: React.CSSProperties = {
                  backgroundColor: color,
                  color: readableOn(color),
                };

                return (
                  <div
                    key={String(it.id)}
                    className="absolute p-1"
                    style={{
                      top,
                      left: `${leftPct}%`,
                      width: `${laneW}%`,
                      height,
                      zIndex: 1,
                    }}
                  >
                    <div
                      className="flex h-full flex-col rounded border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      {/* Title */}
                      <div className="px-2 pt-1 text-sm font-medium break-words sm:line-clamp-none line-clamp-2">
                        {it.title || "-"}
                      </div>

                      {/* Label + time */}
                      <div className="px-2 mt-0.5 flex items-center gap-2">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                          style={badgeStyle}
                        >
                          {badgeTxt}
                        </span>
                        <span className="text-xs text-gray-500">{timeStr}</span>
                      </div>

                      {/* Buttons */}
                      <div className="px-2 mt-1 flex gap-1">
                        <button
                          className="sm:hidden rounded border border-gray-300 px-1.5 py-0.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                          onClick={() => openEdit(it)}
                          aria-label={t("actions.edit")}
                        >
                          ✎
                        </button>
                        <button
                          className="sm:hidden rounded border border-red-300 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => delItem(it.id)}
                          aria-label={t("actions.delete")}
                        >
                          🗑
                        </button>

                        <button
                          className="hidden sm:inline-block rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                          onClick={() => openEdit(it)}
                        >
                          {t("actions.edit")}
                        </button>
                        <button
                          className="hidden sm:inline-block rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => delItem(it.id)}
                        >
                          {t("actions.delete")}
                        </button>
                      </div>

                      {/* Location */}
                      <div className="px-2 mt-1 text-xs text-gray-600 break-words">
                        {it.location || "-"}
                      </div>

                      {/* Note */}
                      <div className="px-2 pb-2 mt-0.5 text-xs text-gray-500 break-words whitespace-pre-wrap">
                        {it.notes || "-"}
                      </div>

                      <div className="flex-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}


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
                <div className="font-medium">
                  {form.id ? t("modal.edit") : t("modal.new")}
                </div>
                <button
                  className="h-6 w-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setForm(null)}
                  aria-label={t("aria.close")}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("fields.title")}
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">
                      {t("fields.type")}
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={selectedTypeValue}
                      onChange={(e) => onTypeSelect(e.target.value)}
                    >
                      {/* Built-ins */}
                      <option value="task">{t("types.task")}</option>
                      <option value="job">{t("types.job")}</option>
                      <option value="meeting">{t("types.meeting")}</option>

                      {/* Saved labels before Other… */}
                      {labels.length > 0 && (
                        <optgroup
                          label={t("labels.saved", { default: "Labels" })}
                        >
                          {labels.map((l) => (
                            <option
                              key={l.id}
                              value={asTypeSelectValueFromLabelId(l.id)}
                            >
                              {l.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <option value="other">{t("types.otherMore")}</option>
                    </select>
                  </div>

                  {form.typeSelect === "other" && (
                    <>
                      <div className="col-span-5">
                        <label className="mb-1 block text-sm font-medium">
                          {t("fields.customLabel")}
                        </label>
                        {/* AFTER — no dropdown */}
                        <input
                          autoComplete="off"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                          placeholder={t("fields.customPlaceholder")}
                          value={form.customType}
                          onChange={(e) => {
                            const name = e.target.value;
                            const match = findLabelByName(name); // still lets you auto-set color when the typed text matches a saved label
                            setForm({
                              ...form,
                              customType: name,
                              typeColor: match
                                ? match.colorHex
                                : form.typeColor,
                            });
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="mb-1 block text-sm font-medium">
                          {t("fields.color")}
                        </label>
                        <input
                          type="color"
                          className="h-[38px] w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                          value={form.typeColor}
                          onChange={(e) =>
                            setForm({ ...form, typeColor: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">
                      {t("fields.start")}
                    </label>
                    <input
                      type="time"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={form.startTime}
                      onChange={(e) => onStartChange(e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="mb-1 block text-sm font-medium">
                      {t("fields.end")}
                    </label>
                    <input
                      type="time"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      value={form.endTime}
                      onChange={(e) => onEndChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("fields.location")}
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("fields.notes")}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
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
