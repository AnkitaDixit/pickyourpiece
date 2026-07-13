import Navbar from "./Navbar";
import MobileCategoryNav from "./MobileCategoryNav";
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
        <footer className="site-footer" aria-labelledby="site-footer-title">
          <div className="site-footer-inner">
            <h2 id="site-footer-title">Disclaimer</h2>
            <p>
              <strong>PickYourPiece is an independent jewellery discovery and comparison platform.</strong> We are
              not affiliated with, endorsed by, or sponsored by any jewellery brand featured on this website unless
              explicitly stated.
            </p>
            <p>
              Product information, pricing, availability, images, and descriptions are sourced from publicly
              accessible information provided by the respective brands and may change without notice. All trademarks,
              logos, product names, and images remain the property of their respective owners.
            </p>
            <p>
              We make reasonable efforts to keep information accurate but do not guarantee the completeness, accuracy,
              or availability of any listing. Please verify all product details, pricing, offers, and policies on the
              retailer&apos;s official website before making a purchase.
            </p>
            <p>
              Purchases are completed directly with the respective retailer. PickYourPiece does not sell jewellery,
              process payments, handle shipping, warranties, returns, or customer support for listed products.
            </p>

            <h3>Privacy &amp; Data Notice</h3>
            <p>
              Some product images may be displayed from publicly accessible brand sources to help users compare
              jewellery across retailers. If you represent a brand and would like content updated, attributed
              differently, or removed, please contact us.
            </p>

            <p className="site-footer-contact">
              Contact us: <a href="mailto:abc@pickyourpiece.com">abc@pickyourpiece.com</a>
            </p>
            <p className="site-footer-copy">&copy; 2026 PickYourPiece. All rights reserved.</p>
          </div>
        </footer>
        <MobileCategoryNav />
      </div>
    </div>
  );
}
