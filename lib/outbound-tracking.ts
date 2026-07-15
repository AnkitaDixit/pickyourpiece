type OutboundContext = "preview_panel" | "product_detail";

type BuildTrackedBrandUrlOptions = {
  context: OutboundContext;
  brand?: string;
  productId?: string;
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildTrackedBrandUrl(rawUrl: string, options: BuildTrackedBrandUrlOptions): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return rawUrl;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return rawUrl;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return rawUrl;
  }

  parsed.searchParams.set("utm_source", "pickyourpiece");
  parsed.searchParams.set("utm_medium", "referral");
  parsed.searchParams.set("utm_campaign", "brand_redirect_pyp");
  parsed.searchParams.set("utm_content", options.context);
  parsed.searchParams.set("utm_term", "pyp");

  parsed.searchParams.set("pyp_ref", "pyp");
  parsed.searchParams.set("pyp_ref_full", "pickyourpiece");
  parsed.searchParams.set("pyp_context", options.context);

  if (options.brand) {
    const normalizedBrand = normalizeToken(options.brand);
    if (normalizedBrand) {
      parsed.searchParams.set("pyp_brand", normalizedBrand);
    }
  }

  if (options.productId) {
    const normalizedProductId = options.productId.trim();
    if (normalizedProductId) {
      parsed.searchParams.set("pyp_product_id", normalizedProductId);
    }
  }

  return parsed.toString();
}
