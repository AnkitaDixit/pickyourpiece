"use client";

import { useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const MIN_SEARCH_LENGTH = 3;
const MIN_SUGGEST_LENGTH = 1;
const MAX_SUGGESTIONS = 8;
const RECENT_SEARCHES_KEY = "pickyourpiece.recentSearches";
const CATALOG_MODE_PARAM = "mode";
const CATALOG_MODE_VALUE = "catalog";

const BASE_SUGGESTIONS = [
  "diamond ring",
  "engagement ring",
  "solitaire ring",
  "halo ring",
  "gold ring",
  "platinum ring",
  "silver earrings",
  "stud earrings",
  "hoop earrings",
  "pendant set",
  "bracelet",
  "daily wear",
  "wedding jewelry",
  "anniversary gift",
  "rose gold",
  "yellow gold",
  "white gold",
  "minimal",
  "statement",
  "bluestone",
  "caratlane",
  "giva",
  "mia",
  "palmonas",
];

const normalizeSuggestText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function getInitialRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_SUGGESTIONS);
  } catch {
    return [];
  }
}

function scoreSuggestion(candidate: string, query: string): number {
  if (candidate === query) return 120;
  if (candidate.startsWith(query)) return 90;
  if (candidate.split(" ").some((word) => word.startsWith(query))) return 70;
  if (candidate.includes(query)) return 40;
  return 0;
}

interface SearchBarProps {
  variant?: "default" | "hero" | "landing";
  placeholder?: string;
  ariaLabel?: string;
}

export default function SearchBar({
  variant = "default",
  placeholder = "Search by title, brand, description, category, or metal...",
  ariaLabel = "Search products",
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const urlQuery = searchParams.get("q") ?? "";
  const [focused, setFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(urlQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(getInitialRecentSearches);
  const [activeIndex, setActiveIndex] = useState(-1);
  const value = focused ? draftValue : urlQuery;
  const isLandingVariant = variant === "landing";

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH || typeof window === "undefined") return;

    setRecentSearches((previous) => {
      const next = [trimmed, ...previous.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())]
        .slice(0, MAX_SUGGESTIONS);

      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage write failures.
      }

      return next;
    });
  };

  const suggestions = useMemo(() => {
    const normalizedDraft = normalizeSuggestText(draftValue);
    if (!focused || normalizedDraft.length < MIN_SUGGEST_LENGTH) return [];

    const candidates = Array.from(new Set([...recentSearches, ...BASE_SUGGESTIONS]));

    return candidates
      .map((candidate) => ({
        value: candidate,
        normalized: normalizeSuggestText(candidate),
      }))
      .map((entry) => ({
        ...entry,
        score: scoreSuggestion(entry.normalized, normalizedDraft),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.value.localeCompare(b.value))
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => entry.value);
  }, [draftValue, focused, recentSearches]);

  const suggestionsOpen = focused && suggestions.length > 0;

  const applySearch = (rawValue: string) => {
    const isCatalogPath = pathname === "/" || pathname.startsWith("/brands/");
    const targetPath = isCatalogPath ? pathname : "/";
    const params = isCatalogPath ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const trimmed = rawValue.trim();

    params.delete("preview");

    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      params.set("q", trimmed);
      params.delete(CATALOG_MODE_PARAM);
    } else if (trimmed.length === 0) {
      params.delete("q");
      const hasOtherParams = Array.from(params.keys()).some((key) => key !== CATALOG_MODE_PARAM);

      if (targetPath === "/" && !hasOtherParams) {
        params.set(CATALOG_MODE_PARAM, CATALOG_MODE_VALUE);
      }
    } else {
      return;
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${targetPath}?${nextQuery}` : targetPath;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      saveRecentSearch(trimmed);
    }

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setDraftValue(suggestion);
    setActiveIndex(-1);
    applySearch(suggestion);
  };

  return (
    <div
      className={`searchbar-wrap${focused ? " focused" : ""}${variant === "hero" ? " searchbar-hero" : ""}${isLandingVariant ? " searchbar-landing" : ""}`}
    >
      {isLandingVariant ? null : <Search size={18} className="searchbar-icon" />}
      <input
        type="text"
        placeholder={placeholder}
        className="searchbar-input"
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestionsOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          setActiveIndex(-1);

          if (nextValue.trim().length === 0 && urlQuery) {
            applySearch("");
          }
        }}
        onKeyDown={(event) => {
          if (suggestionsOpen && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
            return;
          }

          if (suggestionsOpen && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
            return;
          }

          if (event.key === "Escape") {
            setActiveIndex(-1);
            setFocused(false);
            return;
          }

          if (event.key === "Enter") {
            if (suggestionsOpen && activeIndex >= 0) {
              event.preventDefault();
              selectSuggestion(suggestions[activeIndex]);
              return;
            }

            applySearch(draftValue);
          }
        }}
        onFocus={() => {
          setDraftValue(urlQuery);
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          setActiveIndex(-1);
        }}
        aria-label={ariaLabel}
      />
      {suggestionsOpen ? (
        <ul className="searchbar-suggest-list" id={listboxId} role="listbox" aria-label="Search suggestions">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion}-${index}`} role="presentation">
              <button
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={`searchbar-suggest-item${activeIndex === index ? " active" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Search size={14} className="searchbar-suggest-icon" aria-hidden="true" />
                <span>{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {isLandingVariant ? (
        <button
          type="button"
          className="searchbar-submit"
          onClick={() => applySearch(draftValue)}
          aria-label="Search"
        >
          <Search size={16} />
        </button>
      ) : value && (
        <button
          type="button"
          className="searchbar-clear"
          onClick={() => {
            setDraftValue("");
            applySearch("");
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
