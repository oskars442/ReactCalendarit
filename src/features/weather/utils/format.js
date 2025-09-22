// Temperature conversion utilities
export const celsiusToFahrenheit = (celsius) => {
  return Math.round((celsius * 9/5) + 32);
};

export const fahrenheitToCelsius = (fahrenheit) => {
  return Math.round((fahrenheit - 32) * 5/9);
};

// Format temperature with unit
export const formatTemp = (temp, unit = 'C') => {
  if (temp === null || temp === undefined) return '--';
  const value = unit === 'F' ? celsiusToFahrenheit(temp) : Math.round(temp);
  return `${value}°${unit}`;
};

// Format date for Latvia locale
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('lv-LV', {
    timeZone: 'Europe/Riga',
    ...options
  }).format(date);
};

// Format day name
export const formatDayName = (dateString) => {
  return formatDate(dateString, { weekday: 'long' });
};

// Format hour
export const formatHour = (dateString) => {
  return formatDate(dateString, { hour: '2-digit', minute: '2-digit' });
};

// Format wind speed
export const formatWind = (windSpeed) => {
  if (windSpeed === null || windSpeed === undefined) return '--';
  return `${Math.round(windSpeed)} m/s`;
};

// Format humidity
export const formatHumidity = (humidity) => {
  if (humidity === null || humidity === undefined) return '--';
  return `${Math.round(humidity)}%`;
};

// Format "feels like" temperature
export const formatFeelsLike = (temp, unit = 'C') => {
  return `Sajūtas kā ${formatTemp(temp, unit)}`;
};