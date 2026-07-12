import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  showNavbarSearch?: boolean;
  showNavbarBrand?: boolean;
}

export default function MainLayout({ children, showNavbarSearch = true, showNavbarBrand = false }: MainLayoutProps) {
  return (
    <div>
      <Sidebar />
      <div className="main-layout-wrapper">
        <Navbar showSearch={showNavbarSearch} showBrand={showNavbarBrand} />
        <main>{children}</main>
      </div>
    </div>
  );
}
