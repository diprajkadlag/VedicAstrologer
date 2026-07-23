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
}
