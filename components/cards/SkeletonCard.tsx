export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-heart" />
      <div className="skeleton-info">
        <div className="skeleton-brand-row">
          <div className="skeleton-brand-logo" />
          <div className="skeleton-brand-name" />
        </div>
        <div className="skeleton-price-row">
          <div className="skeleton-price" />
          <div className="skeleton-link" />
        </div>
      </div>
    </div>
  );
}
