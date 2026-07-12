"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const MIN_SEARCH_LENGTH = 3;
const CATALOG_MODE_PARAM = "mode";
const CATALOG_MODE_VALUE = "catalog";

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
  const urlQuery = searchParams.get("q") ?? "";
  const [focused, setFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(urlQuery);
  const value = focused ? draftValue : urlQuery;
  const isLandingVariant = variant === "landing";

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

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
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
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);

          if (nextValue.trim().length === 0 && urlQuery) {
            applySearch("");
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            applySearch(draftValue);
          }
        }}
        onFocus={() => {
          setDraftValue(urlQuery);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        aria-label={ariaLabel}
      />
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
