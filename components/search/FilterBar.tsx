"use client";

import { SlidersHorizontal, ChevronDown } from "lucide-react";

const DROPDOWNS = ["Rings", "Metal", "Price", "Style", "Gemstone", "Occasion"];

export default function FilterBar() {
  return (
    <div className="filterbar">
      <button className="filter-btn-primary">
        <SlidersHorizontal size={15} />
        Filters
      </button>

      {DROPDOWNS.map((label) => (
        <button key={label} className="filter-btn-chip">
          {label}
          <ChevronDown size={14} className="chevron" />
        </button>
      ))}

      <div className="filterbar-spacer" />

      <button className="filter-btn-chip">
        Sort by
        <ChevronDown size={14} className="chevron" />
      </button>
    </div>
  );
}

