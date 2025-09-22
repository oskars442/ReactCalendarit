// src/features/weather/hooks/useLocalStorage.js
import { useEffect, useState } from "react";

export const useLocalStorage = (key, initialValue) => {
  const isBrowser = typeof window !== "undefined";

  // 1) Safe initial state on server
  const [storedValue, setStoredValue] = useState(() => {
    if (!isBrowser) return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 2) Hydrate from localStorage once on the client to avoid SSR errors
  useEffect(() => {
    if (!isBrowser) return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setStoredValue(JSON.parse(item));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 3) Setter that also persists (only in browser)
  const setValue = (value) => {
    try {
      const next =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(next);
      if (isBrowser) {
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // ignore
    }
  };

  return [storedValue, setValue];
};