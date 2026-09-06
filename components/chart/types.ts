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
   * Phone mode. The 400-unit viewBox is drawn into ~250 CSS px on a narrow
   * phone, which shrinks 8-unit labels to ~5 px. Compact mode enlarges
   * labels, planet marks, and their invisible hit areas so the chart stays
   * readable and tappable; the geometry of the houses is unchanged.
   */
  compact?: boolean;
}
