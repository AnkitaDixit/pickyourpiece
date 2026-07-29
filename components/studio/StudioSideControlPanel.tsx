type SortMode = "featured" | "price_asc" | "price_desc";

type FacetOption = {
  value: string;
  label: string;
};

export type SideFilterState = {
  query: string;
  brand: string;
  gemstone: string;
  style: string;
  metal: string;
  color: string;
  sort: SortMode;
};

export type SideFrameState = {
  x: number;
  y: number;
  zoom: number;
};

type SideControlPanelProps = {
  title: string;
  activeLabel: string;
  sideId: string;
  filter: SideFilterState;
  onFilterChange: (key: keyof SideFilterState, value: string | SortMode) => void;
  brandOptions: FacetOption[];
  gemstoneOptions: FacetOption[];
  styleOptions: FacetOption[];
  metalOptions: FacetOption[];
  colorOptions: FacetOption[];
  frame?: SideFrameState;
  onFrameChange?: (key: keyof SideFrameState, value: number) => void;
  onResetFrame?: () => void;
  frameLimits: {
    x: { min: number; max: number; step: number };
    y: { min: number; max: number; step: number };
    zoom: { min: number; max: number; step: number };
  };
};

export default function StudioSideControlPanel({
  title,
  activeLabel,
  sideId,
  filter,
  onFilterChange,
  brandOptions,
  gemstoneOptions,
  styleOptions,
  metalOptions,
  colorOptions,
  frame,
  onFrameChange,
  onResetFrame,
  frameLimits,
}: SideControlPanelProps) {
  return (
    <section className="studio-compare-side-panel active">
      <div className="studio-compare-side-panel-head">
        <h4>{title}</h4>
        <button type="button" className="active">{activeLabel}</button>
      </div>

      <label htmlFor={`studio-side-query-${sideId}`}>Search</label>
      <input
        id={`studio-side-query-${sideId}`}
        type="search"
        value={filter.query}
        onChange={(event) => onFilterChange("query", event.target.value)}
        placeholder="Search name, brand, style"
      />

      <div className="studio-compare-side-grid">
        <div>
          <label htmlFor={`studio-side-brand-${sideId}`}>Brand</label>
          <select
            id={`studio-side-brand-${sideId}`}
            value={filter.brand}
            onChange={(event) => onFilterChange("brand", event.target.value)}
          >
            <option value="all">All</option>
            {brandOptions.map((option) => (
              <option key={`studio-side-brand-${sideId}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`studio-side-gemstone-${sideId}`}>Gemstone</label>
          <select
            id={`studio-side-gemstone-${sideId}`}
            value={filter.gemstone}
            onChange={(event) => onFilterChange("gemstone", event.target.value)}
          >
            <option value="all">All</option>
            {gemstoneOptions.map((option) => (
              <option key={`studio-side-gemstone-${sideId}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`studio-side-style-${sideId}`}>Style</label>
          <select
            id={`studio-side-style-${sideId}`}
            value={filter.style}
            onChange={(event) => onFilterChange("style", event.target.value)}
          >
            <option value="all">All</option>
            {styleOptions.map((option) => (
              <option key={`studio-side-style-${sideId}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`studio-side-metal-${sideId}`}>Metal</label>
          <select
            id={`studio-side-metal-${sideId}`}
            value={filter.metal}
            onChange={(event) => onFilterChange("metal", event.target.value)}
          >
            <option value="all">All</option>
            {metalOptions.map((option) => (
              <option key={`studio-side-metal-${sideId}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`studio-side-color-${sideId}`}>Color</label>
          <select
            id={`studio-side-color-${sideId}`}
            value={filter.color}
            onChange={(event) => onFilterChange("color", event.target.value)}
          >
            <option value="all">All</option>
            {colorOptions.map((option) => (
              <option key={`studio-side-color-${sideId}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`studio-side-sort-${sideId}`}>Sort</label>
          <select
            id={`studio-side-sort-${sideId}`}
            value={filter.sort}
            onChange={(event) => onFilterChange("sort", event.target.value as SortMode)}
          >
            <option value="featured">Featured</option>
            <option value="price_asc">Low to High</option>
            <option value="price_desc">High to Low</option>
          </select>
        </div>
      </div>

      {frame && onFrameChange && onResetFrame ? (
        <div className="studio-frame-controls" role="group" aria-label={`Frame controls for ${title}`}>
          <div className="studio-frame-controls-head">
            <strong>Frame {title}</strong>
            <button type="button" className="studio-frame-reset" onClick={onResetFrame}>Reset</button>
          </div>

          <label htmlFor={`studio-side-frame-x-${sideId}`}>Horizontal ({frame.x}px)</label>
          <input
            id={`studio-side-frame-x-${sideId}`}
            type="range"
            min={frameLimits.x.min}
            max={frameLimits.x.max}
            step={frameLimits.x.step}
            value={frame.x}
            onChange={(event) => onFrameChange("x", Number(event.target.value))}
          />

          <label htmlFor={`studio-side-frame-y-${sideId}`}>Vertical ({frame.y}px)</label>
          <input
            id={`studio-side-frame-y-${sideId}`}
            type="range"
            min={frameLimits.y.min}
            max={frameLimits.y.max}
            step={frameLimits.y.step}
            value={frame.y}
            onChange={(event) => onFrameChange("y", Number(event.target.value))}
          />

          <label htmlFor={`studio-side-frame-zoom-${sideId}`}>Zoom ({frame.zoom.toFixed(2)}x)</label>
          <input
            id={`studio-side-frame-zoom-${sideId}`}
            type="range"
            min={frameLimits.zoom.min}
            max={frameLimits.zoom.max}
            step={frameLimits.zoom.step}
            value={frame.zoom}
            onChange={(event) => onFrameChange("zoom", Number(event.target.value))}
          />
        </div>
      ) : null}
    </section>
  );
}
