"use client";

import { useEffect, useMemo, useState } from "react";
import "./index.css"; // ← scoped CSS with .weather-scope

import SearchBar from "./components/SearchBar";
import CurrentCard from "./components/CurrentCard";
import DailyForecast from "./components/DailyForecast";
import HourlyStrip from "./components/HourlyStrip";
import UnitToggle from "./components/UnitToggle";
import WeatherDetails from "./components/WeatherDetails";

import { useLocalStorage } from "./hooks/useLocalStorage";
import { getWeatherForecast, getBestLocation } from "./utils/api";
import { getWeatherInfo } from "./utils/weatherCodes";
import { useTranslations } from "@/lib/i18n/i18n";

// ----- constants copied from your old App.jsx -----
const DEFAULT_CITY = {
  name: "Rīga",
  latitude: 56.9496,
  longitude: 24.1052,
  country: "Latvia",
  admin1: "Rīga",
};

// Latvian coordinates are fixed; labels will be localized via i18n.
const QUICK_COORDS = [
  { key: "riga", latitude: 56.9496, longitude: 24.1052 },
  { key: "liepaja", latitude: 56.5053, longitude: 21.0107 },
  { key: "ventspils", latitude: 57.3894, longitude: 21.5644 },
  { key: "jelgava", latitude: 56.65, longitude: 23.7294 },
  { key: "jurmala", latitude: 56.9681, longitude: 23.7794 }
] as const;

const WEATHER_BACKGROUNDS: Record<string, string> = {
  clear: "bg-sunny",
  cloudy: "bg-cloudy",
  overcast: "bg-overcast",
  rain: "bg-rainy",
  drizzle: "bg-drizzle",
  snow: "bg-snowy",
  thunderstorm: "bg-stormy",
  fog: "bg-fog",
};

const BG_FALLBACK = "bg-default";

const hasDaily = (w: any) =>
  !!w?.daily && Array.isArray(w.daily.time) && w.daily.time.length > 0;
const hasHourly = (w: any) =>
  !!w?.hourly && Array.isArray(w.hourly.time) && w.hourly.time.length > 0;

const sliceDaily = (daily: any, offset = 1) => {
  if (!daily || !Array.isArray(daily.time)) return daily;
  const len = daily.time.length;
  const out: any = { ...daily };
  Object.keys(daily).forEach((k) => {
    if (Array.isArray(daily[k]) && daily[k].length === len) {
      out[k] = daily[k].slice(offset);
    }
  });
  return out;
};

export default function WeatherView() {
  const t = useTranslations("weather");

  const [weather, setWeather] = useState<any>(null);
  const [currentCity, setCurrentCity] = useLocalStorage("weather-city", DEFAULT_CITY);

  // keep only "C" | "F" in state
  const [unitRaw, setUnitRaw] = useLocalStorage("weather-unit", "C");
  const unit = (unitRaw === "F" ? "F" : "C") as "C" | "F";
  const setUnit = (u: "C" | "F") => setUnitRaw(u);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundClass, setBackgroundClass] = useState<string>(BG_FALLBACK);

  const setBgFromWeather = (data: any) => {
    const current = data?.current_weather ?? data?.current ?? null;
    if (!current) {
      setBackgroundClass(BG_FALLBACK);
      return;
    }
    if (typeof current.is_day === "number" && current.is_day === 0) {
      setBackgroundClass("bg-night");
      return;
    }
    const code = current.weathercode ?? current.weather_code;
    const { group } = getWeatherInfo(code, t);
    setBackgroundClass(WEATHER_BACKGROUNDS[group] || BG_FALLBACK);
  };

  const loadWeatherData = async (city: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherForecast(city.latitude, city.longitude);
      setWeather(data);
      setCurrentCity(city);
      setBgFromWeather(data);
    } catch (e: any) {
      // We’ll keep a generic message here; can add i18n key later if you want.
      setError(e?.message || "Failed to load weather");
      setBackgroundClass("bg-stormy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const loc = await getBestLocation();
        const inLV =
          loc.latitude >= 55.5 &&
          loc.latitude <= 58.1 &&
          loc.longitude >= 20.5 &&
          loc.longitude <= 28.3;

        if (inLV) {
        await loadWeatherData({
name: loc.city
   ? `${loc.city} ${t("yourLocationSuffix", { defaultMessage: "(your location)" })}`
  : t("yourLocation", { defaultMessage: "Your location" }),
  latitude: loc.latitude,
  longitude: loc.longitude
});
          return;
        }
      } catch {
        // ignore and fall back
      }
      await loadWeatherData(currentCity || DEFAULT_CITY);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCitySelect = (city: any) => loadWeatherData(city);
  const handleQuickPick = (city: any) => loadWeatherData(city);
  const handleRetry = () => loadWeatherData(currentCity || DEFAULT_CITY);

  // Quick-pick buttons with localized labels
  const quickPicks = useMemo(
    () =>
      QUICK_COORDS.map((c) => ({
        name: t(`quick.${c.key}` as any),
        latitude: c.latitude,
        longitude: c.longitude,
      })),
    [t]
  );

  return (
    <div className={`weather-scope ${backgroundClass || BG_FALLBACK}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 text-shadow">
            🌦️ {t("title")}
          </h1>
          <p className="text-white/80 text-shadow">{t("subtitle")}</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar onCitySelect={handleCitySelect} currentCity={currentCity} />
        </div>

        {/* Quick picks */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {quickPicks.map((city) => (
              <button
                key={`${city.name}-${city.latitude}-${city.longitude}`}
                onClick={() => handleQuickPick(city)}
                className={`glass-button px-4 py-2 text-white text-sm font-medium transition-all duration-300 ${
                  currentCity?.name === city.name ? "ring-2 ring-white/50" : ""
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="mb-8 flex justify-center">
          <UnitToggle unit={unit} onUnitChange={setUnit} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
              <p className="text-white text-lg text-shadow">
                {/* using common.loading would be fine too */}
                {t("hourlyTitle") /* keep something visible while loading */}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!!error && !loading && (
          <div className="flex justify-center items-center py-20">
            <div className="glass-card p-8 text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-white text-xl font-bold mb-2 text-shadow">Error</h3>
              <p className="text-white/80 mb-4 text-shadow">{error}</p>
              <button
                onClick={handleRetry}
                className="glass-button px-6 py-3 text-white font-medium hover:scale-105 transition-transform"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!!weather && !loading && !error && (
          <div className="space-y-8">
            {/* 2 columns: left big card (Current + Details), right 7-day */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 lg:p-8 space-y-6">
                <CurrentCard
                  weather={weather.current_weather ?? weather.current ?? null}
                  city={currentCity}
                  unit={unit}
                  hourly={hasHourly(weather) ? weather.hourly : null}
                  containerless
                />
                <div className="border-t border-white/10" />
                <WeatherDetails
                  weather={weather.current_weather ?? weather.current ?? {}}
                  hourly={hasHourly(weather) ? weather.hourly : null}
                  daily={hasDaily(weather) ? weather.daily : null}
                  unit={unit}
                  containerless
                />
              </div>

              <div>
                {hasDaily(weather) ? (
<div>
  <DailyForecast daily={sliceDaily(weather.daily, 1)} unit={unit} />
</div>
                ) : (
                  <div className="glass-card p-6 text-white/80">
                    {/* simple generic fallback */}
                    No daily data available.
                  </div>
                )}
              </div>
            </div>

            {hasHourly(weather) ? (
 <HourlyStrip
  hourly={weather.hourly}
  unit={unit}
  nowIso={(weather.current_weather ?? weather.current)?.time}
/>
            ) : (
              <div className="glass-card p-6 text-center text-white/80">
                No hourly data available.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-white/60 text-sm">
        <p className="text-shadow">
  {t("dataBy", { defaultMessage: "Data by" })}{" "}
  <a
    href="https://open-meteo.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-white/80 hover:text-white transition-colors underline"
  >
    Open-Meteo
  </a>
</p>
        </footer>
      </div>
    </div>
  );
}
