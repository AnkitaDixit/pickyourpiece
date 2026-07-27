export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEventName =
  | "brand_browse_click"
  | "brand_outbound_click"
  | "breadcrumb_brand_click"
  | "breadcrumb_category_click"
  | "breadcrumb_home_click"
  | "filter_change"
  | "price_filter_change"
  | "filters_reset"
  | "home_brand_card_click"
  | "home_brand_strip_view_all_click"
  | "home_category_card_click"
  | "home_collection_product_click"
  | "home_collection_view_all_click"
  | "home_explore_all_categories_click"
  | "home_quick_search_click"
  | "navbar_category_switch_click"
  | "navbar_home_click"
  | "product_card_open"
  | "product_preview_detail_click"
  | "product_preview_similar_click"
  | "search_clear"
  | "search_focus"
  | "search_submit"
  | "sort_change";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsContext = {
  page_group: string;
  catalog_category: string;
};

function normalizeParamValue(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeAnalyticsCategory(value: string | null | undefined): string | undefined {
  const normalized = normalizeParamValue(value)?.toLowerCase();
  if (!normalized) return undefined;

  if (normalized.includes("earring")) return "earrings";
  if (normalized.includes("bracelet")) return "bracelet";
  if (normalized.includes("pendant")) return "pendant";
  if (normalized.includes("ring")) return "ring";

  return normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function getAnalyticsContextFromPath(pathname: string): AnalyticsContext {
  if (pathname === "/") {
    return { page_group: "home", catalog_category: "home" };
  }

  if (pathname.startsWith("/ring")) {
    return { page_group: "category_catalog", catalog_category: "ring" };
  }

  if (pathname.startsWith("/earrings")) {
    return { page_group: "category_catalog", catalog_category: "earrings" };
  }

  if (pathname.startsWith("/bracelet")) {
    return { page_group: "category_catalog", catalog_category: "bracelet" };
  }

  if (pathname.startsWith("/pendant")) {
    return { page_group: "category_catalog", catalog_category: "pendant" };
  }

  if (pathname.startsWith("/brands/")) {
    return { page_group: "brand_catalog", catalog_category: "ring" };
  }

  if (pathname.startsWith("/product/")) {
    return { page_group: "product_detail", catalog_category: "ring" };
  }

  if (pathname.startsWith("/articles") || pathname.startsWith("/guides") || pathname.startsWith("/about")) {
    return { page_group: "content", catalog_category: "content" };
  }

  return { page_group: "other", catalog_category: "other" };
}

function sanitizeParams(params: AnalyticsParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== "") as Array<
      [string, string | number | boolean]
    >
  );
}

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const derivedContext = getAnalyticsContextFromPath(window.location.pathname);

  window.gtag("event", eventName, sanitizeParams({
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_group: derivedContext.page_group,
    catalog_category: derivedContext.catalog_category,
    ...params,
  }));
}

export function trackDataClick(element: HTMLElement) {
  const eventName = normalizeParamValue(element.dataset.analyticsEvent);
  if (!eventName) return;
  const label = normalizeParamValue(element.dataset.analyticsLabel);
  const section = normalizeParamValue(element.dataset.analyticsSection);
  const type = normalizeParamValue(element.dataset.analyticsType);
  const destination = normalizeParamValue(element.dataset.analyticsDestination);
  const brand = normalizeParamValue(element.dataset.analyticsBrand);
  const productId = normalizeParamValue(element.dataset.analyticsProductId);
  const productName = normalizeParamValue(element.dataset.analyticsProductName);
  const query = normalizeParamValue(element.dataset.analyticsQuery);
  const category = normalizeAnalyticsCategory(element.dataset.analyticsCategory);

  trackEvent(eventName as AnalyticsEventName, {
    element_label: label,
    element_section: section,
    element_type: type,
    destination,
    brand,
    product_id: productId,
    product_name: productName,
    query,
    catalog_category: category,
  });
}