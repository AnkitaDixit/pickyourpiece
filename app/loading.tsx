import MainLayout from "@/components/layout/MainLayout";

export default function Loading() {
  return (
    <MainLayout showNavbarSearch={false} showNavbarBrand>
      <div className="home-loading" aria-hidden="true">
        <section className="home-loading-hero">
          <div className="home-loading-copy">
            <div className="home-loading-line home-loading-line-lg" />
            <div className="home-loading-line home-loading-line-md" />
            <div className="home-loading-line home-loading-line-sm" />
            <div className="home-loading-search" />
          </div>
          <div className="home-loading-visual" />
        </section>

        <section className="home-loading-section">
          <div className="home-loading-section-head" />
          <div className="home-loading-chip-row">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`chip-${i}`} className="home-loading-chip" />
            ))}
          </div>
        </section>

        <section className="home-loading-section">
          <div className="home-loading-section-head" />
          <div className="home-loading-card-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <article key={`card-${i}`} className="home-loading-card">
                <div className="home-loading-card-image" />
                <div className="home-loading-card-line home-loading-card-line-lg" />
                <div className="home-loading-card-line home-loading-card-line-sm" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
