type StudioCompareFooterProps = {
  title: string;
  highlight: string;
  ctaLabel: string;
  ctaAriaLabel?: string;
  siteLabel: string;
};

export default function StudioCompareFooter({
  title,
  highlight,
  ctaLabel,
  ctaAriaLabel = "Compare now",
  siteLabel,
}: StudioCompareFooterProps) {
  return (
    <div className="studio-ig-compare-footer">
      <p>
        {title}
        <strong>{highlight}</strong>
      </p>
      <div className="studio-ig-compare-footer-action">
        <svg
          className="studio-ig-compare-footer-arrow"
          viewBox="0 0 64 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M2 20C18 4 34 4 50 12" />
          <path d="M45 6L54 12L45 18" />
        </svg>
        <button type="button" className="studio-ig-compare-footer-cta" aria-label={ctaAriaLabel}>
          {ctaLabel}
        </button>
      </div>
      <small>{siteLabel}</small>
    </div>
  );
}
