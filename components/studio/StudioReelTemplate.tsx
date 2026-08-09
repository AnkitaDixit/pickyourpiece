import Image from "next/image";
import type { CSSProperties } from "react";

export type StudioReelScene =
  | "storyboard"
  | "hook"
  | "details"
  | "reveal"
  | "end";

export type StudioReelProduct = {
  name: string;
  brand: string;
  price: number;
  image: string;
  imageStyle: CSSProperties;
};

type Props = {
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
    <div className="reel-image-wrap">
      <Image
        src={product.image}
        alt={product.name}
        fill
        unoptimized
        sizes={size}
        className="reel-image"
        style={product.imageStyle}
      />
      {/* <div className="reel-image-glow" />
      <div className="reel-sparkle sparkle-1" />
      <div className="reel-sparkle sparkle-2" /> */}
    </div>
  );
}

export default function StudioReelTemplate({
  scene,
  leftProduct,
  rightProduct,
  formatPrice,
}: Props) {
  const products = [
    { key: "A", product: leftProduct },
    { key: "B", product: rightProduct },
  ];

  return (
    <div className={`reel-shell reel-scene-${scene}`}>
      {scene === "hook" && (
        <>
          <div className="reel-hook-badge pop-in">GUESS THE PRICE</div>
          <h1 className="reel-hook-title slide-up">Can you spot the expensive one?</h1>
          <p className="reel-hook-copy fade-in">
            One ring is {formatPrice(leftProduct?.price ?? 0)}.
            <br />
            One is {formatPrice(rightProduct?.price ?? 0)}.
          </p>
          <div className="reel-split">
            {products.map(({ key, product }, index) => (
              <div key={key} className={`reel-side ${index === 0 ? "slide-left" : "slide-right"}`}>
                <ReelProductImage product={product} size="50vw" />
                <span className="reel-side-label">{key}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {scene === "details" && (
        <div className="reel-details-grid">
          {products.map(({ key, product }) => (
            <div key={key} className="reel-detail-card zoom-card">
              <ReelProductImage product={product} size="80vw" />
              <div className="reel-detail-overlay">
                <span>Ring {key}</span>
                <strong>Sparkle • Band • Setting</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {scene === "reveal" && (
        <>
          <div className="reel-reveal-badge bounce-in">REVEAL</div>
          <div className="reel-reveal-grid">
            {products.map(({ key, product }, index) => (
              <div key={key} className={`reel-reveal-card ${index === 0 ? "slide-left" : "slide-right"}`}>
                <ReelProductImage product={product} size="40vw" />
                <div className="reel-price-card pop-in">
                  <span className="reel-price-label">{key}</span>
                  <strong>{formatPrice(product?.price ?? 0)}</strong>
                  <small>{product?.brand}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {scene === "end" && (
        <div className="reel-end-screen fade-in">
          <div className="reel-logo pulse">PickYourPiece</div>
          <strong>Compare before you buy.</strong>
        <span>PickYourPiece - pickyourpiece.com</span>
          <p>Compare similar rings across brands in seconds.</p>
          <div className="reel-cta-button pulse">Compare Similar Rings</div>
          <span className="reel-site">pickyourpiece.com</span>
        </div>
      )}

      {scene === "storyboard" && (
        <div className="reel-storyboard">
          <div>0-3s Hook</div>
          <div>3-8s Details</div>
          <div>8-12s Reveal</div>
          <div>12-15s CTA</div>
        </div>
      )}
    </div>
  );
}
