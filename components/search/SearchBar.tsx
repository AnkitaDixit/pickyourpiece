"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

const MIN_SEARCH_LENGTH = 3;

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [focused, setFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(urlQuery);
  const value = focused ? draftValue : urlQuery;

  const applySearch = (rawValue: string) => {
    const isCatalogPath = pathname === "/" || pathname.startsWith("/brands/");
    const targetPath = isCatalogPath ? pathname : "/";
    const params = isCatalogPath ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const trimmed = rawValue.trim();

    params.delete("preview");

    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      params.set("q", trimmed);
    } else if (trimmed.length === 0) {
      params.delete("q");
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
    <div className={`searchbar-wrap${focused ? " focused" : ""}`}>
      <Search size={18} className="searchbar-icon" />
      <input
        type="text"
        placeholder="Search by title, brand, description, category, or metal..."
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
        aria-label="Search products"
      />
      {value && (
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
