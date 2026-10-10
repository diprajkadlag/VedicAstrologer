import type { GrahaId, HouseNumber } from "../astro/ephemeris";
import type { ZoomLevel } from "./geometry";
import type { MotionSegment } from "./planetTimeline";

/**
 * Classical transit patterns as time bands: friction (for example Sade Sati)
 * and expansion (Jupiter in a favourable house from the birth Moon). Each band
 * comes straight from a graha's sign or motion segments, so its edges are the
 * exact ingress or station instants.
 *
 * These are reflection markers of the tradition, not predicted events.
 */

export const TRANSIT_BAND_IDS = [
  "sade-sati-rising",
  "sade-sati-peak",
  "sade-sati-setting",
  "ashtama-shani",
  "kantaka-shani",
  "rahu-friction",
  "ketu-over-moon",
  "rahu-over-lagna",
  "ketu-over-lagna",
  "mars-retrograde",
  "venus-retrograde",
  "mercury-retrograde",
  "jupiter-favourable",
] as const;

export type TransitBandId = (typeof TRANSIT_BAND_IDS)[number];
export type TransitBandTone = "friction" | "expansion";
/**
 * Where a band's rule comes from. "classical": Phaladeepika ch. 26 or BPHS.
 * "modern": retrograde motion, which the classical Gochara texts do not
 * score. "app": a choice of this app with no classical source.
 */
export type RuleBasis = "classical" | "modern" | "app";

export interface TransitBandDefinition {
  readonly id: TransitBandId;
  readonly planet: GrahaId;
  readonly tone: TransitBandTone;
  readonly basis: RuleBasis;
  /** The coarsest zoom level that shows the band. */
  readonly minZoom: ZoomLevel;
}

export interface TransitBand extends TransitBandDefinition {
  readonly startMs: number;
  readonly endMs: number;
  /** Whole-sign house counted from the band's reference, when it has one. */
  readonly house: HouseNumber | null;
  readonly reference: "moon" | "lagna" | null;
}

/** Saturn in the 12th, 1st and 2nd sign from the birth Moon. */
const SADE_SATI_PHASE: Readonly<Partial<Record<HouseNumber, TransitBandId>>> = {
  12: "sade-sati-rising",
  1: "sade-sati-peak",
  2: "sade-sati-setting",
};

/**
 * Saturn in the 4th or 10th sign from the birth Moon. Sources differ (4th
 * only; 4th and 10th; 4th, 8th and 10th); this app uses 4 and 10 and keeps
 * the 8th as Ashtama Shani. The 4th is also called Ardhashtama ("half-eighth").
 */
export const KANTAKA_SHANI_HOUSES: ReadonlySet<HouseNumber> = new Set<HouseNumber>([4, 10]);
/** Rahu's strongest unfavourable houses from the birth Moon (Phaladeepika 26.2). */
export const RAHU_FRICTION_HOUSES: ReadonlySet<HouseNumber> = new Set<HouseNumber>([1, 8, 12]);
export const ASHTAMA_SHANI_HOUSE: HouseNumber = 8;
/** Jupiter's favourable Gochara houses from the birth Moon (Phaladeepika 26). */
export const JUPITER_FAVOURABLE_HOUSES: ReadonlySet<HouseNumber> = new Set<HouseNumber>([
  2, 5, 7, 9, 11,
]);

function band(
  id: TransitBandId,
  planet: GrahaId,
  tone: TransitBandTone,
  basis: RuleBasis,
  minZoom: ZoomLevel,
): TransitBandDefinition {
  return { id, planet, tone, basis, minZoom };
}

export const TRANSIT_BAND_DEFINITIONS: Readonly<Record<TransitBandId, TransitBandDefinition>> = {
  "sade-sati-rising": band("sade-sati-rising", "saturn", "friction", "classical", "macro"),
  "sade-sati-peak": band("sade-sati-peak", "saturn", "friction", "classical", "macro"),
  "sade-sati-setting": band("sade-sati-setting", "saturn", "friction", "classical", "macro"),
  "ashtama-shani": band("ashtama-shani", "saturn", "friction", "classical", "macro"),
  "kantaka-shani": band("kantaka-shani", "saturn", "friction", "classical", "macro"),
  "rahu-friction": band("rahu-friction", "rahu", "friction", "classical", "macro"),
  "ketu-over-moon": band("ketu-over-moon", "ketu", "friction", "classical", "macro"),
  "rahu-over-lagna": band("rahu-over-lagna", "rahu", "friction", "app", "macro"),
  "ketu-over-lagna": band("ketu-over-lagna", "ketu", "friction", "app", "macro"),
  "mars-retrograde": band("mars-retrograde", "mars", "friction", "modern", "meso"),
  "venus-retrograde": band("venus-retrograde", "venus", "friction", "modern", "meso"),
  "mercury-retrograde": band("mercury-retrograde", "mercury", "friction", "modern", "micro"),
  "jupiter-favourable": band("jupiter-favourable", "jupiter", "expansion", "classical", "macro"),
};

const ZOOM_ORDER: Readonly<Record<ZoomLevel, number>> = { macro: 0, meso: 1, micro: 2 };

/** True when a band of this definition is shown at the given zoom level. */
export function bandVisibleAt(definition: Pick<TransitBandDefinition, "minZoom">, zoom: ZoomLevel): boolean {
  return ZOOM_ORDER[zoom] >= ZOOM_ORDER[definition.minZoom];
}

export function houseFrom(signIndex: number, referenceSignIndex: number): HouseNumber {
  return ((((signIndex - referenceSignIndex) % 12) + 12) % 12 + 1) as HouseNumber;
}

export interface BandInput {
  readonly moonSign: number;
  readonly lagnaSign: number;
  readonly segments: Readonly<Partial<Record<GrahaId, readonly MotionSegment[]>>>;
}

interface Classified {
  readonly id: TransitBandId;
  readonly house: HouseNumber | null;
  readonly reference: "moon" | "lagna" | null;
}

/** Merges consecutive segments that fall in the same band into one band. */
function collect(
  segments: readonly MotionSegment[] | undefined,
  classify: (segment: MotionSegment) => Classified | null,
): TransitBand[] {
  if (!segments) return [];
  const bands: TransitBand[] = [];
  for (const segment of segments) {
    const match = classify(segment);
    if (!match) continue;
    const previous = bands.at(-1);
    if (
      previous &&
      previous.id === match.id &&
      previous.house === match.house &&
      previous.endMs === segment.startMs
    ) {
      bands[bands.length - 1] = { ...previous, endMs: segment.endMs };
      continue;
    }
    bands.push({
      ...TRANSIT_BAND_DEFINITIONS[match.id],
      startMs: segment.startMs,
      endMs: segment.endMs,
      house: match.house,
      reference: match.reference,
    });
  }
  return bands;
}

export function transitBands(input: BandInput): TransitBand[] {
  const { moonSign, lagnaSign, segments } = input;
  const saturn = segments.saturn;

  const bands: TransitBand[] = [
    ...collect(saturn, (segment) => {
      const house = houseFrom(segment.signIndex, moonSign);
      const phase = SADE_SATI_PHASE[house];
      return phase ? { id: phase, house, reference: "moon" } : null;
    }),
    ...collect(saturn, (segment) => {
      const house = houseFrom(segment.signIndex, moonSign);
      return house === ASHTAMA_SHANI_HOUSE ? { id: "ashtama-shani", house, reference: "moon" } : null;
    }),
    ...collect(saturn, (segment) => {
      const house = houseFrom(segment.signIndex, moonSign);
      return KANTAKA_SHANI_HOUSES.has(house) ? { id: "kantaka-shani", house, reference: "moon" } : null;
    }),
    ...collect(segments.jupiter, (segment) => {
      const house = houseFrom(segment.signIndex, moonSign);
      return JUPITER_FAVOURABLE_HOUSES.has(house)
        ? { id: "jupiter-favourable", house, reference: "moon" }
        : null;
    }),
  ];

  bands.push(
    ...collect(segments.rahu, (segment) => {
      const house = houseFrom(segment.signIndex, moonSign);
      return RAHU_FRICTION_HOUSES.has(house) ? { id: "rahu-friction", house, reference: "moon" } : null;
    }),
    ...collect(segments.ketu, (segment) =>
      houseFrom(segment.signIndex, moonSign) === 1
        ? { id: "ketu-over-moon", house: 1, reference: "moon" }
        : null,
    ),
  );

  for (const node of ["rahu", "ketu"] as const) {
    bands.push(
      ...collect(segments[node], (segment) =>
        houseFrom(segment.signIndex, lagnaSign) === 1
          ? { id: `${node}-over-lagna`, house: 1, reference: "lagna" }
          : null,
      ),
    );
  }

  for (const planet of ["mars", "venus", "mercury"] as const) {
    bands.push(
      ...collect(segments[planet], (segment) =>
        segment.retrograde ? { id: `${planet}-retrograde`, house: null, reference: null } : null,
      ),
    );
  }

  return bands.sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));
}

/** Bands that contain the instant (half-open), for the card and the inspector. */
export function bandsAt(bands: readonly TransitBand[], ms: number): TransitBand[] {
  return bands.filter((band) => ms >= band.startMs && ms < band.endMs);
}
