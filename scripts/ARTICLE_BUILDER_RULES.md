# Article Builder Rules

Use this file as the single source of truth when creating any new article in this repo.

## 1) Output location and listing behavior

- Always create new article files in `content/articles`.
- File extension must be `.md`.
- Slug is the file name (example: `new-topic-guide.md`).
- To be listed on `/articles`, frontmatter must include all required fields:
	- `title`
	- `description`
	- `category`
	- `topic`
	- `readTime`
	- `image`

## 2) Required frontmatter format

Use this exact structure:

```yaml
---
title: "<SEO title with clear intent and year if relevant>"
description: "<search-intent description with practical buyer outcome>"
category: "<category label>"
topic: "<allowed topic>"
readTime: "<realistic estimate, usually 8-11 min read>"
image: "/heroImage.png"
featured: false
---
```

Notes:

- `featured` is optional. Use only when intended.
- Keep title and description specific to user intent (comparison, budget, how-to, etc).

## 3) Allowed topic values

Use one of:

- `Buying Guides`
- `Diamond Education`
- `Gold & Metals`
- `Gemstones`
- `Jewellery Care`
- `Engagement`
- `Wedding`
- `Trending`
- `Brand Comparison`

## 3.1) Chip consistency and categorization

- Article chips in UI use `topic` as the category label.
- Keep `topic` strictly within the allowed topic list above.
- Keep `category` aligned with the same taxonomy family as `topic` (avoid one-off labels that conflict with topic chips).
- Preferred default for consistency: set `category` equal to `topic` unless there is a strong editorial reason not to.

## 4) Standard article structure

Every article should follow this order:

1. H1 title line
2. Intro (problem + promise)
3. Quick Answer section
4. Numbered core sections (`## 1. ...`, `## 2. ...`)
5. At least one comparison table where relevant
6. Common mistakes section
7. Fast decision framework section (for example "60-Second Decision Framework")
8. FAQ section (4-6 practical questions)
9. Final thoughts section
10. Final CTA with relevant catalog link

Use `---` separators between major blocks.

## 5) Readability and UX standards

- Short paragraphs (2-3 lines).
- Prefer bullet points and checklists over dense blocks.
- Use clear buying language and direct recommendations.
- Keep section headers skimmable and intent-focused.
- Avoid generic filler.

## 6) SEO standards

- Put primary keyword in:
	- title
	- intro
	- at least one heading
- Cover both informational and transactional intent.
- Include semantic related phrases naturally.
- Keep copy useful first, optimized second.

## 7) Internal article linking rules

- Add 3-8 relevant internal article links.
- Use descriptive anchor text.
- Link only when contextually meaningful.
- Prefer linking to core guides (budget, metal comparison, shape guide, sizing).

## 8) Product catalog linking rules (critical)

- Do not use `/ring?q=...` links.
- Use explicit filter params in `/ring?...`.
- Every `/ring?...` link in articles must include `sort=price-desc`.
- Keep UTM params for article attribution on all product links:
	- `utm_source=internal_article`
	- `utm_medium=article`
	- `utm_campaign=<article_slug_or_campaign_name>`
	- `utm_content=<section_specific_identifier>`

Example pattern:

```text
/ring?sort=price-desc&occasion=Engagement&style=Solitaire&utm_source=internal_article&utm_medium=article&utm_campaign=example_campaign&utm_content=quick_answer
```

## 9) Query-to-filter mapping policy

When converting search intent phrases into ring links, map to filter params (not `q`).

Also append `sort=price-desc` on every mapped `/ring?...` URL.

Examples:

- `solitaire engagement ring` -> `occasion=Engagement&style=Solitaire&gemstone=Solitaire`
- `halo engagement ring` -> `occasion=Engagement&style=Halo&gemstone=Diamond`
- `gold ring` -> `metal=Gold&metalColor=Gold`
- `rose gold ring` -> `metal=Gold&metalColor=Rose%20Gold`
- `platinum ring` -> `metal=Platinum&metalColor=Platinum&purity=Platinum950`
- `engagement ring under 50000` -> `occasion=Engagement&maxPrice=50000`
- `engagement ring 50000 to 150000` -> `occasion=Engagement&minPrice=50000&maxPrice=150000`

## 10) Conversion placement rules

Include product links at high-intent moments:

- Quick answer
- Core comparison section
- Budget/value section
- Relevant FAQ answers
- Final CTA

## 11) Content quality checklist

Before finalizing, verify:

- Frontmatter is complete and valid.
- Topic value is allowed.
- No `/ring?q=` links exist.
- Product links use explicit filters and include UTM params.
- Every article product link includes `sort=price-desc`.
- Structure includes mistakes + framework + FAQ + final CTA.
- Grammar and formatting are clean.

## 12) SVG direction rule for article visuals

If an article-specific SVG is needed:

- Keep it clean, sleek, modern, minimal.
- Use consistent stroke width and layout language.
- Match motif to topic (budget, diamonds, metals, sizing, style comparison).
- Avoid visual clutter and keep mobile readability.

## 13) Prompt template for creating a new article

Use this prompt format:

```text
Create a new article using scripts/ARTICLE_BUILDER_RULES.md.

Topic: <topic>
Primary keyword: <keyword>
Target slug: <slug>
Intent: <informational/comparison/budget/how-to>
Audience: <who this is for>

Requirements:
- Follow all structure, SEO, and link rules from ARTICLE_BUILDER_RULES.md.
- Add internal links to relevant existing articles.
- Use only /ring filter links (no q).
- Add `sort=price-desc` to all product links.
- Add UTM params to all product links.
- Ensure it is valid and appears on /articles.
```

