// src/utils/api.js

// ─────────────────────────────────────────────────────────────────────────────
// Small fetch helper with timeout (prevents hanging requests)
// ─────────────────────────────────────────────────────────────────────────────
const fetchWithTimeout = async (url, opts = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

/** ────────────────────────────────────────────────────────────────────────────
 * Geocoding (Latvia only)
 * ─────────────────────────────────────────────────────────────────────────── */
export const searchCities = async (cityName) => {
  if (!cityName?.trim()) return [];
  try {
    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(cityName)}` +
      `&count=10&language=lv&format=json&country_code=LV`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Neizdevās meklēt pilsētas');

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Geocoding error:', err);
    throw new Error('Neizdevās meklēt pilsētas');
  }
};

/** ────────────────────────────────────────────────────────────────────────────
 * Forecast (current + hourly + daily)
 * Notes:
 *  - Do NOT include "time" in hourly/daily lists (API rejects it).
 *  - windspeed_unit=ms => you get m/s directly.
 *  - past_days=1 lets you build the sunrise/sunset slider with today’s context.
 * ─────────────────────────────────────────────────────────────────────────── */
export const getWeatherForecast = async (latitude, longitude) => {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),

      // Hourly variables used in your UI
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'precipitation_probability',
        'precipitation',
        'cloud_cover',
        'visibility',
        'uv_index',
        'surface_pressure',
        'pressure_msl'
      ].join(','),

      // Daily variables
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'daylight_duration',
        'sunshine_duration',
        'uv_index_max',
        'precipitation_sum',
        'precipitation_hours',
        'precipitation_probability_max',
        'rain_sum',
        'showers_sum',
        'snowfall_sum',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'wind_direction_10m_dominant',
        'shortwave_radiation_sum',
        'et0_fao_evapotranspiration'
      ].join(','),

      // Units & formatting
      timezone: 'Europe/Riga',
      timeformat: 'iso8601',
      temperature_unit: 'celsius',
      windspeed_unit: 'ms',
      precipitation_unit: 'mm',

      // Ranges
      forecast_days: '7',
      current_weather: 'true'
    });

    // include the previous day so the sun-path slider can animate from start
    params.set('past_days', '1');

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    console.debug('Open-Meteo URL:', url);

    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      let msg = `HTTP error! status: ${res.status}`;
      try { msg += ` - ${await res.text()}`; } catch {}
      throw new Error(msg);
    }

    const data = await res.json();

    const hasCurrent =
      !!data.current_weather || !!data.current; // some deployments expose "current"
    const hasHourly =
      !!data.hourly && Array.isArray(data.hourly.time) && data.hourly.time.length > 0;

    if (!hasCurrent && !hasHourly) {
      throw new Error('Neizdevās iegūt pašreizējos laika apstākļus');
    }

    console.debug('Open-Meteo payload OK', {
      hasCurrentWeather: !!data.current_weather,
      hourlyKeys: data.hourly ? Object.keys(data.hourly) : [],
      dailyKeys: data.daily ? Object.keys(data.daily) : []
    });

    return data;
  } catch (error) {
    console.error('Weather API error:', error);
    const msg = String(error?.message || '');
    if (msg.includes('AbortError') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('Nav interneta savienojuma');
    }
    if (msg.includes('HTTP error')) {
      throw new Error('Laika serviss nav pieejams');
    }
    throw new Error('Neizdevās iegūt laika apstākļus');
  }
};

/** ────────────────────────────────────────────────────────────────────────────
 * Geolocation: GPS (browser) + IP fallback + small cache
 *  - Works on Android/iOS/Desktop (needs HTTPS or localhost).
 *  - On iOS, prefer calling from a user gesture (button tap).
 * ─────────────────────────────────────────────────────────────────────────── */
export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Ģeolokācija nav atbalstīta šajā pārlūkprogrammā'));
      return;
    }
    // HTTPS is required except on localhost
    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!window.isSecureContext && !isLocal) {
      reject(new Error('Ģeolokācijai vajag HTTPS'));
      return;
    }

    const options = {
      timeout: 15000,
      enableHighAccuracy: true,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          source: 'gps'
        }),
      (err) => {
        const map = {
          1: 'Atrašanās vietas piekļuve ir liegta',
          2: 'Atrašanās vietas informācija nav pieejama',
          3: 'Atrašanās vietas pieprasījums ir novecojis'
        };
        reject(new Error(map[err.code] || 'Nezināma kļūda atrašanās vietas noteikšanā'));
      },
      options
    );
  });

// IP fallback (approximate location; no key; low rate limits)
export const getLocationViaIP = async () => {
  const r = await fetchWithTimeout('https://ipapi.co/json/');
  if (!r.ok) throw new Error('IP geolokācija nav pieejama');
  const j = await r.json();
  if (!j.latitude || !j.longitude) throw new Error('Nepareiza IP geolokācijas atbilde');
  return {
    latitude: Number(j.latitude),
    longitude: Number(j.longitude),
    city: j.city,
    country: j.country_name,
    source: 'ip'
  };
};

// simple localStorage cache
const LOC_CACHE_KEY = 'last-known-location';
const saveLocCache = (loc) => {
  try { localStorage.setItem(LOC_CACHE_KEY, JSON.stringify({ ...loc, ts: Date.now() })); } catch {}
};
const readLocCache = (maxAgeMs = 2 * 60 * 60 * 1000) => {
  try {
    const raw = localStorage.getItem(LOC_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts <= maxAgeMs) return obj;
  } catch {}
  return null;
};

// Best-effort location: cache → GPS (if not denied) → IP
export const getBestLocation = async () => {
  const cached = readLocCache();
  if (cached) return { ...cached, source: cached.source || 'cache' };

  // If Permissions API is available and geolocation isn't denied, try GPS
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null);
    if (!status || status.state !== 'denied') {
      const gps = await getCurrentLocation();
      saveLocCache(gps);
      return gps;
    }
  } catch {
    // ignore and try IP
  }

  const ip = await getLocationViaIP();
  saveLocCache(ip);
  return ip;
};

/** ────────────────────────────────────────────────────────────────────────────
 * Air quality (optional)
 * ─────────────────────────────────────────────────────────────────────────── */
export const getAirQuality = async (latitude, longitude) => {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&timezone=Europe%2FRiga`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Neizdevās iegūt gaisa kvalitātes datus');

    return await res.json();
  } catch (err) {
    console.error('Air Quality API error:', err);
    throw new Error('Neizdevās iegūt gaisa kvalitātes datus');
  }
};

/** ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────────────── */
export const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) &&
         lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

export const formatApiError = (error) => {
  const msg = String(error?.message || '');
  if (msg.includes('fetch') || msg.includes('Network')) return 'Pārbaudi interneta savienojumu';
  if (msg.includes('404')) return 'Dati nav atrasti šai atrašanās vietai';
  if (msg.includes('500')) return 'Servera kļūda, mēģini vēlāk';
  return msg || 'Nezināma kļūda';
};
