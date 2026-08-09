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
  logo?: string;
  price: number;
  image: string;
  imageStyle: CSSProperties;
  metal?: string;
  style?: string[];
  gemstone?: string[];
  color?: string;
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

function formatProductDetails(product?: StudioReelProduct) {
  if (!product) return "Ring details unavailable";

  return [
    product.metal,
    ...(product.style ?? []),
    ...(product.gemstone ?? []),
    // product.color,
  ]
    .filter(Boolean)
    .join(" • ");
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
                <strong>{formatProductDetails(product)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {scene === "reveal" && (
        <>
          <div className="reel-reveal-grid">
            {products.map(({ key, product }, index) => (
              <div
                key={key}
                className={`reel-reveal-card ${
                  index === 0 ? "slide-left delay-0" : "slide-right delay-1"
                }`}
              >
                <ReelProductImage product={product} size="40vw" />

                <div className="reel-price-card pop-in">
                  {product?.logo ? (
                   <div><Image
                      src={product.logo}
                      alt={`${product.brand} logo`}
                      width={120}
                      height={36}
                      unoptimized
                      className="reel-brand-logo"
                    /> <small> {product?.brand}</small></div>
                  ) : null}
                  <strong>{formatPrice(product?.price ?? 0)}</strong>
                  {/* <small>{product?.brand}</small> */}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {scene === "end" && (
        <div className="reel-end-screen fade-in">
          <div className="reel-logo pulse">
            <Image
              src="/logo.png"
              alt="PickYourPiece"
              width={72}
              height={72}
              unoptimized
              className="reel-logo-image"
            />
          </div>
          <strong>Compare before you buy.</strong>
          <span>www.pickyourpiece.com</span>
          
          {/* <p>Compare similar rings across brands in seconds.</p> */}
          {/* <div className="reel-cta-button pulse">Compare Similar Rings</div> */}
          {/* <span className="reel-site">pickyourpiece.com</span> */}
        </div>
      )}

      {scene === "storyboard" && (
        <div className="reel-storyboard">
          <div>0-3s Hook</div>
          <div>3-8s Details</div>
          <div>8-13s Reveal</div>
          <div>13-15s CTA</div>
        </div>
      )}
      <div className="reel-film-overlay" />
    </div>
  );
}
