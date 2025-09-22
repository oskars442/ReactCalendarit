// src/features/weather/components/SunPath.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/lib/i18n/i18n";

// Clamp helper
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const fmtHHMM = (d) =>
  d ? d.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" }) : "--";

// Find today's index in daily.time (use Europe/Riga to avoid off-by-one)
const getTodayIndex = (daily) => {
  try {
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Riga",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date()); // => "YYYY-MM-DD"
    const idx = (daily?.time || []).indexOf(todayStr);
    return idx !== -1 ? idx : 0;
  } catch {
    return 0;
  }
};

/**
 * SunPath
 * Props: daily { time[], sunrise[], sunset[], daylight_duration[] }
 */
export default function SunPath({ daily }) {
  const t = useTranslations("weather");

  if (!daily || !Array.isArray(daily.sunrise) || !Array.isArray(daily.sunset)) return null;

  const todayIndex = useMemo(() => getTodayIndex(daily), [daily?.time]);

  // Parse dates
  const sunriseToday = daily.sunrise[todayIndex] ? new Date(daily.sunrise[todayIndex]) : null;
  const sunsetToday = daily.sunset[todayIndex] ? new Date(daily.sunset[todayIndex]) : null;
  const sunriseNext = daily.sunrise[todayIndex + 1]
    ? new Date(daily.sunrise[todayIndex + 1])
    : null;
  const sunsetPrev = daily.sunset[todayIndex - 1]
    ? new Date(daily.sunset[todayIndex - 1])
    : null;

  // Update progress every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Choose segment: day (sunrise→sunset) or night (sunset→next sunrise / prev sunset→sunrise)
  let start = null,
    end = null,
    mode = "day";

  if (sunriseToday && sunsetToday && now >= sunriseToday && now < sunsetToday) {
    start = sunriseToday;
    end = sunsetToday;
    mode = "day";
  } else if (sunriseToday && now < sunriseToday) {
    // Before sunrise: night from yesterday's sunset -> today's sunrise
    if (sunsetPrev) {
      start = sunsetPrev;
      end = sunriseToday;
      mode = "night";
    } else {
      // Fallback if we don't have yesterday: approximate night length
      const dl = daily.daylight_duration?.[todayIndex] ?? 12 * 3600;
      const nightMs = 24 * 3600 * 1000 - dl * 1000;
      start = new Date(sunriseToday.getTime() - nightMs);
      end = sunriseToday;
      mode = "night";
    }
  } else if (sunsetToday) {
    // After sunset: night from today's sunset -> tomorrow's sunrise
    if (sunriseNext) {
      start = sunsetToday;
      end = sunriseNext;
      mode = "night";
    } else {
      // Fallback if we don't have tomorrow
      const dl = daily.daylight_duration?.[todayIndex] ?? 12 * 3600;
      const nightMs = 24 * 3600 * 1000 - dl * 1000;
      start = sunsetToday;
      end = new Date(sunsetToday.getTime() + nightMs);
      mode = "night";
    }
  }

  const total = start && end ? end - start : 1;
  const elapsed = start ? now - start : 0;
  const progress = clamp01(elapsed / total);

  // "Dienas garums" (Day length) string
  const secs = daily.daylight_duration?.[todayIndex];
  const dayLenStr =
    secs == null
      ? "--"
      : `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;

  return (
    <div className="rounded-xl bg-white/10 p-4">
      {/* Top row: Sunrise | Day length | Sunset */}
      <div className="grid grid-cols-3 items-center gap-2 mb-3">
        <div className="text-center">
          <div className="text-2xl mb-1">🌅</div>
          <div className="text-white/70 text-sm">{t("sunrise", { default: "Sunrise" })}</div>
          <div className="text-white font-semibold text-lg">{fmtHHMM(sunriseToday)}</div>
        </div>

        <div className="text-center">
          <div className="text-white/70 text-sm mb-1">
            {t("dayLength", { default: "Day length" })}
          </div>
          <div className="text-white font-semibold text-lg">{dayLenStr}</div>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-1">🌇</div>
          <div className="text-white/70 text-sm">{t("sunset", { default: "Sunset" })}</div>
          <div className="text-white font-semibold text-lg">{fmtHHMM(sunsetToday)}</div>
        </div>
      </div>

      {/* Progress line with knob (sun or moon) */}
      <div className="relative h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${
            mode === "day" ? "bg-yellow-300/80" : "bg-indigo-300/70"
          }`}
          style={{ width: `${progress * 100}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-3 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
          style={{ left: `${progress * 100}%` }}
          title={
            mode === "day"
              ? t("aria.sunPos", { default: "Sun position" })
              : t("aria.moonPos", { default: "Moon position" })
          }
          aria-label={
            mode === "day"
              ? t("aria.sunPos", { default: "Sun position" })
              : t("aria.moonPos", { default: "Moon position" })
          }
        >
          <span className="text-lg">{mode === "day" ? "☀️" : "🌙"}</span>
        </div>
      </div>
    </div>
  );
}
