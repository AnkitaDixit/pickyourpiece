"use client";

import { BookText, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { id: "home", href: "/", icon: Home },
  { id: "articles", href: "/articles", icon: BookText },
  // { id: "search",   icon: Search },
  // { id: "heart",    icon: Heart },
  // { id: "folder",   icon: Folder },
  // { id: "bell",     icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [, setActive] = useState("home");

  const goHome = () => {
    setActive("home");
    // Force full navigation so feed/filter client state is fully reset.
    if (window.location.pathname === "/" && window.location.search === "") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  const goTo = (href: string) => {
    if (href === "/") {
      goHome();
      return;
    }

    if (href === "/articles") {
      setActive("articles");
    }

    if (window.location.pathname === href) {
      window.location.reload();
      return;
    }

    window.location.assign(href);
  };

  const isActiveItem = (id: string, href: string) => {
    if (id === "home") return pathname === "/";
    if (id === "articles") return pathname?.startsWith("/articles") ?? false;
    return pathname === href;
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <button type="button" className="sidebar-logo" onClick={goHome}>
        <img src="/logo.png" alt="PickYourPiece" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover" }} />
      </button>

      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ id, href, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => goTo(href)}
            className={`sidebar-btn${isActiveItem(id, href) ? " active" : ""}`}
            aria-label={id === "home" ? "Go to home" : "Open articles"}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </aside>
  );
}
