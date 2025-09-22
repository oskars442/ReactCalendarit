// src/features/weather/utils/weatherCodes.js

// Keep language-neutral data (icon + grouping) here.
// The *text* will come from i18n messages: weather.codes.<code>.text
const WEATHER_CODE_META = {
  0:  { icon: '☀️', group: 'clear' },
  1:  { icon: '🌤️', group: 'clear' },
  2:  { icon: '⛅',  group: 'clouds' },
  3:  { icon: '☁️', group: 'clouds' },
  45: { icon: '🌫️', group: 'clouds' }, // fog
  48: { icon: '🌫️', group: 'clouds' }, // rime fog
  51: { icon: '🌦️', group: 'rain'  }, // drizzle light
  53: { icon: '🌦️', group: 'rain'  },
  55: { icon: '🌧️', group: 'rain'  },
  56: { icon: '🌨️', group: 'rain'  }, // freezing drizzle
  57: { icon: '🌨️', group: 'rain'  },
  61: { icon: '🌦️', group: 'rain'  }, // rain light
  63: { icon: '🌧️', group: 'rain'  },
  65: { icon: '🌧️', group: 'rain'  },
  66: { icon: '🌨️', group: 'rain'  }, // freezing rain
  67: { icon: '🌨️', group: 'rain'  },
  71: { icon: '🌨️', group: 'snow'  }, // snow light
  73: { icon: '❄️',  group: 'snow'  },
  75: { icon: '❄️',  group: 'snow'  },
  77: { icon: '🌨️', group: 'snow'  }, // snow grains
  80: { icon: '🌦️', group: 'rain'  }, // rain showers
  81: { icon: '🌧️', group: 'rain'  },
  82: { icon: '⛈️', group: 'rain'  },
  85: { icon: '🌨️', group: 'snow'  }, // snow showers
  86: { icon: '❄️',  group: 'snow'  },
  95: { icon: '⛈️', group: 'rain'  }, // thunderstorm
  96: { icon: '⛈️', group: 'rain'  }, // thunder + hail
  99: { icon: '⛈️', group: 'rain'  },
};

// English fallbacks if no translator is passed
const DEFAULT_EN = {
  0:  'Clear',
  1:  'Mostly clear',
  2:  'Partly cloudy',
  3:  'Cloudy',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Heavy drizzle',
  56: 'Light freezing rain',
  57: 'Heavy freezing rain',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Moderate rain showers',
  82: 'Heavy rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

// Main helper: pass a translator `t` from next-intl if you have it.
// Usage with i18n:   const t = useTranslations('weather'); getWeatherInfo(code, t)
// Usage without i18n:                            getWeatherInfo(code)
export function getWeatherInfo(code, t) {
  const key = Number(code);
  const meta = WEATHER_CODE_META[key] || { icon: '❓', group: 'clouds' };

  let text;
  if (typeof t === 'function') {
    // Messages should live at weather.codes.<code>.text
    // We also provide a safe defaultMessage for missing keys.
    text = t(`codes.${key}.text`, { defaultMessage: DEFAULT_EN[key] || 'Unknown' });
  } else {
    text = DEFAULT_EN[key] || 'Unknown';
  }

  return { ...meta, text };
}

// Optional: if you only need the background group from a code
export function getBackgroundGroupFromCode(code) {
  return (WEATHER_CODE_META[Number(code)] || {}).group || 'clouds';
}
