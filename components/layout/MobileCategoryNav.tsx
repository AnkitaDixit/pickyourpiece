"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const MOBILE_CATEGORY_ITEMS = [
  { id: "ring", label: "Ring", href: "/ring", iconSrc: "/categories/ring.png" },
  { id: "earrings", label: "Earrings", href: "/earrings", iconSrc: "/categories/earrings.png" },
  { id: "bracelet", label: "Bracelet", href: "/bracelet", iconSrc: "/categories/bracelet.png" },
  { id: "pendant", label: "Pendant", href: "/pendant", iconSrc: "/categories/pendant.png" },
];

export default function MobileCategoryNav() {
  const pathname = usePathname();
  const showOnRoute = pathname === "/";

  useEffect(() => {
    const className = "has-mobile-category-nav";

    if (showOnRoute) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [showOnRoute]);

  if (!showOnRoute) {
    return null;
  }

  const goTo = (href: string) => {
    const target = new URL(href, window.location.origin);
    const currentPathWithQuery = `${window.location.pathname}${window.location.search}`;
    const targetPathWithQuery = `${target.pathname}${target.search}`;

    if (currentPathWithQuery === targetPathWithQuery) {
      window.location.reload();
      return;
    }

    window.location.assign(href);
  };

  return (
    <nav className="mobile-category-nav" aria-label="Primary categories">
      {MOBILE_CATEGORY_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            type="button"
            key={item.id}
            className={`mobile-category-btn${isActive ? " active" : ""}`}
            onClick={() => goTo(item.href)}
            aria-label={item.label}
            title={item.label}
          >
            <img src={item.iconSrc} alt="" width={22} height={22} aria-hidden="true" style={{ objectFit: "contain" }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
