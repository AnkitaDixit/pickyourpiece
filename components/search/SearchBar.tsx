"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`searchbar-wrap${focused ? " focused" : ""}`}>
      <Search size={18} className="searchbar-icon" />
      <input
        type="text"
        placeholder="Search rings, earrings, necklaces..."
        className="searchbar-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}
