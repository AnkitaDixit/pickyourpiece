import MainLayout from "@/components/layout/MainLayout";

export default function ArticlesLoading() {
  return (
    <MainLayout>
      <div className="articles-page articles-loading" aria-hidden="true">
        <header className="articles-hero articles-loading-hero">
          <div className="articles-loading-line articles-loading-line-sm" />
          <div className="articles-loading-line articles-loading-line-lg" />
          <div className="articles-loading-line articles-loading-line-md" />
          <div className="articles-loading-search" />
        </header>

        <section className="articles-section">
          <div className="articles-loading-section-head" />
          <article className="article-featured-card">
            <div className="article-card-image-wrap articles-loading-image" />
            <div className="article-featured-content">
              <div className="articles-loading-chip" />
              <div className="articles-loading-line articles-loading-line-md" />
              <div className="articles-loading-line articles-loading-line-sm" />
              <div className="articles-loading-line articles-loading-line-xs" />
            </div>
          </article>
        </section>

        <section className="articles-section">
          <div className="articles-loading-section-head" />
          <div className="articles-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <article key={i} className="article-card">
                <div className="article-card-image-wrap articles-loading-image" />
                <div className="articles-loading-chip" />
                <div className="articles-loading-line articles-loading-line-md" />
                <div className="articles-loading-line articles-loading-line-sm" />
                <div className="articles-loading-line articles-loading-line-xs" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
