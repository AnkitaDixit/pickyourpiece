type VisualGlyph =
  | "ring"
  | "budget"
  | "engagementBudget"
  | "coinStack"
  | "tag"
  | "metals"
  | "ruler"
  | "lab"
  | "diamond"
  | "rose"
  | "size"
  | "halo"
  | "comparison"
  | "vintageFrame"
  | "minimalLine"
  | "trendArrow"
  | "checklist"
  | "warning"
  | "splitRings"
  | "promiseBand"
  | "timeline"
  | "certification"
  | "smallHand"
  | "bigLook"
  | "fluorescence"
  | "mythBurst";

type VisualSpec = {
  label: string;
  sublabel: string;
  glyph: VisualGlyph;
  bgStart: string;
  bgEnd: string;
  accent: string;
  accentSoft: string;
};

function buildLabelLines(label: string): string[] {
  const normalized = label.trim();
  if (!normalized) return ["JEWELLERY ARTICLE"];

  if (normalized.includes(" VS ")) {
    const [left, right] = normalized.split(" VS ");
    if (left && right) {
      return [left, `VS ${right}`];
    }
  }

  if (normalized.length <= 22) {
    return [normalized];
  }

  const words = normalized.split(" ");
  if (words.length < 2) {
    return [normalized.slice(0, 22), normalized.slice(22).trim()].filter(Boolean);
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")].filter(Boolean);
}

type BrandPalette = {
  bg: string;
  accent: string;
};

const BRAND_VISUAL_PALETTES: Record<string, BrandPalette> = {
  bluestone: { bg: "#e8f1ff", accent: "#1d4ed8" },
  caratlane: { bg: "#ffeef8", accent: "#be185d" },
  candere: { bg: "#fff4ea", accent: "#c2410c" },
  giva: { bg: "#edf7ff", accent: "#0f766e" },
  mia: { bg: "#f7f1ff", accent: "#7c3aed" },
  palmonas: { bg: "#fff3f8", accent: "#db2777" },
  tanishq: { bg: "#fff7df", accent: "#a16207" },
};

function toWords(token: string): string {
  return token
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeBrandToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z]/g, "");
}

function buildComparisonSpecFromSlug(slug: string): VisualSpec | null {
  if (!slug.includes("-vs-")) {
    return null;
  }

  const [leftRaw, rightRaw] = slug.split("-vs-");
  const leftKey = normalizeBrandToken(leftRaw ?? "");
  const rightKey = normalizeBrandToken(rightRaw ?? "");
  const leftPalette = BRAND_VISUAL_PALETTES[leftKey];
  const rightPalette = BRAND_VISUAL_PALETTES[rightKey];

  if (!leftPalette || !rightPalette) {
    return null;
  }

  const left = toWords(leftRaw ?? "");
  const right = toWords(rightRaw ?? "");

  if (!left || !right) {
    return null;
  }

  return {
    label: `${left.toUpperCase()} VS ${right.toUpperCase()}`,
    sublabel: "BRAND COMPARISON",
    glyph: "comparison",
    bgStart: leftPalette.bg,
    bgEnd: rightPalette.bg,
    accent: leftPalette.accent,
    accentSoft: rightPalette.accent,
  };
}

const COLOR = {
  surfaceImageStart: "var(--color-surface-image-start)",
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryLight: "var(--color-primary-light)",
  primarySoft: "var(--color-primary-soft)",
  primarySoftStrong: "var(--color-primary-soft-strong)",
  text: "var(--color-text)",
  textSecondary: "var(--color-text-secondary)",
  white: "var(--color-white)",
} as const;

const ARTICLE_VISUALS: Record<string, VisualSpec> = {
  "how-to-choose-engagement-ring": {
    label: "ENGAGEMENT GUIDE",
    sublabel: "2026 EDITION",
    glyph: "ring",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.primaryLight,
    accent: COLOR.primaryHover,
    accentSoft: COLOR.primary,
  },
  "engagement-ring-budget": {
    label: "BUDGET FRAMEWORK",
    sublabel: "SMART PLANNING",
    glyph: "budget",
    bgStart: COLOR.primaryLight,
    bgEnd: COLOR.primarySoft,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoftStrong,
  },
  "engagement-rings-under-25000": {
    label: "ENGAGEMENT RINGS",
    sublabel: "UNDER 25K",
    glyph: "engagementBudget",
    bgStart: "#fde7ef",
    bgEnd: "#fcefc8",
    accent: "#b4235f",
    accentSoft: "#d97706",
  },
  "engagement-rings-under-50000": {
    label: "ENGAGEMENT RINGS",
    sublabel: "UNDER 50K",
    glyph: "coinStack",
    bgStart: "#ffe8ec",
    bgEnd: "#ffefd6",
    accent: "#be123c",
    accentSoft: "#c2410c",
  },
  "engagement-rings-under-1-lakh": {
    label: "ENGAGEMENT RINGS",
    sublabel: "UNDER 1 LAKH",
    glyph: "tag",
    bgStart: "#eef2ff",
    bgEnd: "#e9fbff",
    accent: "#3730a3",
    accentSoft: "#0f766e",
  },
  "best-solitaire-engagement-rings": {
    label: "BEST SOLITAIRE",
    sublabel: "ENGAGEMENT PICKS",
    glyph: "ring",
    bgStart: "#fef3f2",
    bgEnd: "#fff4dd",
    accent: "#9f1239",
    accentSoft: "#b45309",
  },
  "best-halo-engagement-rings": {
    label: "BEST HALO",
    sublabel: "ENGAGEMENT PICKS",
    glyph: "halo",
    bgStart: "#ecfeff",
    bgEnd: "#eff6ff",
    accent: "#0e7490",
    accentSoft: "#1d4ed8",
  },
  "best-vintage-engagement-rings": {
    label: "BEST VINTAGE",
    sublabel: "ENGAGEMENT PICKS",
    glyph: "vintageFrame",
    bgStart: "#fef7e6",
    bgEnd: "#fdf2f8",
    accent: "#92400e",
    accentSoft: "#be185d",
  },
  "best-minimal-engagement-rings": {
    label: "BEST MINIMAL",
    sublabel: "ENGAGEMENT PICKS",
    glyph: "minimalLine",
    bgStart: "#f8fafc",
    bgEnd: "#edf2f7",
    accent: "#334155",
    accentSoft: "#0891b2",
  },
  "engagement-ring-trends-2026": {
    label: "RING TRENDS",
    sublabel: "2026 EDITION",
    glyph: "trendArrow",
    bgStart: "#eef2ff",
    bgEnd: "#fce7f3",
    accent: "#4338ca",
    accentSoft: "#db2777",
  },
  "engagement-ring-shopping-checklist": {
    label: "SHOPPING CHECKLIST",
    sublabel: "STEP BY STEP",
    glyph: "checklist",
    bgStart: "#ecfdf5",
    bgEnd: "#f0fdfa",
    accent: "#0f766e",
    accentSoft: "#047857",
  },
  "mistakes-to-avoid-when-buying-an-engagement-ring": {
    label: "AVOID MISTAKES",
    sublabel: "ENGAGEMENT BUYING",
    glyph: "warning",
    bgStart: "#fff7ed",
    bgEnd: "#fef2f2",
    accent: "#c2410c",
    accentSoft: "#b91c1c",
  },
  "proposal-ring-vs-engagement-ring": {
    label: "PROPOSAL VS",
    sublabel: "ENGAGEMENT RING",
    glyph: "splitRings",
    bgStart: "#eef2ff",
    bgEnd: "#f5f3ff",
    accent: "#3730a3",
    accentSoft: "#7c3aed",
  },
  "promise-ring-vs-engagement-ring": {
    label: "PROMISE VS",
    sublabel: "ENGAGEMENT RING",
    glyph: "promiseBand",
    bgStart: "#fff1f2",
    bgEnd: "#fdf4ff",
    accent: "#be123c",
    accentSoft: "#a21caf",
  },
  "how-much-should-an-engagement-ring-cost": {
    label: "RING COST GUIDE",
    sublabel: "HOW MUCH TO SPEND",
    glyph: "budget",
    bgStart: "#fff7ed",
    bgEnd: "#ecfeff",
    accent: "#b45309",
    accentSoft: "#0f766e",
  },
  "engagement-ring-buying-timeline": {
    label: "BUYING TIMELINE",
    sublabel: "WEEK BY WEEK",
    glyph: "timeline",
    bgStart: "#eff6ff",
    bgEnd: "#f5f3ff",
    accent: "#1d4ed8",
    accentSoft: "#6d28d9",
  },
  "diamond-certification-gia-vs-igi": {
    label: "GIA VS IGI",
    sublabel: "CERTIFICATION GUIDE",
    glyph: "certification",
    bgStart: "#eaf2ff",
    bgEnd: "#eefcf7",
    accent: "#1d4ed8",
    accentSoft: "#0f766e",
  },
  "best-diamond-shape-for-small-hands": {
    label: "BEST SHAPE",
    sublabel: "FOR SMALL HANDS",
    glyph: "smallHand",
    bgStart: "#fef2f2",
    bgEnd: "#f5f3ff",
    accent: "#be185d",
    accentSoft: "#6d28d9",
  },
  "which-diamond-looks-biggest": {
    label: "BIGGEST LOOK",
    sublabel: "DIAMOND GUIDE",
    glyph: "bigLook",
    bgStart: "#eef2ff",
    bgEnd: "#fff7ed",
    accent: "#4338ca",
    accentSoft: "#b45309",
  },
  "diamond-fluorescence-explained": {
    label: "FLUORESCENCE",
    sublabel: "EXPLAINED",
    glyph: "fluorescence",
    bgStart: "#ecfeff",
    bgEnd: "#eef2ff",
    accent: "#0e7490",
    accentSoft: "#6366f1",
  },
  "diamond-myths-debunked": {
    label: "DIAMOND MYTHS",
    sublabel: "DEBUNKED",
    glyph: "mythBurst",
    bgStart: "#fff7ed",
    bgEnd: "#fef2f2",
    accent: "#c2410c",
    accentSoft: "#b91c1c",
  },
  "gold-vs-platinum": {
    label: "METAL COMPARISON",
    sublabel: "GOLD VS PLATINUM",
    glyph: "metals",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.surfaceImageStart,
    accent: COLOR.primaryHover,
    accentSoft: COLOR.primarySoftStrong,
  },
  "how-to-measure-ring-size-at-home": {
    label: "AT HOME GUIDE",
    sublabel: "PRECISION FIT",
    glyph: "ruler",
    bgStart: COLOR.primaryLight,
    bgEnd: COLOR.primarySoft,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoftStrong,
  },
  "lab-diamond-guide": {
    label: "LAB DIAMONDS",
    sublabel: "MODERN BUYER",
    glyph: "lab",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.surfaceImageStart,
    accent: COLOR.primaryHover,
    accentSoft: COLOR.primarySoftStrong,
  },
  "diamond-shapes-guide": {
    label: "DIAMOND SHAPES",
    sublabel: "CUT REFERENCE",
    glyph: "diamond",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.primaryLight,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoftStrong,
  },
  "rose-gold-guide": {
    label: "ROSE GOLD",
    sublabel: "TONE GUIDE",
    glyph: "rose",
    bgStart: COLOR.primaryLight,
    bgEnd: COLOR.primarySoft,
    accent: COLOR.primaryHover,
    accentSoft: COLOR.primary,
  },
  "ring-size-guide": {
    label: "RING SIZE",
    sublabel: "FIT GUIDE",
    glyph: "size",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.primaryLight,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoftStrong,
  },
  "solitaire-vs-halo": {
    label: "SOLITAIRE VS HALO",
    sublabel: "STYLE GUIDE",
    glyph: "halo",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.primaryLight,
    accent: COLOR.primaryHover,
    accentSoft: COLOR.primarySoftStrong,
  },
  "9kt-vs-14kt-vs-18kt-gold": {
    label: "9KT VS 14KT VS 18KT",
    sublabel: "GOLD COMPARISON",
    glyph: "metals",
    bgStart: "#fff7e8",
    bgEnd: "#fff1f2",
    accent: "#a16207",
    accentSoft: "#be123c",
  },
  "14kt-vs-18kt-gold": {
    label: "14KT VS 18KT",
    sublabel: "PURITY SHOWDOWN",
    glyph: "splitRings",
    bgStart: "#fff7ed",
    bgEnd: "#fef2f2",
    accent: "#c2410c",
    accentSoft: "#be185d",
  },
  "white-gold-vs-yellow-gold": {
    label: "WHITE GOLD VS",
    sublabel: "YELLOW GOLD",
    glyph: "comparison",
    bgStart: "#eff6ff",
    bgEnd: "#fef3c7",
    accent: "#1d4ed8",
    accentSoft: "#b45309",
  },
  "white-gold-vs-platinum": {
    label: "WHITE GOLD VS",
    sublabel: "PLATINUM",
    glyph: "minimalLine",
    bgStart: "#f8fafc",
    bgEnd: "#e2e8f0",
    accent: "#334155",
    accentSoft: "#0f766e",
  },
  "rose-gold-vs-yellow-gold": {
    label: "ROSE GOLD VS",
    sublabel: "YELLOW GOLD",
    glyph: "rose",
    bgStart: "#fff1f2",
    bgEnd: "#fff7ed",
    accent: "#be123c",
    accentSoft: "#b45309",
  },
  "which-gold-is-best-for-engagement-rings": {
    label: "BEST GOLD",
    sublabel: "FOR ENGAGEMENT",
    glyph: "ring",
    bgStart: "#fff7ed",
    bgEnd: "#fef2f2",
    accent: "#b45309",
    accentSoft: "#be123c",
  },
  "which-gold-is-best-for-daily-wear": {
    label: "BEST GOLD",
    sublabel: "FOR DAILY WEAR",
    glyph: "size",
    bgStart: "#ecfdf5",
    bgEnd: "#eef2ff",
    accent: "#0f766e",
    accentSoft: "#4338ca",
  },
  "is-9kt-gold-worth-buying": {
    label: "IS 9KT WORTH IT?",
    sublabel: "VALUE CHECK",
    glyph: "coinStack",
    bgStart: "#fff7ed",
    bgEnd: "#fef3c7",
    accent: "#c2410c",
    accentSoft: "#a16207",
  },
  "is-14kt-gold-better-than-18kt": {
    label: "14KT BETTER",
    sublabel: "THAN 18KT?",
    glyph: "tag",
    bgStart: "#fefce8",
    bgEnd: "#fff7ed",
    accent: "#a16207",
    accentSoft: "#c2410c",
  },
  "does-white-gold-fade": {
    label: "WHITE GOLD FADE",
    sublabel: "FACT CHECK",
    glyph: "timeline",
    bgStart: "#eff6ff",
    bgEnd: "#f8fafc",
    accent: "#1d4ed8",
    accentSoft: "#64748b",
  },
  "hallmark-gold-explained": {
    label: "HALLMARK GOLD",
    sublabel: "EXPLAINED",
    glyph: "certification",
    bgStart: "#ecfeff",
    bgEnd: "#eef2ff",
    accent: "#0e7490",
    accentSoft: "#4f46e5",
  },
  "gold-purity-guide": {
    label: "GOLD PURITY",
    sublabel: "KT GUIDE",
    glyph: "checklist",
    bgStart: "#fefce8",
    bgEnd: "#fff7ed",
    accent: "#a16207",
    accentSoft: "#b45309",
  },
  "what-is-925-silver": {
    label: "WHAT IS 925",
    sublabel: "SILVER EXPLAINED",
    glyph: "certification",
    bgStart: "#f8fafc",
    bgEnd: "#e2e8f0",
    accent: "#334155",
    accentSoft: "#64748b",
  },
  "sterling-silver-vs-pure-silver": {
    label: "STERLING VS",
    sublabel: "PURE SILVER",
    glyph: "comparison",
    bgStart: "#eff6ff",
    bgEnd: "#f8fafc",
    accent: "#1d4ed8",
    accentSoft: "#64748b",
  },
  "silver-vs-white-gold": {
    label: "SILVER VS",
    sublabel: "WHITE GOLD",
    glyph: "splitRings",
    bgStart: "#f1f5f9",
    bgEnd: "#eef2ff",
    accent: "#475569",
    accentSoft: "#4f46e5",
  },
  "best-silver-rings": {
    label: "BEST SILVER",
    sublabel: "RING PICKS",
    glyph: "ring",
    bgStart: "#f8fafc",
    bgEnd: "#eef2ff",
    accent: "#334155",
    accentSoft: "#6366f1",
  },
  "best-silver-jewellery-brands": {
    label: "BEST SILVER",
    sublabel: "JEWELLERY BRANDS",
    glyph: "trendArrow",
    bgStart: "#f8fafc",
    bgEnd: "#ecfeff",
    accent: "#0f766e",
    accentSoft: "#334155",
  },
  "does-silver-tarnish": {
    label: "SILVER TARNISH",
    sublabel: "FACT CHECK",
    glyph: "timeline",
    bgStart: "#f8fafc",
    bgEnd: "#e2e8f0",
    accent: "#475569",
    accentSoft: "#0f766e",
  },
  "how-to-clean-silver-jewellery": {
    label: "CLEAN SILVER",
    sublabel: "CARE GUIDE",
    glyph: "checklist",
    bgStart: "#ecfeff",
    bgEnd: "#f1f5f9",
    accent: "#0e7490",
    accentSoft: "#64748b",
  },
  "is-silver-good-for-daily-wear": {
    label: "SILVER FOR",
    sublabel: "DAILY WEAR",
    glyph: "size",
    bgStart: "#f1f5f9",
    bgEnd: "#eef2ff",
    accent: "#334155",
    accentSoft: "#4338ca",
  },
  "is-silver-waterproof": {
    label: "IS SILVER",
    sublabel: "WATERPROOF?",
    glyph: "warning",
    bgStart: "#ecfeff",
    bgEnd: "#eef2ff",
    accent: "#0e7490",
    accentSoft: "#1d4ed8",
  },
  "how-long-does-silver-jewellery-last": {
    label: "SILVER LIFESPAN",
    sublabel: "LONGEVITY GUIDE",
    glyph: "minimalLine",
    bgStart: "#f8fafc",
    bgEnd: "#e5e7eb",
    accent: "#374151",
    accentSoft: "#0f766e",
  },
};

function renderVisualGlyph(glyph: VisualGlyph, accent: string, accentSoft: string) {
  switch (glyph) {
    case "certification":
      return (
        <g transform="translate(206 114)">
          <rect x="26" y="22" width="126" height="156" rx="16" fill="none" stroke={accent} strokeWidth="5" />
          <rect x="170" y="22" width="126" height="156" rx="16" fill="none" stroke={accentSoft} strokeWidth="5" />
          <text x="89" y="64" textAnchor="middle" fill={accent} fontSize="18" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">GIA</text>
          <text x="233" y="64" textAnchor="middle" fill={accentSoft} fontSize="18" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">IGI</text>
          <path d="M62 92H116M62 114H116M62 136H104" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M206 92H260M206 114H260M206 136H248" stroke={accentSoft} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "smallHand":
      return (
        <g transform="translate(210 118)">
          <path d="M64 168C54 126 54 84 78 64C102 44 136 56 150 84C166 62 196 56 216 76C238 98 236 132 220 166" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="150" cy="82" rx="22" ry="14" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M144 58L150 48L156 58L152 66H148L144 58Z" fill="none" stroke={accentSoft} strokeWidth="3" />
        </g>
      );
    case "bigLook":
      return (
        <g transform="translate(206 124)">
          <path d="M46 134H266" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M46 134L64 116M46 134L64 152" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M266 134L248 116M266 134L248 152" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M132 84L156 58L180 84L166 104H146L132 84Z" fill="none" stroke={accentSoft} strokeWidth="4" />
          <circle cx="156" cy="84" r="44" fill="none" stroke={accentSoft} strokeWidth="3" strokeDasharray="4 8" />
        </g>
      );
    case "fluorescence":
      return (
        <g transform="translate(216 120)">
          <path d="M42 116L88 70L134 116L114 152H62L42 116Z" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M190 44V84M170 64H210" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
          <circle cx="190" cy="64" r="28" fill="none" stroke={accentSoft} strokeWidth="3" strokeDasharray="2 7" />
          <path d="M230 122C208 132 186 142 170 160" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "mythBurst":
      return (
        <g transform="translate(214 122)">
          <path d="M94 24L108 58L146 52L126 84L158 106L122 116L128 154L94 134L60 154L66 116L30 106L62 84L42 52L80 58Z" fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" />
          <text x="94" y="110" textAnchor="middle" fill={accentSoft} fontSize="24" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">MYTH</text>
          <path d="M174 92L250 92" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
          <path d="M174 112L230 112" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "coinStack":
      return (
        <g transform="translate(228 118)">
          <ellipse cx="78" cy="124" rx="64" ry="20" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M14 124V90C14 101 42 110 78 110C114 110 142 101 142 90V124" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M14 98C14 109 42 118 78 118C114 118 142 109 142 98" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M14 84C14 95 42 104 78 104C114 104 142 95 142 84" fill="none" stroke={accentSoft} strokeWidth="4" />
          <text x="206" y="102" fill={accent} fontSize="26" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">50K</text>
        </g>
      );
    case "tag":
      return (
        <g transform="translate(210 112)">
          <path d="M40 46H188L244 102L188 158H40V46Z" fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="72" cy="102" r="10" fill="none" stroke={accentSoft} strokeWidth="4" />
          <text x="124" y="112" fill={accentSoft} fontSize="28" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">1L</text>
        </g>
      );
    case "vintageFrame":
      return (
        <g transform="translate(214 120)">
          <rect x="18" y="18" width="176" height="126" rx="16" fill="none" stroke={accent} strokeWidth="5" />
          <rect x="36" y="36" width="140" height="90" rx="12" fill="none" stroke={accentSoft} strokeWidth="3" strokeDasharray="3 9" />
          <circle cx="106" cy="80" r="16" fill="none" stroke={accent} strokeWidth="4" />
          <path d="M96 162H116" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "minimalLine":
      return (
        <g transform="translate(212 132)">
          <path d="M22 116H250" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="136" cy="80" r="18" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M126 70L136 58L146 70" fill="none" stroke={accent} strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
    case "trendArrow":
      return (
        <g transform="translate(206 124)">
          <path d="M26 136L88 92L132 118L214 52" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M196 52H214V70" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="88" cy="92" r="8" fill={accentSoft} />
          <circle cx="132" cy="118" r="8" fill={accentSoft} />
        </g>
      );
    case "checklist":
      return (
        <g transform="translate(214 116)">
          <rect x="30" y="20" width="182" height="154" rx="18" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M56 60L66 70L82 52" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 94L66 104L82 86" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 128L66 138L82 120" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M98 62H184M98 96H184M98 130H184" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "warning":
      return (
        <g transform="translate(224 116)">
          <path d="M96 22L194 184H-2L96 22Z" fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" />
          <path d="M96 84V128" stroke={accentSoft} strokeWidth="6" strokeLinecap="round" />
          <circle cx="96" cy="154" r="6" fill={accentSoft} />
        </g>
      );
    case "splitRings":
      return (
        <g transform="translate(208 122)">
          <ellipse cx="78" cy="120" rx="52" ry="34" fill="none" stroke={accent} strokeWidth="6" />
          <ellipse cx="210" cy="120" rx="52" ry="34" fill="none" stroke={accentSoft} strokeWidth="6" />
          <text x="144" y="124" textAnchor="middle" fill={COLOR.text} fontSize="16" fontWeight="700" fontFamily="'Trebuchet MS', Verdana, sans-serif">VS</text>
          <path d="M68 72L78 56L88 72L82 84H74L68 72Z" fill="none" stroke={accent} strokeWidth="3" />
          <path d="M200 72L210 56L220 72L214 84H206L200 72Z" fill="none" stroke={accentSoft} strokeWidth="3" />
        </g>
      );
    case "promiseBand":
      return (
        <g transform="translate(220 126)">
          <path d="M38 122C62 90 114 90 138 122" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          <path d="M154 122C178 90 230 90 254 122" fill="none" stroke={accentSoft} strokeWidth="6" strokeLinecap="round" />
          <path d="M146 78C152 62 174 62 180 78" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
          <path d="M148 78C142 62 120 62 114 78" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M146 78L162 96L178 78" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "timeline":
      return (
        <g transform="translate(212 130)">
          <path d="M24 108H264" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="54" cy="108" r="8" fill={accentSoft} />
          <circle cx="124" cy="108" r="8" fill={accentSoft} />
          <circle cx="194" cy="108" r="8" fill={accentSoft} />
          <circle cx="254" cy="108" r="8" fill={accentSoft} />
          <path d="M54 88V64M124 88V54M194 88V64M254 88V54" stroke={accentSoft} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "engagementBudget":
      return (
        <g transform="translate(0 0)">
          <ellipse cx="298" cy="246" rx="76" ry="46" fill="none" stroke={accentSoft} strokeWidth="6" />
          <path d="M278 184L298 162L318 184L307 204H289L278 184Z" fill="none" stroke={accent} strokeWidth="3.5" />
          <path d="M278 184H318" stroke={accent} strokeWidth="3" />
          <path d="M289 204L298 162L307 204" stroke={accent} strokeWidth="3" fill="none" />

          <rect x="360" y="176" width="118" height="76" rx="14" fill={COLOR.white} fillOpacity="0.35" stroke={accent} strokeWidth="3" />
          <circle cx="380" cy="198" r="8" fill="none" stroke={accentSoft} strokeWidth="3" />
          <path d="M388 198H402" stroke={accentSoft} strokeWidth="3" strokeLinecap="round" />
          <text
            x="418"
            y="220"
            textAnchor="middle"
            fill={accent}
            fontSize="24"
            fontWeight="700"
            letterSpacing="0.8"
            fontFamily="'Trebuchet MS', Verdana, sans-serif"
          >
            25K
          </text>
        </g>
      );
    case "budget":
      return (
        <g transform="translate(250 132)">
          <rect x="-48" y="10" width="136" height="86" rx="14" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M-22 44H62" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
          <circle cx="20" cy="52" r="16" fill="none" stroke={accent} strokeWidth="4" />
          <path d="M20 42V62" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "metals":
      return (
        <g transform="translate(246 134)">
          <rect x="0" y="14" width="64" height="88" rx="10" fill="none" stroke={accentSoft} strokeWidth="5" />
          <rect x="84" y="14" width="64" height="88" rx="10" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M24 44H40M24 62H40M108 44H124M108 62H124" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "ruler":
      return (
        <g transform="translate(214 140)">
          <rect x="0" y="20" width="212" height="52" rx="12" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M28 20V48M50 20V40M72 20V48M94 20V40M116 20V48M138 20V40M160 20V48M182 20V40" stroke={accentSoft} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "lab":
      return (
        <g transform="translate(248 126)">
          <path d="M26 24H126M62 24V70L24 130H128L90 70V24" fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" />
          <path d="M42 104H108" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" />
          <circle cx="76" cy="90" r="10" fill="none" stroke={accentSoft} strokeWidth="3" />
        </g>
      );
    case "diamond":
      return (
        <g transform="translate(232 128)">
          <path d="M34 56L72 24L110 56L90 94H54L34 56Z" fill="none" stroke={accent} strokeWidth="4" />
          <path d="M140 58L174 30L208 58L190 92H158L140 58Z" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M250 60L286 26L322 60L304 98H268L250 60Z" fill="none" stroke={accent} strokeWidth="4" />
        </g>
      );
    case "rose":
      return (
        <g transform="translate(254 126)">
          <path d="M52 120V64" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M52 86C26 82 18 108 30 122" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M52 84C80 78 92 102 78 118" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M52 24C34 24 22 38 22 52C22 68 36 78 52 78C68 78 82 68 82 52C82 38 70 24 52 24Z" fill="none" stroke={accent} strokeWidth="5" />
        </g>
      );
    case "size":
      return (
        <g transform="translate(234 132)">
          <ellipse cx="86" cy="78" rx="70" ry="48" fill="none" stroke={accent} strokeWidth="6" />
          <path d="M180 22L240 22L240 78" fill="none" stroke={accentSoft} strokeWidth="4" />
          <path d="M172 30L180 22L172 14M232 70L240 78L248 70" fill="none" stroke={accentSoft} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "halo":
      return (
        <g transform="translate(234 130)">
          <circle cx="86" cy="56" r="18" fill="none" stroke={accent} strokeWidth="5" />
          <circle cx="86" cy="56" r="36" fill="none" stroke={accentSoft} strokeWidth="4" strokeDasharray="2 8" />
          <ellipse cx="86" cy="116" rx="72" ry="40" fill="none" stroke={accent} strokeWidth="6" />
        </g>
      );
    case "comparison":
      return (
        <g transform="translate(170 110)">
          <rect x="0" y="10" width="138" height="176" rx="20" fill={COLOR.white} fillOpacity="0.2" stroke={accentSoft} strokeWidth="3.5" />
          <rect x="162" y="10" width="138" height="176" rx="20" fill={COLOR.white} fillOpacity="0.2" stroke={accent} strokeWidth="3.5" />

          <rect x="18" y="28" width="102" height="10" rx="5" fill={accentSoft} fillOpacity="0.25" />
          <rect x="180" y="28" width="102" height="10" rx="5" fill={accent} fillOpacity="0.25" />

          <ellipse cx="69" cy="116" rx="44" ry="30" fill="none" stroke={accentSoft} strokeWidth="5" />
          <path d="M57 64L69 48L81 64L74 78H64L57 64Z" fill="none" stroke={accentSoft} strokeWidth="3" />

          <ellipse cx="231" cy="116" rx="44" ry="30" fill="none" stroke={accent} strokeWidth="5" />
          <path d="M219 64L231 48L243 64L236 78H226L219 64Z" fill="none" stroke={accent} strokeWidth="3" />

          <circle cx="150" cy="100" r="24" fill={COLOR.white} fillOpacity="0.5" stroke={COLOR.white} strokeOpacity="0.8" />
          <text
            x="150"
            y="106"
            textAnchor="middle"
            fill={COLOR.text}
            fontSize="17"
            fontWeight="700"
            letterSpacing="1.2"
            fontFamily="'Trebuchet MS', Verdana, sans-serif"
          >
            VS
          </text>
        </g>
      );
    case "ring":
    default:
      return (
        <g transform="translate(0 18)">
          <ellipse cx="320" cy="210" rx="84" ry="52" fill="none" stroke={accentSoft} strokeWidth="7" />
          <ellipse cx="320" cy="210" rx="84" ry="52" fill="none" stroke={COLOR.white} strokeOpacity="0.22" strokeWidth="1.5" />
          <path d="M296 136L320 112L344 136L331 159H309L296 136Z" fill="none" stroke={accent} strokeWidth="2" />
          <path d="M296 136H344" stroke={accent} strokeWidth="1.5" />
          <path d="M309 159L320 112L331 159" stroke={accent} strokeWidth="1.5" fill="none" />
        </g>
      );
  }
}

export default function ArticleCardVisual({
  slug,
  title,
  featured = false,
}: {
  slug: string;
  title: string;
  featured?: boolean;
}) {
  const comparisonSpec = buildComparisonSpecFromSlug(slug);

  const spec = comparisonSpec ?? ARTICLE_VISUALS[slug] ?? {
    label: "JEWELLERY ARTICLE",
    sublabel: "PREMIUM GUIDE",
    glyph: "ring",
    bgStart: COLOR.primarySoft,
    bgEnd: COLOR.primaryLight,
    accent: COLOR.primary,
    accentSoft: COLOR.primarySoftStrong,
  };

  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "article";
  const bgId = `article-bg-${safeSlug}`;
  const labelFontSize = featured ? 24 : 20;
  const labelY = featured ? 72 : 68;
  const labelSpacing = featured ? 1 : 1.1;
  const sublabelFontSize = featured ? 17 : 15;
  const sublabelY = featured ? 116 : 110;
  const sublabelSpacing = featured ? 0.75 : 0.9;
  const labelLines = buildLabelLines(spec.label);
  const lineGap = featured ? 26 : 22;

  return (
    <div className="article-card-visual article-card-visual--engagement" role="img" aria-label={`${title} illustration`}>
      <svg
        className="article-card-visual-svg"
        viewBox="0 0 640 400"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={spec.bgStart} />
            <stop offset="100%" stopColor={spec.bgEnd} />
          </linearGradient>
          <linearGradient id={`${bgId}-top`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.white} stopOpacity="0.26" />
            <stop offset="100%" stopColor={COLOR.white} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${bgId}-vignette`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={COLOR.text} stopOpacity="0.08" />
            <stop offset="100%" stopColor={COLOR.text} stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${bgId}-accent-glow`} cx="86%" cy="22%" r="58%">
            <stop offset="0%" stopColor={spec.accentSoft} stopOpacity="0.24" />
            <stop offset="100%" stopColor={spec.accentSoft} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="640" height="400" fill={`url(#${bgId})`} />
        <rect width="640" height="130" fill={`url(#${bgId}-top)`} />
        <rect width="640" height="400" fill={`url(#${bgId}-accent-glow)`} />
        <rect y="240" width="640" height="160" fill={`url(#${bgId}-vignette)`} />
        <rect x="22" y="22" width="596" height="356" rx="18" fill="none" stroke={COLOR.white} strokeOpacity="0.45" />
        <path d="M66 342C168 302 246 360 340 330C440 299 528 344 588 324" fill="none" stroke={COLOR.white} strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M72 354C172 320 254 372 344 344C438 315 520 356 578 340" fill="none" stroke={spec.accentSoft} strokeOpacity="0.24" strokeWidth="1.6" strokeLinecap="round" />

        <g strokeLinecap="round" strokeLinejoin="round">
          {renderVisualGlyph(spec.glyph, spec.accent, spec.accentSoft)}
        </g>

        <rect
          x="36"
          y="34"
          width={featured ? 392 : 336}
          height={featured ? 106 : 92}
          rx="14"
          fill={COLOR.white}
          fillOpacity="0.48"
          stroke={COLOR.white}
          strokeOpacity="0.55"
        />

        {labelLines.map((line, index) => (
          <text
            key={`${safeSlug}-line-${index}`}
            x="48"
            y={labelY + index * lineGap}
            fill={COLOR.text}
            fontSize={labelFontSize}
            letterSpacing={labelSpacing}
            fontFamily="'Trebuchet MS', Verdana, sans-serif"
            fontWeight="700"
          >
            {line}
          </text>
        ))}
        <text x="48" y={sublabelY} fill={COLOR.textSecondary} fontSize={sublabelFontSize} letterSpacing={sublabelSpacing} fontFamily="Georgia, 'Times New Roman', serif">{spec.sublabel}</text>
      </svg>
    </div>
  );
}
