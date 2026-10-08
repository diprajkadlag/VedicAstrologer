import type {
  GrahaId,
  HouseNumber,
  VedicChart,
} from "@/lib/astro/ephemeris";
import type { AppLocale } from "@/lib/i18n";

/** Shared controlled-selection contract for both regional chart renderers. */
export interface VedicChartRendererProps {
  chart: VedicChart;
  selectedHouse?: HouseNumber | null;
  selectedPlanetId?: GrahaId | null;
  onSelectHouse?: (house: HouseNumber) => void;
  onSelectPlanet?: (planetId: GrahaId) => void;
  className?: string;
  ariaLabel?: string;
  locale?: AppLocale;
  /**
   * How tightly the chart is drawn, chosen from the available panel width.
   * The 400-unit viewBox is drawn into ~250 CSS px on a narrow phone, which
   * shrinks an 8-unit label to ~5 px. The two denser modes enlarge labels,
   * planet marks, and their invisible hit areas, and wrap crowded houses
   * into fewer columns; house geometry never changes.
   */
  density?: ChartDensity;
  /**
   * Which chart `chart` holds: 1 for the birth chart (D1), 9 for the
   * ninth-division chart (D9). The renderers only use it for captions; the
   * caller passes the matching chart.
   */
  division?: ChartDivision;
}

/** `compact` below ~360 px of panel width, `tight` below ~300 px. */
export type ChartDensity = "comfortable" | "compact" | "tight";

export type ChartDivision = 1 | 9;
