"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";

interface NavbarProps {
  showSearch?: boolean;
  showBrand?: boolean;
}

const MOBILE_SWITCH_OPTIONS = [
  { id: "home", label: "Home", href: "/", iconSrc: "/logo.png", isLogo: true },
  { id: "ring", label: "Ring", href: "/ring", iconSrc: "/categories/ring.png", isLogo: false },
  { id: "earrings", label: "Earrings", href: "/earrings", iconSrc: "/categories/earrings.png", isLogo: false },
  { id: "bracelet", label: "Bracelet", href: "/bracelet", iconSrc: "/categories/bracelet.png", isLogo: false },
  { id: "pendant", label: "Pendant", href: "/pendant", iconSrc: "/categories/pendant.png", isLogo: false },
] as const;

export default function Navbar({ showSearch = true, showBrand = false }: NavbarProps) {
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);
  const isMobileCategoryDropdownRoute =
    pathname === "/ring" ||
    pathname === "/earrings" ||
    pathname === "/bracelet" ||
    pathname === "/pendant";
  const shouldShowBrand = showBrand && !isMobileCategoryDropdownRoute;

  const activeSwitcherOption = useMemo(() => {
    return MOBILE_SWITCH_OPTIONS.find((option) => option.href === pathname) ?? MOBILE_SWITCH_OPTIONS[0];
  }, [pathname]);

  useEffect(() => {
    setSwitcherOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!switcherOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!switcherRef.current) return;
      if (!switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSwitcherOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [switcherOpen]);

  const goHome = () => {
    if (window.location.pathname === "/" && window.location.search === "") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

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
    <nav className={`navbar${showBrand ? " navbar-show-brand" : ""}${isMobileCategoryDropdownRoute ? " navbar-has-mobile-switcher" : ""}`}>
      {/* Left — Logo */}
      <div className="navbar-left">
        <div className="navbar-mobile-switcher-wrap" ref={switcherRef}>
          {isMobileCategoryDropdownRoute ? (
            <button
              type="button"
              className={`navbar-mobile-switcher${switcherOpen ? " open" : ""}`}
              onClick={() => setSwitcherOpen((prev) => !prev)}
              aria-label="Open category switcher"
              aria-haspopup="menu"
              aria-expanded={switcherOpen}
            >
              <Image
                src={activeSwitcherOption.iconSrc}
                alt={activeSwitcherOption.isLogo ? "PickYourPiece" : ""}
                width={24}
                height={24}
                className={`navbar-mobile-switcher-icon${activeSwitcherOption.isLogo ? " is-logo" : ""}`}
                aria-hidden={activeSwitcherOption.isLogo ? undefined : true}
              />
              <ChevronDown size={14} className="navbar-mobile-switcher-caret" />
            </button>
          ) : null}

          {switcherOpen && isMobileCategoryDropdownRoute ? (
            <div className="navbar-mobile-switcher-menu" role="menu" aria-label="Switch category">
              {MOBILE_SWITCH_OPTIONS.map((option) => {
                const isActive = option.href === pathname;
                return (
                  <button
                    type="button"
                    key={option.id}
                    role="menuitem"
                    className={`navbar-mobile-switcher-item${isActive ? " active" : ""}`}
                    onClick={() => {
                      setSwitcherOpen(false);
                      if (option.href === "/") {
                        goHome();
                        return;
                      }
                      goTo(option.href);
                    }}
                  >
                    <Image
                      src={option.iconSrc}
                      alt=""
                      width={18}
                      height={18}
                      className={`navbar-mobile-switcher-item-icon${option.isLogo ? " is-logo" : ""}`}
                      aria-hidden="true"
                    />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {shouldShowBrand ? (
          <button type="button" className="navbar-logo" onClick={goHome} aria-label="Go to home">
            <span className="navbar-logo-text">
              Pick<span className="navbar-logo-red">Your</span>Piece
            </span>
          </button>
        ) : null}
      </div>

      {/* Center — SearchBar */}
      <div className="navbar-center">
        {showSearch ? (
          <Suspense fallback={<div className="searchbar-wrap" aria-hidden="true" />}>
            <SearchBar />
          </Suspense>
        ) : null}
      </div>

      {/* Right — Heart, Bell, Avatar */}
      <div className="navbar-right">
        <div className="navbar-avatar" aria-label="Guest profile">
          <UserRound size={18} />
        </div>
      </div>
    </nav>
  );
}
