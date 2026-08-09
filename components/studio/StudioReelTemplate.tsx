import Image from "next/image";
import type { CSSProperties } from "react";

export type StudioReelScene = "storyboard" | "hook" | "details" | "reveal" | "end";

export type StudioReelProduct = {
  name: string;
  brand: string;
  price: number;
  image: string;
  imageStyle: CSSProperties;
};

type StudioReelTemplateProps = {
  templateId: string;
  scene: StudioReelScene;
  leftProduct?: StudioReelProduct;
  rightProduct?: StudioReelProduct;
  formatPrice: (value: number) => string;
};

function ReelProductImage({
  product,
  size,
}: {
  product?: StudioReelProduct;
  size: string;
}) {
  if (!product?.image) return null;

  return (
    <Image
      src={product.image}
      alt={product.name}
      fill
      unoptimized
      sizes={size}
      style={product.imageStyle}
    />
  );
}

export default function StudioReelTemplate({
  templateId,
  scene,
  leftProduct,
  rightProduct,
  formatPrice,
}: StudioReelTemplateProps) {
  const products = [
    { key: "A", product: leftProduct },
    { key: "B", product: rightProduct },
  ];

  return (
    <div className={`studio-reel-template studio-reel-template-${templateId} studio-reel-scene-${scene}`}>
      <div className="studio-reel-hook">
        <h2>Can you spot the expensive one?</h2>
        <p>
          One ring is {formatPrice(leftProduct?.price ?? 0)}. One is{" "}
          {formatPrice(rightProduct?.price ?? 0)}.
        </p>
      </div>

      <div className="studio-reel-split">
        {products.map(({ key, product }) => (
          <div className="studio-reel-side" key={key}>
            <ReelProductImage product={product} size="50vw" />
            <span className="studio-reel-side-label">{key}</span>
            <div className="studio-reel-side-meta">
              <strong>{product?.brand ?? "Brand"}</strong>
              <small>Detail zoom: sparkle - band - setting</small>
            </div>
          </div>
        ))}
      </div>

      <div className="studio-reel-reveal">
        <div className="studio-reel-split studio-reel-reveal-split">
          {products.map(({ key, product }) => (
            <div className="studio-reel-side studio-reel-reveal-side" key={key}>
              <ReelProductImage product={product} size="50vw" />
              <span className="studio-reel-side-label">{key}</span>
              <div className="studio-reel-side-meta">
                <strong>{product?.brand ?? "Brand"}</strong>
                <small>Detail zoom: sparkle - band - setting</small>
              </div>
              <strong className="studio-reel-price-tag">
                {formatPrice(product?.price ?? 0)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="studio-reel-end">
        <strong>Compare before you buy.</strong>
        <span>PickYourPiece - pickyourpiece.com</span>
      </div>
    </div>
  );
}
