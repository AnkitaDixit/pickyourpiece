import { Heart, Bell } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Left — empty (logo is in Sidebar) */}
    <div className="navbar-left" style={{ fontWeight: 500, fontSize: "1.5rem", color: "#111111", fontFamily: "emoji" }}>Pick<span style={{ color: "#DA001C", fontStyle: "italic" }}>Your</span>Piece</div>

      {/* Center — SearchBar */}
      <div className="navbar-center">
        <SearchBar />
      </div>

      {/* Right — Heart, Bell, Avatar */}
      <div className="navbar-right">
        <button className="navbar-icon-btn"><Heart size={20} /></button>
        <button className="navbar-icon-btn"><Bell size={20} /></button>
        <div className="navbar-avatar">A</div>
      </div>
    </nav>
  );
}
