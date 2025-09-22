// src/app/[locale]/(dashboard)dashboard/ClientOverview.tsx
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
    <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur shadow-sm p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-[17px] font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-neutral-600">{children}</span>;
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/10 ${className}`} />;
}

type NamedaysMap = Record<string, string[]>;
const NAMEDAYS: Record<string, NamedaysMap> = { lv: lvNamedays as NamedaysMap };
function namedayKey(date = new Date(), tz = "Europe/Riga"): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return ymd.slice(5);
}
function getNamedayText(locale: string, date = new Date(), tz = "Europe/Riga"): string {
  const set = NAMEDAYS[locale] ?? NAMEDAYS.lv;
  const names = set[namedayKey(date, tz)] ?? [];
  return names.length ? names.join(", ") : "—";
}

/* ================== Weather mini (unchanged) ================== */
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
          sunrise: daily?.sunrise?.[1] ?? null,
          sunset: daily?.sunset?.[1] ?? null,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="grid grid-cols-2 gap-3"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="col-span-2 h-8" /></div>;
  if (!w) return null;

  const info = getWeatherInfo(w.code, tWeather);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{w.city}</div>
        <Badge>{info.text}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-4xl leading-none">{info.icon}</div>
        <div className="text-3xl font-bold">{w.tempC != null ? formatTemp(w.tempC, "C") : "—"}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600">
        <div><div className="font-medium">{tOverview("wind")}</div><div>{w.windMs != null ? `${Math.round(w.windMs)} m/s` : "—"}</div></div>
        <div><div className="font-medium">{tOverview("humidity")}</div><div>{w.humidity != null ? `${Math.round(w.humidity)}%` : "—"}</div></div>
        <div className="col-span-1 text-right">
          <Link href={`/${locale}/weather`} className="underline text-neutral-700 hover:text-neutral-900">
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

/* ================== Overview data ================== */
type APIItem =
  | { kind: "work"; id: string; title: string; dateISO: string; timeHHMM?: string }
  | { kind: "todo"; id: string; title: string; dateISO: string }
  | { kind: "yearly"; id: string; title: string; dateISO: string }
  | { kind: "monthly"; id: string; title: string; dateISO: string };

type ViewItem = {
  id: string;
  title: string;
  icon: React.ReactNode;
  whenLabel?: string; // "09:00", "Fri 29", "Due", etc.
  dateISO: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfWeek(d: Date) {
  const tmp = new Date(d);
  const dow = tmp.getDay(); // 0 Sun..6 Sat
  const delta = (dow + 6) % 7; // Mon=0
  tmp.setDate(tmp.getDate() - delta);
  return new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 6);
  return s;
}
function iso(d: Date) {
  return d.toLocaleDateString("sv-SE");
}
function isSameISO(a: string, b: string) {
  return a === b;
}

export default function ClientOverview() {
  const t = useTranslations("overview");
  const tTodo = useTranslations("todo"); // only for literals we already have in en.json
  const locale = useLocale() || "lv";

  const todayDate = new Date();
  const todayISO = iso(todayDate) as ISODate;
  const todayNum = todayDate.getDate();
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(todayDate);
  const dateLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(todayDate);

  const [openDate, setOpenDate] = useState<ISODate | null>(null);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<APIItem[]>([]);

  // Fetch once for the current month, then split into Today / Week / Month
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const from = iso(startOfMonth(todayDate));
        const to = iso(endOfMonth(todayDate));
        const res = await fetch(`/api/overview?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setItems((json?.items ?? []) as APIItem[]);
      } catch (e) {
        console.error("Failed to fetch overview:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekStart = startOfWeek(todayDate);
  const weekEnd = endOfWeek(todayDate);
  const weekStartISO = iso(weekStart);
  const weekEndISO = iso(weekEnd);

  function iconFor(kind: APIItem["kind"]) {
    if (kind === "work") return <span className="text-[18px]">💼</span>;
    if (kind === "todo") return <span className="text-[18px]">✅</span>;
    return <span className="text-[18px]">📅</span>; // yearly / monthly
  }

  function asView(i: APIItem): ViewItem {
    return {
      id: i.id,
      title: i.title,
      icon: iconFor(i.kind),
      dateISO: i.dateISO,
      whenLabel:
        i.kind === "work" && i.timeHHMM
          ? i.timeHHMM
          : i.kind === "todo"
          ? tTodo("due.badge") || "Due" // don’t pass a 2nd param to next-intl
          : undefined,
    };
  }

  const todayList: ViewItem[] = items.filter((i) => isSameISO(i.dateISO, todayISO)).map(asView);
  const weekList: ViewItem[] = items
    .filter((i) => i.dateISO >= weekStartISO && i.dateISO <= weekEndISO && !isSameISO(i.dateISO, todayISO))
    .map(asView);
  const monthList: ViewItem[] = items
    .filter((i) => !isSameISO(i.dateISO, todayISO) && (i.dateISO < weekStartISO || i.dateISO > weekEndISO))
    .map(asView);

  const quote = useMemo(() => quoteOfTheDay(locale), [locale]);
  const namedayText = useMemo(() => getNamedayText(locale), [locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* header */}
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <button
          type="button"
          onClick={() => setOpenDate(todayISO as ISODate)}
          aria-label="Open today's day log"
          className="group relative grid place-items-start rounded-[18px] border-2 border-sky-500 bg-white shadow-sm w-28 h-20 md:w-40 md:h-24 px-3 py-2 hover:bg-sky-50 focus:outline-none"
        >
          <span className="text-sky-600 text-4xl md:text-5xl font-semibold leading-none">{todayNum}</span>
          <span className="absolute right-3 top-2 text-xs md:text-sm text-neutral-600 capitalize">{weekday}</span>
          <span className="absolute right-3 bottom-2 text-xs md:text-sm text-neutral-600">{dateLabel}</span>
        </button>
        <div />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Today */}
        <Card title={t("todayEvents")} icon={<span>📅</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : todayList.length === 0 ? (
            <div className="text-neutral-600">{t("noEventsToday")}</div>
          ) : (
            <ul className="space-y-2">
              {todayList.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-2">
                  <div className="flex items-center gap-2">{e.icon}<span className="font-medium">{e.title}</span></div>
                  {e.whenLabel && <Badge>{e.whenLabel}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* This week */}
        <Card title={t("weekAhead")} icon={<span>🗓️</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : weekList.length === 0 ? null : (
            <ul className="space-y-2">
              {weekList.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-2">
                  <div className="flex items-center gap-2">{e.icon}<span className="font-medium">{e.title}</span></div>
                  <Badge>{new Date(e.dateISO).toLocaleDateString(locale, { weekday: "short", day: "2-digit" })}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* This month */}
        <Card title={t("monthAnniversaries")} icon={<span>🎉</span>}>
          {loading ? (
            <Skeleton className="h-24" />
          ) : monthList.length === 0 ? null : (
            <ul className="space-y-2">
              {monthList.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-2">
                  <div className="flex items-center gap-2">{e.icon}<span className="font-medium">{e.title}</span></div>
                  <Badge>{new Date(e.dateISO).getDate().toString().padStart(2, "0")}.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t("quote")} icon={<span>💬</span>}>
          <blockquote className="whitespace-pre-line rounded-lg bg-neutral-50 p-4 italic text-neutral-700">
            “{quote.text}”
            <div className="mt-2 not-italic text-right text-sm text-neutral-600">— {quote.author}</div>
          </blockquote>
        </Card>

        <Card title={t("nameDay")} icon={<span>🎂</span>}>
          <div className="rounded-lg bg-neutral-50 p-4">{namedayText}</div>
        </Card>

        <Card title={t("weatherMini")} icon={<span>🌤️</span>}>
          <WeatherMini />
        </Card>
      </div>

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
