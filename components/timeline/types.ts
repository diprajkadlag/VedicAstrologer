import type { GrahaId } from "@/lib/astro/ephemeris";
import type { DashaSpan } from "@/lib/timeline/dashaLevels";
import type { TransitBand } from "@/lib/timeline/gocharaBands";
import type { LifeCurveId } from "@/lib/timeline/lifeCurves";
import type { LifeEvent } from "@/lib/timeline/lifeEvents";
import type { MotionTurn } from "@/lib/timeline/planetTimeline";

/** What a tap or a table row asks the inspector to explain. */
export type InspectTarget =
  | { readonly kind: "dasha"; readonly span: DashaSpan }
  | { readonly kind: "band"; readonly band: TransitBand }
  | { readonly kind: "planet"; readonly planet: GrahaId; readonly ms: number }
  | { readonly kind: "station"; readonly planet: GrahaId; readonly ms: number; readonly turns: MotionTurn }
  | { readonly kind: "ingress"; readonly planet: GrahaId; readonly ms: number; readonly toSign: number }
  | { readonly kind: "curve"; readonly curve: LifeCurveId; readonly ms: number }
  | { readonly kind: "change"; readonly curve: LifeCurveId; readonly ms: number }
  | { readonly kind: "event"; readonly event: LifeEvent };

/** CSS custom property of each graha's series colour (app/globals.css). */
export const GRAHA_COLOR_VARS: Readonly<Record<GrahaId, string>> = {
  sun: "var(--graha-sun)",
  moon: "var(--graha-moon)",
  mercury: "var(--graha-mercury)",
  venus: "var(--graha-venus)",
  mars: "var(--graha-mars)",
  jupiter: "var(--graha-jupiter)",
  saturn: "var(--graha-saturn)",
  rahu: "var(--graha-rahu)",
  ketu: "var(--graha-ketu)",
};

/** Legend order that keeps neighbouring colours apart for colour-blind readers. */
export const LEGEND_ORDER: readonly GrahaId[] = [
  "saturn",
  "mars",
  "ketu",
  "jupiter",
  "venus",
  "mercury",
  "rahu",
  "sun",
  "moon",
];
