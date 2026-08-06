"use client";

import { Home } from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "ring", label: "Ring", href: "/ring", iconSrc: "/categories/ring.png" },
  { id: "earrings", label: "Earrings", href: "/earrings", iconSrc: "/categories/earrings.png" },
  { id: "bracelet", label: "Bracelet", href: "/bracelet", iconSrc: "/categories/bracelet.png" },
  { id: "pendant", label: "Pendant", href: "/pendant", iconSrc: "/categories/pendant.png" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const goHome = () => {
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

    const target = new URL(href, window.location.origin);
    const currentPathWithQuery = `${window.location.pathname}${window.location.search}`;
    const targetPathWithQuery = `${target.pathname}${target.search}`;

    if (currentPathWithQuery === targetPathWithQuery) {
      window.location.reload();
      return;
    }

    window.location.assign(href);
  };

  const isActiveItem = (id: string, href: string) => {
    if (id === "home") return pathname === "/";
    if (id === "ring") return pathname === "/ring";
    if (id === "earrings") return pathname === "/earrings";
    if (id === "bracelet") return pathname === "/bracelet";
    if (id === "pendant") return pathname === "/pendant";
    return pathname === href;
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <button type="button" className="sidebar-logo" onClick={goHome}>
        <img src="/logo.png" alt="PickYourPiece" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover" }} />
      </button>

      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, href, icon: Icon, iconSrc }) => (
          <button
            type="button"
            key={id}
            onClick={() => goTo(href)}
            className={`sidebar-btn${isActiveItem(id, href) ? " active" : ""}`}
            aria-label={label}
          >
            <span className="sidebar-btn-icon">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt=""
                  width={22}
                  height={22}
                  aria-hidden="true"
                  style={{ objectFit: "contain", filter: "opacity(0.5)" }}
                />
              ) : Icon ? (
                <Icon size={22} strokeWidth={1.8} />
              ) : null}
            </span>
            <span className="sidebar-btn-label">{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
