# Analytics Schema

This project sends Google Analytics events through [lib/analytics.ts](lib/analytics.ts).

## Goals

- Keep event names explicit and human-readable.
- Keep category reporting scalable across `ring`, `earrings`, `bracelet`, `pendant`, brand catalogs, and product detail pages.
- Preserve a shared parameter schema so GA explorations and funnels stay consistent.

## Core Model

Every event should answer these questions:

- What happened: `event_name`
- Where it happened: `page_group`, `element_section`
- Which category it belongs to: `catalog_category`
- Which entity was involved: `brand`, `product_id`, `product_name`
- Where it was going: `destination`

## Shared Parameters

These are attached automatically or used broadly across tracked events.

| Parameter | Meaning |
| --- | --- |
| `page_path` | Current pathname |
| `page_location` | Full current URL |
| `page_group` | High-level page type |
| `catalog_category` | Category context for reporting |
| `element_section` | Local UI area where the event happened |
| `element_type` | UI control type such as `cta`, `navigation`, `product_card` |
| `element_label` | Human-readable label for the clicked item |
| `destination` | Link target or route target |
| `brand` | Brand involved in the interaction |
| `product_id` | Product identifier when relevant |
| `product_name` | Product name when relevant |
| `query` | Search term when relevant |

## Page Group Taxonomy

Set automatically in [lib/analytics.ts](lib/analytics.ts) by `getAnalyticsContextFromPath(...)`.

| `page_group` | Meaning |
| --- | --- |
| `home` | Homepage `/` |
| `category_catalog` | Category listing pages such as `/ring`, `/earrings`, `/bracelet`, `/pendant` |
| `brand_catalog` | Brand listing pages under `/brands/*` |
| `product_detail` | Product detail pages under `/product/*` |
| `content` | Articles, guides, and about pages |
| `other` | Fallback for any uncategorized route |

## Catalog Category Taxonomy

Normalized in [lib/analytics.ts](lib/analytics.ts) by `normalizeAnalyticsCategory(...)`.

Allowed values today:

- `home`
- `ring`
- `earrings`
- `bracelet`
- `pendant`
- `content`
- `other`

Notes:

- Product-driven events should pass `data-analytics-category={product.category}` whenever possible.
- Route-driven events fall back to `getAnalyticsContextFromPath(...)`.
- Brand catalogs currently resolve to `ring` because your live brand catalog is ring-first today.

## Event Names

### Brand

- `brand_browse_click`
- `brand_outbound_click`

### Breadcrumb

- `breadcrumb_home_click`
- `breadcrumb_category_click`
- `breadcrumb_brand_click`

### Home

- `home_quick_search_click`
- `home_category_card_click`
- `home_explore_all_categories_click`
- `home_collection_view_all_click`
- `home_collection_product_click`
- `home_brand_strip_view_all_click`
- `home_brand_card_click`
- `home_feature_card_budget_click`
- `home_feature_card_explore_all_click`
- `home_feature_card_finder_click`
- `home_finder_open`
- `home_finder_close`
- `home_finder_back`
- `home_finder_question_answered`

### Catalog and Product Discovery

- `product_card_open`
- `product_preview_detail_click`
- `product_preview_similar_click`

### Navigation

- `navbar_home_click`
- `navbar_category_switch_click`

### Search and Filtering

- `search_focus`
- `search_submit`
- `search_clear`
- `filter_change`
- `price_filter_change`
- `filters_reset`
- `sort_change`

## Filter Event Schema

### `filter_change`

Used for non-price filters such as `brand`, `metal`, `gemstone`, `purity`, `metalColor`, `style`, `occasion`, `gender`, and `diamondQuality`.

Extra parameters:

| Parameter | Meaning |
| --- | --- |
| `filter_key` | The filter that changed |
| `filter_action` | `add`, `remove`, `clear`, `select_all`, or `replace` |
| `changed_values_added` | Values newly added in this interaction |
| `changed_values_removed` | Values removed in this interaction |
| `filter_values` | Final selected values after the change |
| `filter_value_count` | Final selected value count |
| `active_filter_count_after` | Number of active filters after the interaction |

### `price_filter_change`

Used only for price-range updates.

Extra parameters:

| Parameter | Meaning |
| --- | --- |
| `filter_key` | Always `price` |
| `filter_action` | `update_min`, `update_max`, `update_both`, or `reset` |
| `previous_min_price` | Previous minimum |
| `previous_max_price` | Previous maximum |
| `selected_min_price` | New minimum |
| `selected_max_price` | New maximum |
| `active_filter_count_after` | Number of active filters after the change |

## Naming Rules For New Events

- Use explicit names. Do not add generic events like `click` or `ui_click`.
- Prefer `<surface>_<action>_click` for click interactions.
- Prefer `<domain>_<action>` for state changes such as search, filter, and sort.
- Always include `data-analytics-category` when the UI element clearly belongs to a category.
- Reuse the shared parameters instead of inventing one-off field names when possible.

## How To Extend For New Categories

When adding a new category such as `necklace`:

1. Add route mapping in `getAnalyticsContextFromPath(...)`.
2. Add normalization logic in `normalizeAnalyticsCategory(...)`.
3. Pass `data-analytics-category="necklace"` or `product.category` on tracked elements.
4. Keep existing event names if the interaction type is the same.

This keeps GA reports grouped by category without forcing event-name changes for every new category.