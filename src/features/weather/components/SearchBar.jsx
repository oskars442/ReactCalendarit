"use client";

import { useState, useEffect, useRef } from "react";
import { searchCities } from "../utils/api";
import { useTranslations } from "@/lib/i18n/i18n";

const SearchBar = ({ onCitySelect, currentCity }) => {
  const t = useTranslations("weather");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          const results = await searchCities(query);
          setSuggestions(results);
          setIsOpen(true);
          setSelectedIndex(-1);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleCitySelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleCitySelect = (city) => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    onCitySelect(city);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("searchPlaceholder", { default: "Search a city in Latvia..." })}
          className="w-full px-4 py-3 pl-10 glass-card text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
          aria-label={t("searchAria", { default: "Search city" })}
          aria-expanded={isOpen}
          aria-controls={isOpen ? "city-suggestions" : undefined}
          aria-activedescendant={selectedIndex >= 0 ? `city-option-${selectedIndex}` : undefined}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {isOpen && (
        <div
          ref={listRef}
          id="city-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 glass-card max-h-64 overflow-y-auto animate-fade-in"
        >
          {suggestions.length > 0 ? (
            suggestions.map((city, index) => (
              <button
                key={`${city.latitude}-${city.longitude}`}
                id={`city-option-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleCitySelect(city)}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-150 ${
                  index === selectedIndex ? "bg-white/10" : ""
                } ${index === 0 ? "rounded-t-2xl" : ""} ${
                  index === suggestions.length - 1 ? "rounded-b-2xl" : "border-b border-white/10"
                }`}
              >
                <div className="text-white font-medium">{city.name}</div>
                {(city.admin1 || city.country) && (
                  <div className="text-white/70 text-sm">
                    {city.admin1}
                    {city.country ? `, ${city.country}` : `, ${t("countryLV", { default: "Latvia" })}`}
                  </div>
                )}
              </button>
            ))
          ) : query.trim().length > 1 && !isLoading ? (
            <div className="px-4 py-3 text-white/70 text-center">
              {t("noResults", { default: "City not found" })}
            </div>
          ) : null}
        </div>
      )}

      {/* Current city display (name already localized upstream if you append a suffix) */}
      {currentCity && (
        <div className="mt-2 text-center text-white text-lg font-semibold">📍 {currentCity.name}</div>
      )}
    </div>
  );
};

export default SearchBar;
