type VisualGlyph =
  | "ring"
  | "budget"
  | "metals"
  | "ruler"
  | "lab"
  | "diamond"
  | "rose"
  | "size"
  | "halo";

type VisualSpec = {
  label: string;
  sublabel: string;
  glyph: VisualGlyph;
  bgStart: string;
  bgEnd: string;
  accent: string;
  accentSoft: string;
};

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
};

function renderVisualGlyph(glyph: VisualGlyph, accent: string, accentSoft: string) {
  switch (glyph) {
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
  const spec = ARTICLE_VISUALS[slug] ?? {
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
  const labelY = featured ? 76 : 72;
  const labelSpacing = featured ? 1 : 1.1;
  const sublabelFontSize = featured ? 17 : 15;
  const sublabelY = featured ? 112 : 104;
  const sublabelSpacing = featured ? 0.75 : 0.9;

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
          height={featured ? 96 : 84}
          rx="14"
          fill={COLOR.white}
          fillOpacity="0.42"
          stroke={COLOR.white}
          strokeOpacity="0.48"
        />

        <text x="48" y={labelY} fill={COLOR.text} fontSize={labelFontSize} letterSpacing={labelSpacing} fontFamily="Georgia, 'Times New Roman', serif">{spec.label}</text>
        <text x="48" y={sublabelY} fill={COLOR.textSecondary} fontSize={sublabelFontSize} letterSpacing={sublabelSpacing} fontFamily="Georgia, 'Times New Roman', serif">{spec.sublabel}</text>
      </svg>
    </div>
  );
}
