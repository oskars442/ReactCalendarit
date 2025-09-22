// src/features/weather/components/UnitToggle.jsx
"use client";

import { useTranslations } from "@/lib/i18n/i18n";

export default function UnitToggle({ unit, onUnitChange }) {
  const t = useTranslations("weather");
  const isC = unit === "C";
  const isF = unit === "F";

  return (
    <div className="flex items-center justify-center">
      <div
        className="glass-card p-1 flex rounded-full"
        role="group"
        aria-label={t("units.group", { default: "Temperature units" })}
      >
        <button
          type="button"
          onClick={() => onUnitChange("C")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            isC ? "bg-white/30 text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          aria-label={t("aria.celsius", { default: "Celsius degrees" })}
          aria-pressed={isC}
        >
          {t("units.c", { default: "°C" })}
        </button>

        <button
          type="button"
          onClick={() => onUnitChange("F")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
            isF ? "bg-white/30 text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          aria-label={t("aria.fahrenheit", { default: "Fahrenheit degrees" })}
          aria-pressed={isF}
        >
          {t("units.f", { default: "°F" })}
        </button>
      </div>
    </div>
  );
}
