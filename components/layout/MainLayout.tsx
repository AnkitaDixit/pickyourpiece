import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      <div className="main-layout-wrapper">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
