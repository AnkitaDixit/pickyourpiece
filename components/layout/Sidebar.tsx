"use client";

import { useState } from "react";
import { Home } from "lucide-react";

const NAV_ITEMS = [
  { id: "home",     icon: Home },
  // { id: "search",   icon: Search },
  // { id: "heart",    icon: Heart },
  // { id: "folder",   icon: Folder },
  // { id: "bell",     icon: Bell },
];

export default function Sidebar() {
  const [active, setActive] = useState("home");

  const goHome = () => {
    setActive("home");
    // Force a full navigation so feed/filter client state is fully reset.
    if (window.location.pathname === "/" && window.location.search === "") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <button type="button" className="sidebar-logo" onClick={goHome}>
        <img src="/logo.png" alt="PickYourPiece" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
      </button>

      {NAV_ITEMS.map(({ id, icon: Icon }) => (
        <button
          type="button"
          key={id}
          onClick={() => {
            if (id === "home") {
              goHome();
              return;
            }
            setActive(id);
          }}
          className={`sidebar-btn${active === id ? " active" : ""}`}
        >
          <Icon size={20} />
        </button>
      ))}
    </aside>
  );
}
