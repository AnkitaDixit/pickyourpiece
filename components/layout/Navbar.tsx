"use client";

import { Suspense } from "react";
import { UserRound } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";

interface NavbarProps {
  showSearch?: boolean;
  showBrand?: boolean;
}

export default function Navbar({ showSearch = true, showBrand = false }: NavbarProps) {
  const goHome = () => {
    if (window.location.pathname === "/" && window.location.search === "") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <nav className={`navbar${showBrand ? " navbar-show-brand" : ""}`}>
      {/* Left — Logo */}
      <div className="navbar-left">
        {showBrand ? (
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
