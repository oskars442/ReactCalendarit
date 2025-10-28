"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "@/lib/i18n/i18n";
import { getBestLocation, getWeatherForecast } from "@/features/weather/utils/api";
import { getWeatherInfo } from "@/features/weather/utils/weatherCodes";
import { formatTemp } from "@/features/weather/utils/format";
import { quoteOfTheDay } from "@/features/overview/quotes";
import DayDialog from "@/components/day/DayDialog";
import type { ISODate } from "@/lib/types";
import lvNamedays from "@/features/overview/namedays/lv_namedays.json";
import { kindIcon } from "@/lib/eventIcons";
import { getHolidaysForYear } from "@/features/data/holidays";

type UiKind = keyof typeof kindIcon;
type UiPriority = "low" | "med" | "high";

type ApiItem = {
  id: string;
  title: string;
  kind: UiKind;          // "work" | "todo" | "recurring-monthly" | "recurring-yearly"
  dateISO: string;       // YYYY-MM-DD
  timeHHMM?: string;     // for work (optional)
  priority?: UiPriority; // for todo (optional but recommended)
};

/* ------------------------------- UI helpers ------------------------------- */
function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur shadow-sm p-5">
      <header className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-[17px] font-semibold">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-neutral-600">
      {children}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/10 ${className}`} />;
}

/* ------------------------------- Namedays --------------------------------- */
type NamedaysMap = Record<string, string[]>;
const NAMEDAYS: Record<string, NamedaysMap> = { lv: lvNamedays as NamedaysMap };

function namedayKey(date = new Date(), tz = "Europe/Riga"): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return ymd.slice(5); // "MM-DD"
}
function getNamedayText(locale: string, date = new Date(), tz = "Europe/Riga"): string {
  const set = NAMEDAYS[locale] ?? NAMEDAYS.lv;
  const names = set[namedayKey(date, tz)] ?? [];
  return names.length ? names.join(", ") : "—";
}

/* ------------------------------- Weather mini ----------------------------- */
type MiniWeather = {
  city: string;
  tempC: number | null;
  code: number;
  windMs?: number | null;
  humidity?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
};

function WeatherMini() {
  const tOverview = useTranslations("overview");
  const tWeather = useTranslations("weather");
  const locale = useLocale() || "en";

  const [w, setW] = useState<MiniWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getBestLocation().catch(() => null);
        const lat = loc?.latitude ?? 56.9496;
        const lon = loc?.longitude ?? 24.1052;

        const data = await getWeatherForecast(lat, lon);
        const current = data.current_weather ?? data.current ?? null;
        const hourly = data.hourly ?? null;
        const daily = data.daily ?? null;

        setW({
          city: loc?.city ?? "Rīga",
          tempC: current?.temperature ?? null,
          code: current?.weathercode ?? 0,
          windMs: current?.windspeed ?? null,
          humidity: hourly?.relative_humidity_2m?.[0] ?? null,
          sunrise: daily?.sunrise?.[1] ?? null, // past_days=1 → today at idx 1
          sunset: daily?.sunset?.[1] ?? null,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="col-span-2 h-8" />
      </div>
    );
  }
  if (!w) return null;

  const info = getWeatherInfo(w.code, tWeather);

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="font-medium">{w.city}</div>
        <Badge>{info.text}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-4xl leading-none">{info.icon}</div>
        <div className="text-3xl font-bold">
          {w.tempC != null ? formatTemp(w.tempC, "C") : "—"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600">
        <div>
          <div className="font-medium">{tOverview("wind")}</div>
          <div>{w.windMs != null ? `${Math.round(w.windMs)} m/s` : "—"}</div>
        </div>
        <div>
          <div className="font-medium">{tOverview("humidity")}</div>
          <div>{w.humidity != null ? `${Math.round(w.humidity)}%` : "—"}</div>
        </div>
        <div className="col-span-1 text-right">
          <Link
            href={`/${locale}/weather`}
            className="underline text-neutral-700 hover:text-neutral-900"
          >
            {tOverview("openWeather")}
          </Link>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-neutral-500">
        {tOverview("dataBy")}{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">
          {tOverview("openMeteo")}
        </a>
      </div>
    </div>
  );
}

/* ------------------------------ Row with icon ----------------------------- */
type OverviewItem = ApiItem & { whenLabel?: string };

function todoPriorityBorder(p?: UiPriority) {
  switch (p) {
    case "high":
      return "border-rose-400/60";
    case "med":
      return "border-amber-400/60";
    case "low":
      return "border-emerald-400/60";
    default:
      return "border-neutral-200/60";
  }
}
function todoIconBorder(p?: UiPriority) {
  switch (p) {
    case "high":
      return "border-rose-500";
    case "med":
      return "border-amber-500";
    case "low":
      return "border-emerald-500";
    default:
      return "border-neutral-300";
  }
}


function Row({ item }: { item: OverviewItem }) {
  const isTodo = item.kind === "todo";
  const priority = item.priority || (isTodo ? "low" : undefined);
const borderColor = isTodo ? todoPriorityBorder(priority) : "border-neutral-200/60";

  return (
    <li
      className={`flex items-center justify-between rounded-lg bg-neutral-50 p-2 border ${borderColor} transition hover:shadow-sm`}
    >
      <div className="flex items-center gap-2 min-w-0">
      <span
  className={[
    "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white",
    item.kind === "todo" ? todoIconBorder(item.priority) : "border-neutral-300",
  ].join(" ")}
>
  <span className="leading-none text-[15px]">{kindIcon[item.kind]}</span>
</span>
        <span className="font-medium truncate">{item.title}</span>
      </div>
      {item.whenLabel ? (
        <Badge>{item.whenLabel}</Badge>
      ) : null}
    </li>
  );
}

/* ------------------------------ Date utils -------------------------------- */
const toISO = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD (local)
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
};
type Holiday = { date: string; title: string; type: "holiday"|"preHoliday"|"movedDay" };

function holidaysInRange(fromISO: string, toISO: string) {
  const y1 = new Date(fromISO).getFullYear();
  const y2 = new Date(toISO).getFullYear();

  const years = y1 === y2 ? [y1] : [y1, y2];

  const all = years.flatMap(y => getHolidaysForYear(y) as Holiday[]);
  return all
    .filter(h => h.date >= fromISO && h.date <= toISO)
    .map(h => ({
      id: `holiday-${h.date}`,
      title: h.title,
      kind: "recurring-yearly" as const,
      dateISO: h.date,
    }));
}


/* --------------------------- Main client component ------------------------- */
export default function ClientOverview() {
  const t = useTranslations("overview");
  const tTodo = useTranslations("todo");
  const locale = useLocale() || "lv";

  // Today (local)
  const todayDate = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISO(todayDate) as ISODate, [todayDate]);
  const todayNum = todayDate.getDate();
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(todayDate);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(todayDate);

  const [openDate, setOpenDate] = useState<ISODate | null>(null);

  // 🔹 Šodienas dayColor (sinhronizēts ar DayLog/kalendāru)
  const [todayColor, setTodayColor] = useState<string | null>(null);
const loadOverview = async (from: string, to: string, setAll: (x: ApiItem[]) => void, setLoading: (b: boolean) => void) => {
  setLoading(true);
  try {
    const res = await fetch(`/api/overview?from=${from}&to=${to}`, { cache: "no-store" });
    const json = res.ok ? await res.json().catch(() => ({ items: [] })) : { items: [] };
    const holidayItems = holidaysInRange(from, to);
    const merged = new Map<string, ApiItem>();
    for (const it of [ ...(json.items as ApiItem[]), ...holidayItems ]) merged.set(it.id, it);
    setAll([...merged.values()]);
  } finally {
    setLoading(false);
  }
};
  // Ielasa šodienas dayLog vienu reizi
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/daylog?date=${todayISO}`, { cache: "no-store" });
        const j = await r.json().catch(() => null);
        const c: string | null = j?.dayLog?.dayColor ?? null;
        setTodayColor(c);
      } catch {
        setTodayColor(null);
      }
    })();
  }, [todayISO]);

  // Klausās uz “calendarit:daylogSaved” live-update (tikai ja glābts šodienai)
  useEffect(() => {
    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent).detail as { date?: string; dayColor?: string | null } | undefined;
      if (!detail?.date || detail.date !== todayISO) return;
      setTodayColor(detail.dayColor ?? null);
    };
    window.addEventListener("calendarit:daylogSaved", onSaved as EventListener);
    return () => window.removeEventListener("calendarit:daylogSaved", onSaved as EventListener);
  }, [todayISO]);

  // Fetch once for today → +30 days
  const [all, setAll] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const from = toISO(todayDate);
  const to   = toISO(addDays(todayDate, 30));
  loadOverview(from, to, setAll, setLoading);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
// Re-load pēc izmaiņu eventiem (recurring/todos/work/groceries)
useEffect(() => {
  const from = toISO(todayDate);
  const to   = toISO(addDays(todayDate, 30));

  const rerun = () => loadOverview(from, to, setAll, setLoading);
  const evts = [
    "calendarit:recurringChanged",
    "calendarit:todosChanged",
    "calendarit:workDiaryChanged",
    "calendarit:groceriesChanged",
  ] as const;

  evts.forEach(e => window.addEventListener(e, rerun as EventListener));
  return () => evts.forEach(e => window.removeEventListener(e, rerun as EventListener));
}, [todayDate]);

  // ---------------- Rolling windows (exclusive) ----------------
  const next7ISO  = useMemo(() => toISO(addDays(todayDate, 7)), [todayDate]);
  const next30ISO = useMemo(() => toISO(addDays(todayDate, 30)), [todayDate]);

  const todays = useMemo(
    () => all.filter(i => i.dateISO === todayISO),
    [all, todayISO]
  );
  const next7  = useMemo(
    () => all.filter(i => i.dateISO > todayISO && i.dateISO <= next7ISO),
    [all, todayISO, next7ISO]
  );
  const next30 = useMemo(
    () => all.filter(i => i.dateISO > next7ISO && i.dateISO <= next30ISO),
    [all, next7ISO, next30ISO]
  );

  // Labels
  const fmt7Badge = (iso: string) => {
    const d = new Date(iso);
    const wd = d.toLocaleDateString(locale, { weekday: "short" });
    return `${wd}. ${d.getDate()}`;
  };
  const fmt30Badge = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const mon = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${day}.${mon}`;
  };

  const todayRows: OverviewItem[] = useMemo(
    () =>
      todays
        .sort((a, b) => (a.timeHHMM ?? "").localeCompare(b.timeHHMM ?? "")) // time first
        .map((i) => ({
          ...i,
          whenLabel:
            i.kind === "work" && i.timeHHMM
              ? i.timeHHMM
              : i.kind === "todo"
              ? tTodo("due.label")
              : undefined,
        })),
    [todays, tTodo]
  );

  const weekRows: OverviewItem[] = useMemo(
    () =>
      next7
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .map((i) => ({ ...i, whenLabel: fmt7Badge(i.dateISO) })),
    [next7]
  );

  const monthRows: OverviewItem[] = useMemo(
    () =>
      next30
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .map((i) => ({ ...i, whenLabel: fmt30Badge(i.dateISO) })),
    [next30]
  );

  // Nameday & Quote
  const quote = useMemo(() => quoteOfTheDay(locale), [locale]);
  const namedayText = useMemo(() => getNamedayText(locale), [locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 md:pt-4 pb-6">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* Title */}
        <h1 className="text-2xl font-bold md:justify-self-start">{t("title")}</h1>

        {/* Today tile — lieto DayLog krāsu, ja ir */}
        <button
          type="button"
          onClick={() => setOpenDate(todayISO as ISODate)}
          aria-label="Open today's day log"
          className="group relative flex flex-col justify-center rounded-2xl border-2 border-sky-500 bg-white shadow-sm w-32 sm:w-40 h-24 px-3 py-2 hover:bg-sky-50 focus:outline-none md:justify-self-center"
        >
          <span
            className="text-4xl sm:text-5xl font-semibold leading-none"
            style={{ color: todayColor ?? "#0284c7" }}
          >
            {todayNum}
          </span>
          <span className="text-sm sm:text-base text-neutral-600 capitalize">{weekday}</span>
          <span className="text-xs sm:text-sm text-neutral-600">{dateLabel}</span>
        </button>

        {/* Spacer tikai desktopam */}
        <div className="hidden md:block" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Today’s events */}
        <Card title={t("todayEvents")} icon={<span>📅</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : todayRows.length === 0 ? (
            <div className="text-neutral-600">{t("noEventsToday")}</div>
          ) : (
            <ul className="space-y-2">
              {todayRows.map((e) => (
                <Row key={e.id} item={e} />
              ))}
            </ul>
          )}
        </Card>

        {/* Next 7 days */}
        <Card title={t("weekAhead")} icon={<span>🗓️</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2">
              {weekRows.map((e) => (
                <Row key={e.id} item={e} />
              ))}
            </ul>
          )}
        </Card>

        {/* Next 30 days */}
        <Card title={t("monthAnniversaries")} icon={<span>🎉</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2">
              {monthRows.map((e) => (
                <Row key={e.id} item={e} />
              ))}
            </ul>
          )}
        </Card>

        {/* Quote of the day */}
        <Card title={t("quote")} icon={<span>💬</span>}>
          <blockquote className="whitespace-pre-line rounded-lg bg-neutral-50 p-4 italic text-neutral-700">
            “{quote.text}”
            <div className="mt-2 not-italic text-right text-sm text-neutral-600">— {quote.author}</div>
          </blockquote>
        </Card>

        {/* Name day */}
        <Card title={t("nameDay")} icon={<span>🎂</span>}>
          <div className="rounded-lg bg-neutral-50 p-4">{namedayText}</div>
        </Card>

        {/* Weather mini */}
        <Card title={t("weatherMini")} icon={<span>🌤️</span>}>
          <WeatherMini />
        </Card>
      </div>

      {/* Day dialog */}
      <DayDialog
        date={openDate}
        open={!!openDate}
        onOpenChange={(v) => {
          if (!v) setOpenDate(null);
        }}
      />
    </div>
  );
}
