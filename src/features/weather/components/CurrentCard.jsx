// src/features/weather/components/CurrentCard.jsx
"use client";

import { getWeatherInfo } from "../utils/weatherCodes";
import {
  formatTemp,
  formatWind,
  formatHumidity,
  formatDate,
} from "../utils/format";
import { useTranslations } from "@/lib/i18n/i18n";

const CurrentCard = ({ weather, city, unit, hourly, containerless = false }) => {
  const tW = useTranslations("weather");
  const tC = useTranslations("common");

  if (!weather) return null;

  // find closest hourly index to current time (hourly slots are at HH:00)
  const toMs = (iso) => (iso ? new Date(iso).getTime() : NaN);
  const findBestHourlyIndex = (times = [], targetIso) => {
    if (!times?.length || !targetIso) return -1;
    const t = toMs(targetIso);
    let best = 0,
      bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const d = Math.abs(toMs(times[i]) - t);
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    }
    return best;
  };

  const nowIso = weather.time || null;
  const nowIdx = findBestHourlyIndex(hourly?.time, nowIso);
  const at = (key) =>
    hourly && nowIdx >= 0 && hourly[key] ? hourly[key][nowIdx] : undefined;

  // Prefer current block, fall back to hourly
  const temp =
    weather.temperature ?? weather.temperature_2m ?? at("temperature_2m") ?? null;

  const apparent =
    weather.apparent_temperature ??
    weather.apparent_temperature_2m ??
    at("apparent_temperature") ??
    null;

  // wind is already m/s (windspeed_unit=ms in API)
  const wind =
    weather.windspeed ?? weather.wind_speed_10m ?? weather.wind_speed ?? null;

  // humidity only exists in hourly → read it from there
  const humidity = at("relative_humidity_2m");

  const code = weather.weathercode ?? weather.weather_code ?? 0;
  const timeISO = nowIso ?? new Date().toISOString();
  const info = getWeatherInfo(code, tW); // ← pass translator here

  const outerClass = containerless ? "" : "glass-card p-6 lg:p-8 animate-fade-in";

  return (
    <div className={outerClass}>
      {/* Header row: City + time (left)  |  Icon + temp (right on lg) */}
      <div className="mb-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Left: city + updated time */}
          <div>
            <h1 className="text-2xl font-bold">
              {city?.name || tW("unknownPlace", { defaultMessage: "Unknown place" })}
            </h1>
            <p className="text-white/80 text-sm">
              {tC("updated", { defaultMessage: "Updated" })}{" "}
              {formatDate(timeISO, {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>

          {/* Right: icon + temperature */}
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="text-6xl" role="img" aria-label={info.text} title={info.text}>
              {info.icon}
            </div>
            <div className="text-5xl font-bold text-white">
              {temp != null ? formatTemp(temp, unit) : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Description + feels-like */}
      <div className="text-center mb-6">
        <div className="text-white/90 text-lg mb-2">{info.text}</div>
        <div className="text-white/70 text-sm">
          {tW("feelsLike", {
            temp: formatTemp(apparent ?? (temp ?? 0), unit),
            defaultMessage: "Feels like {temp}",
          })}
        </div>
      </div>

      {/* Wind + Humidity */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-white/70 mb-1">{tW("wind", { defaultMessage: "Wind" })}</div>
          <div className="text-white font-semibold">
            {wind != null ? formatWind(wind) : "—"}
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="text-white/70 mb-1">{tW("humidity", { defaultMessage: "Humidity" })}</div>
          <div className="text-white font-semibold">
            {Number.isFinite(humidity) ? formatHumidity(humidity) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentCard;
