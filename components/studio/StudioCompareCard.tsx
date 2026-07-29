import Image from "next/image";
import type { CSSProperties } from "react";

function normalizeBrandKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getBrandPriceColor(brandLabel: string) {
  const key = normalizeBrandKey(brandLabel);

  if (key === "bluestone") return "var(--color-brand-bluestone)";
  if (key === "caratlane") return "var(--color-brand-caratlane)";
  if (key === "tanishq") return "var(--color-brand-tanishq)";
  if (key === "miabytanishq" || key === "mia") return "var(--color-brand-tanishq)";

  return "var(--color-primary)";
}

type StudioCompareCardProps = {
  badge: "A" | "B";
  imageSrc: string;
  imageAlt: string;
  imageStyle?: CSSProperties;
  brandLabel: string;
  nameLabel: string;
  priceLabel: string;
  emptyLabel?: string;
};

export default function StudioCompareCard({
  badge,
  imageSrc,
  imageAlt,
  imageStyle,
  brandLabel,
  nameLabel,
  priceLabel,
  emptyLabel = "No image available",
}: StudioCompareCardProps) {
  const priceColor = getBrandPriceColor(brandLabel);

  return (
    <article className="studio-ig-card">
      <span className="studio-ig-card-badge">{badge}</span>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          unoptimized
          sizes="(max-width: 1000px) 40vw, 280px"
          style={imageStyle}
        />
      ) : (
        <div className="studio-ig-card-empty">{emptyLabel}</div>
      )}
      <div className="studio-ig-card-copy">
        <div className="studio-ig-card-brand">
          <span className="studio-ig-card-brand-name">{brandLabel}</span>
        </div>
        <p>{nameLabel}</p>
        <strong className="studio-ig-card-price" style={{ color: priceColor }}>{priceLabel}</strong>
      </div>
    </article>
  );
}
