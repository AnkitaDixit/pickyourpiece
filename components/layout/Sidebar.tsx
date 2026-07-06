"use client";

import { useState } from "react";
import { Home, Search, Heart, Folder, Bell } from "lucide-react";

const NAV_ITEMS = [
  { id: "home",     icon: Home },
  { id: "search",   icon: Search },
  { id: "heart",    icon: Heart },
  { id: "folder",   icon: Folder },
  { id: "bell",     icon: Bell },
];

export default function Sidebar() {
  const [active, setActive] = useState("home");

  return (
    <aside className="sidebar">
      {/* Logo */}
      <button className="sidebar-logo">
        <img src="/logo.png" alt="PickYourPiece" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
      </button>

      {NAV_ITEMS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActive(id)}
          className={`sidebar-btn${active === id ? " active" : ""}`}
        >
          <Icon size={20} />
        </button>
      ))}
    </aside>
  );
}
