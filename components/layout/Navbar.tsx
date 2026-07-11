"use client";

import { Suspense } from "react";
import { UserRound } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";

export default function Navbar() {
  const goHome = () => {
    if (window.location.pathname === "/" && window.location.search === "") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <nav className="navbar">
      {/* Left — Logo */}
      <div className="navbar-left">
        {/* <button type="button" className="navbar-logo" onClick={goHome} aria-label="Go to home">
          <span className="navbar-logo-text">
            Pick<span className="navbar-logo-red">Your</span>Piece
          </span>
        </button> */}
      </div>

      {/* Center — SearchBar */}
      <div className="navbar-center">
        <Suspense fallback={<div className="searchbar-wrap" aria-hidden="true" />}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Right — Heart, Bell, Avatar */}
      <div className="navbar-right">
        {/* <button className="navbar-icon-btn"><Heart size={20} /></button>
        <button className="navbar-icon-btn"><Bell size={20} /></button> */}
        <div className="navbar-avatar" aria-label="Guest profile">
          <UserRound size={18} />
        </div>
      </div>
    </nav>
  );
}
