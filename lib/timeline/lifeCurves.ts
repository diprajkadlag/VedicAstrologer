import { RASIS, type GrahaId, type HouseNumber, type VedicChart } from "../astro/ephemeris";
import { RASI_PROFILES } from "../astro/glossary";
import {
  ASHTAKAVARGA_AVERAGE_BINDUS,
  isAshtakavargaPlanet,
  type Ashtakavarga,
} from "../astro/ashtakavarga";
import type { DashaLord } from "../astro/interpretations";
import {
  dashaSpansInRange,
  dashaStackAt,
  type DashaClock,
  type DashaLevel,
  type DashaSpan,
} from "./dashaLevels";
import type { ZoomLevel } from "./geometry";
import { houseFrom, type RuleBasis } from "./gocharaBands";
import { segmentAt, type MotionSegment } from "./planetTimeline";

/**
 * Four symbolic theme curves: emotional resilience, career momentum,
 * relationship harmony and physical vitality.
 *
 * Every value starts at 50, adds named rule contributions and is clamped to
 * 0..100, in the style of lib/transits.ts. The conditions are classical
 * (Phaladeepika ch. 26 for Gochara from the birth Moon and its Vedha
 * obstructions, BPHS for karakas and Dasha-lord placement, the Ashtakavarga
 * thresholds of Raman and Patel); the weights are this app's own. Retrograde
 * rules have no classical Gochara source and are marked "modern".
 *
 * Nothing here measures health, mood or outcomes. The curves summarise fixed
 * rules for reflection, and every contribution is returned so that the
 * interface can show it.
 */

export const LIFE_CURVE_IDS = ["emotional", "career", "relationship", "vitality"] as const;
export type LifeCurveId = (typeof LIFE_CURVE_IDS)[number];

export const LIFE_CURVE_RULESET_VERSION = "life-curves-v1" as const;
export const LIFE_CURVE_BASELINE = 50;

/** Bodies whose rules apply at each zoom level; coarse views use slow bodies only. */
export const ZOOM_PLANETS: Readonly<Record<ZoomLevel, readonly GrahaId[]>> = {
  macro: ["saturn", "jupiter", "rahu", "ketu"],
  meso: ["saturn", "jupiter", "rahu", "ketu", "sun", "mars", "venus", "mercury"],
  micro: ["saturn", "jupiter", "rahu", "ketu", "sun", "mars", "venus", "mercury", "moon"],
};

/** The finest Dasha level whose lord enters the curves at each zoom level. */
export const ZOOM_DASHA_LEVEL: Readonly<Record<ZoomLevel, DashaLevel>> = {
  macro: 2,
  meso: 3,
  micro: 4,
};

/** A Dasha rule weighs fully for the Mahadasha and less for each finer level. */
export const DASHA_LEVEL_WEIGHT: Readonly<Record<DashaLevel, number>> = {
  1: 1,
  2: 0.6,
  3: 0.4,
  4: 0.2,
};

/**
 * Favourable Gochara houses counted from the birth Moon, each with its Vedha
 * (obstruction) house: a planet in the Vedha house cancels the good result.
 * Phaladeepika 26.2-8, identical in B. V. Raman's Vedhanka table. For the
 * nodes the sources differ; Phaladeepika 26.2 says they act like the Sun, and
 * this app follows that.
 */
export const GOCHARA_VEDHA: Readonly<
  Record<GrahaId, Readonly<Partial<Record<HouseNumber, HouseNumber>>>>
> = {
  sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  moon: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  mars: { 3: 12, 6: 9, 11: 5 },
  mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  saturn: { 3: 12, 6: 9, 11: 5 },
  rahu: { 3: 9, 6: 12, 10: 4, 11: 5 },
  ketu: { 3: 9, 6: 12, 10: 4, 11: 5 },
};

/** Only these cause Vedha; the nodes are usually not counted. */
const VEDHA_CAUSERS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const;

/** Father and son never obstruct each other (Phaladeepika 26.3-6). */
function vedhaExempt(a: GrahaId, b: GrahaId): boolean {
  const pair = new Set([a, b]);
  return (pair.has("sun") && pair.has("saturn")) || (pair.has("moon") && pair.has("mercury"));
}

const NATURAL_BENEFICS: ReadonlySet<GrahaId> = new Set<GrahaId>(["jupiter", "venus", "moon", "mercury"]);

export const CURVE_REASON_KINDS = [
  "gochara-good",
  "gochara-bad",
  "gochara-vedha",
  "sade-sati",
  "ashtama-shani",
  "kantaka-shani",
  "chandrashtama",
  "node-over-moon",
  "rahu-friction",
  "nodes-on-axis",
  "over-natal-venus",
  "retrograde",
  "transit-natal-house",
  "bav",
  "sav",
  "sav-tenth",
  "dasha-from-moon",
  "dasha-nature",
  "dasha-owns",
  "dasha-occupies",
  "dasha-karaka",
  "dasha-lagna-lord",
] as const;

/** Each kind has one sentence template per language in the timeline messages. */
export type CurveReasonKind = (typeof CURVE_REASON_KINDS)[number];

export interface CurveReason {
  /** Stable identifier: "<curve>.<rule>.<variant>". */
  readonly ruleId: string;
  readonly kind: CurveReasonKind;
  readonly contribution: number;
  readonly basis: RuleBasis;
  readonly planet?: GrahaId;
  readonly house?: HouseNumber;
  readonly blocker?: GrahaId;
  readonly vedhaHouse?: HouseNumber;
  readonly bindus?: number;
  readonly points?: number;
  readonly phase?: "rising" | "peak" | "setting";
  readonly level?: DashaLevel;
  readonly nature?: "benefic" | "malefic";
}

export interface CurveValue {
  readonly value: number;
  readonly reasons: readonly CurveReason[];
}

export interface CurveStep extends CurveValue {
  readonly startMs: number;
  readonly endMs: number;
}

export interface NatalCurveContext {
  readonly moonSign: number;
  readonly lagnaSign: number;
  readonly natalSign: Readonly<Record<GrahaId, number>>;
  /** Whole-sign house of each natal graha, counted from the Ascendant. */
  readonly natalHouse: Readonly<Record<GrahaId, HouseNumber>>;
  /** Houses each graha rules, counted from the Ascendant. The nodes rule none. */
  readonly ownedHouses: Readonly<Record<GrahaId, readonly HouseNumber[]>>;
  readonly lagnaLord: GrahaId;
  readonly ashtakavarga: Ashtakavarga;
  readonly clock: DashaClock;
}

export function createNatalCurveContext(
  chart: VedicChart,
  ashtakavarga: Ashtakavarga,
  clock: DashaClock,
): NatalCurveContext {
  const natalSign = {} as Record<GrahaId, number>;
  const natalHouse = {} as Record<GrahaId, HouseNumber>;
  const ownedHouses = {} as Record<GrahaId, HouseNumber[]>;
  for (const planet of chart.planets) {
    natalSign[planet.id] = planet.sign.index;
    natalHouse[planet.id] = planet.house;
    ownedHouses[planet.id] = [];
  }
  const lagnaSign = chart.ascendant.sign.index;
  for (let house = 1; house <= 12; house += 1) {
    const ruler = RASI_PROFILES[RASIS[(lagnaSign + house - 1) % 12]].ruler;
    ownedHouses[ruler].push(house as HouseNumber);
  }
  return {
    moonSign: natalSign.moon,
    lagnaSign,
    natalSign,
    natalHouse,
    ownedHouses,
    lagnaLord: RASI_PROFILES[RASIS[lagnaSign]].ruler,
    ashtakavarga,
    clock,
  };
}

interface SkyState {
  readonly sign: Readonly<Partial<Record<GrahaId, number>>>;
  readonly retrograde: Readonly<Partial<Record<GrahaId, boolean>>>;
  /** Dasha lords from the Mahadasha down to the zoom's finest level. */
  readonly dasha: readonly { readonly level: DashaLevel; readonly lord: DashaLord }[];
}

type Extra = Omit<CurveReason, "ruleId" | "kind" | "contribution" | "basis">;

function reason(
  ruleId: string,
  kind: CurveReasonKind,
  contribution: number,
  extra: Extra = {},
  basis: RuleBasis = "classical",
): CurveReason {
  return { ruleId, kind, contribution, basis, ...extra };
}

/** Scales a Dasha rule for its level and keeps at least one point. */
function scaled(value: number, level: DashaLevel): number {
  if (value === 0) return 0;
  return Math.sign(value) * Math.max(1, Math.round(Math.abs(value) * DASHA_LEVEL_WEIGHT[level]));
}

class RuleContext {
  readonly reasons: CurveReason[] = [];

  constructor(
    readonly curve: LifeCurveId,
    readonly sky: SkyState,
    readonly natal: NatalCurveContext,
  ) {}

  add(entry: CurveReason | null): void {
    if (entry && entry.contribution !== 0) this.reasons.push(entry);
    else if (entry && entry.kind === "gochara-vedha") this.reasons.push(entry);
  }

  id(rule: string): string {
    return `${this.curve}.${rule}`;
  }

  /** House counted from the birth Moon, or null when the body is not in this view. */
  fromMoon(planet: GrahaId): HouseNumber | null {
    const sign = this.sky.sign[planet];
    return sign === undefined ? null : houseFrom(sign, this.natal.moonSign);
  }

  fromLagna(planet: GrahaId): HouseNumber | null {
    const sign = this.sky.sign[planet];
    return sign === undefined ? null : houseFrom(sign, this.natal.lagnaSign);
  }

  isFavourable(planet: GrahaId, house: HouseNumber): boolean {
    return GOCHARA_VEDHA[planet][house] !== undefined;
  }

  /**
   * A favourable transit, unless another body in this view stands in its
   * Vedha house; then the reason is kept with zero points so the reader sees
   * why the good result does not count.
   */
  favourable(rule: string, planet: GrahaId, house: HouseNumber, points: number): CurveReason {
    const vedhaHouse = GOCHARA_VEDHA[planet][house];
    if (vedhaHouse !== undefined) {
      for (const other of VEDHA_CAUSERS) {
        if (other === planet || vedhaExempt(planet, other)) continue;
        const sign = this.sky.sign[other];
        if (sign !== undefined && houseFrom(sign, this.natal.moonSign) === vedhaHouse) {
          return reason(this.id(`${rule}.vedha`), "gochara-vedha", 0, {
            planet,
            house,
            blocker: other,
            vedhaHouse,
          });
        }
      }
    }
    return reason(this.id(`${rule}.good`), "gochara-good", points, { planet, house });
  }

  unfavourable(rule: string, planet: GrahaId, house: HouseNumber, points: number): CurveReason {
    return reason(this.id(`${rule}.house-${house}`), "gochara-bad", points, { planet, house });
  }

  bindus(rule: string, planet: GrahaId): void {
    const sign = this.sky.sign[planet];
    if (sign === undefined || !isAshtakavargaPlanet(planet)) return;
    const bindus = this.natal.ashtakavarga.bhinna[planet][sign];
    if (bindus > ASHTAKAVARGA_AVERAGE_BINDUS) {
      this.add(reason(this.id(`${rule}.bindus-high`), "bav", 3, { planet, bindus }));
    } else if (bindus < ASHTAKAVARGA_AVERAGE_BINDUS) {
      this.add(reason(this.id(`${rule}.bindus-low`), "bav", -3, { planet, bindus }));
    }
  }

  retrograde(rule: string, planet: GrahaId, points: number): void {
    if (this.sky.retrograde[planet]) {
      this.add(reason(this.id(rule), "retrograde", points, { planet }, "modern"));
    }
  }

  dasha(each: (entry: { level: DashaLevel; lord: DashaLord }) => void): void {
    for (const entry of this.sky.dasha) each(entry);
  }
}

const SADE_SATI_PHASE: Readonly<Partial<Record<HouseNumber, "rising" | "peak" | "setting">>> = {
  12: "rising",
  1: "peak",
  2: "setting",
};

/** Sade Sati, Ashtama or Kantaka Shani, with per-curve points. */
function saturnFriction(
  context: RuleContext,
  points: { rising: number; peak: number; setting: number; ashtama: number; ardhashtama: number },
): boolean {
  const house = context.fromMoon("saturn");
  if (house === null) return false;
  const phase = SADE_SATI_PHASE[house];
  if (phase) {
    context.add(reason(context.id(`saturn.sade-sati-${phase}`), "sade-sati", points[phase], { phase, house, planet: "saturn" }));
    return true;
  }
  if (house === 8 && points.ashtama !== 0) {
    context.add(reason(context.id("saturn.ashtama"), "ashtama-shani", points.ashtama, { house, planet: "saturn" }));
    return true;
  }
  if (house === 4 && points.ardhashtama !== 0) {
    context.add(reason(context.id("saturn.kantaka-4"), "kantaka-shani", points.ardhashtama, { house, planet: "saturn" }));
    return true;
  }
  return false;
}

function sarvaPoints(context: RuleContext, planet: GrahaId, high: number, low: number, lowBelow: number): void {
  const sign = context.sky.sign[planet];
  if (sign === undefined) return;
  const points = context.natal.ashtakavarga.sarva[sign];
  if (points >= 28) context.add(reason(context.id(`${planet}.sav-high`), "sav", high, { planet, points }));
  else if (points < lowBelow) context.add(reason(context.id(`${planet}.sav-low`), "sav", low, { planet, points }));
}

const MOON_GOOD: ReadonlySet<HouseNumber> = new Set<HouseNumber>([1, 3, 6, 7, 10, 11]);

const RULES: Readonly<Record<LifeCurveId, (context: RuleContext) => void>> = {
  /** The Moon (mind) and the 4th house. */
  emotional: (c) => {
    saturnFriction(c, { rising: -8, peak: -10, setting: -6, ashtama: -8, ardhashtama: -6 });

    const jupiter = c.fromMoon("jupiter");
    if (jupiter !== null && c.isFavourable("jupiter", jupiter)) c.add(c.favourable("jupiter", "jupiter", jupiter, 8));
    else if (jupiter === 1) c.add(c.unfavourable("jupiter", "jupiter", 1, -2));

    const rahu = c.fromMoon("rahu");
    if (rahu === 1) c.add(reason(c.id("rahu.over-moon"), "node-over-moon", -8, { planet: "rahu", house: 1 }));
    else if (rahu === 8 || rahu === 12) c.add(reason(c.id(`rahu.house-${rahu}`), "rahu-friction", -5, { planet: "rahu", house: rahu }));
    if (c.fromMoon("ketu") === 1) c.add(reason(c.id("ketu.over-moon"), "node-over-moon", -5, { planet: "ketu", house: 1 }));

    const moon = c.fromMoon("moon");
    if (moon !== null) {
      if (MOON_GOOD.has(moon)) c.add(c.favourable("moon", "moon", moon, 5));
      else if (moon === 8) c.add(reason(c.id("moon.chandrashtama"), "chandrashtama", -8, { planet: "moon", house: 8 }));
      else if (moon === 2 || moon === 12) c.add(c.unfavourable("moon", "moon", moon, -4));
      else c.add(c.unfavourable("moon", "moon", moon, -3));
      c.bindus("moon", "moon");
      sarvaPoints(c, "moon", 2, -2, 28);
    }

    c.dasha(({ level, lord }) => {
      const house = houseFrom(c.natal.natalSign[lord], c.natal.moonSign);
      if ([1, 4, 5, 9, 10, 11].includes(house)) {
        c.add(reason(c.id(`dasha.${level}.from-moon`), "dasha-from-moon", scaled(4, level), { level, planet: lord, house }));
      } else if ([6, 8, 12].includes(house)) {
        c.add(reason(c.id(`dasha.${level}.from-moon`), "dasha-from-moon", scaled(-5, level), { level, planet: lord, house }));
      }
      const benefic = NATURAL_BENEFICS.has(lord);
      c.add(
        reason(c.id(`dasha.${level}.nature`), "dasha-nature", scaled(benefic ? 3 : -3, level), {
          level,
          planet: lord,
          nature: benefic ? "benefic" : "malefic",
        }),
      );
    });
  },

  /** The 10th house; the Sun, Mercury and Saturn. */
  career: (c) => {
    const saturn = c.fromMoon("saturn");
    if (saturn !== null) {
      if (c.isFavourable("saturn", saturn)) c.add(c.favourable("saturn", "saturn", saturn, 8));
      else if (saturn === 10) c.add(reason(c.id("saturn.kantaka-10"), "kantaka-shani", -6, { planet: "saturn", house: 10 }));
      else if (SADE_SATI_PHASE[saturn]) {
        const phase = SADE_SATI_PHASE[saturn]!;
        c.add(reason(c.id(`saturn.sade-sati-${phase}`), "sade-sati", -5, { planet: "saturn", house: saturn, phase }));
      }
      c.bindus("saturn", "saturn");
    }

    const jupiter = c.fromMoon("jupiter");
    if (jupiter !== null && c.isFavourable("jupiter", jupiter)) c.add(c.favourable("jupiter", "jupiter", jupiter, 8));
    else if (jupiter === 10) c.add(c.unfavourable("jupiter", "jupiter", 10, -4));

    // A slow benefic or malefic over the natal 10th sign, read through that sign's points.
    for (const planet of ["jupiter", "saturn"] as const) {
      if (c.fromLagna(planet) !== 10) continue;
      const points = c.natal.ashtakavarga.sarva[(c.natal.lagnaSign + 9) % 12];
      if (points >= 28) c.add(reason(c.id(`${planet}.tenth-sav-high`), "sav-tenth", 5, { planet, points, house: 10 }));
      else if (points < 25) c.add(reason(c.id(`${planet}.tenth-sav-low`), "sav-tenth", -4, { planet, points, house: 10 }));
    }

    const sun = c.fromMoon("sun");
    if (sun !== null) {
      c.add(c.isFavourable("sun", sun) ? c.favourable("sun", "sun", sun, 5) : c.unfavourable("sun", "sun", sun, -3));
      if (c.fromLagna("sun") === 10) c.add(reason(c.id("sun.natal-10th"), "transit-natal-house", 3, { planet: "sun", house: 10 }));
      c.bindus("sun", "sun");
    }

    const mercury = c.fromMoon("mercury");
    if (mercury !== null) {
      c.add(c.isFavourable("mercury", mercury) ? c.favourable("mercury", "mercury", mercury, 4) : c.unfavourable("mercury", "mercury", mercury, -2));
      c.retrograde("mercury.retrograde", "mercury", -2);
    }

    const mars = c.fromMoon("mars");
    if (mars !== null) {
      if (c.isFavourable("mars", mars)) c.add(c.favourable("mars", "mars", mars, 3));
      else if (mars === 7 || mars === 8 || mars === 10) c.add(c.unfavourable("mars", "mars", mars, -3));
      c.retrograde("mars.retrograde", "mars", -2);
    }

    // At most one supporting and one straining contribution per Dasha lord;
    // the first matching house in each list is named.
    const link = (lord: GrahaId, houses: readonly HouseNumber[]) => {
      for (const house of houses) {
        if (c.natal.ownedHouses[lord].includes(house)) return { house, kind: "dasha-owns" as const, verb: "owns" };
        if (c.natal.natalHouse[lord] === house) return { house, kind: "dasha-occupies" as const, verb: "occupies" };
      }
      return null;
    };
    c.dasha(({ level, lord }) => {
      const support = link(lord, [10, 11, 2, 6]);
      if (support) {
        c.add(reason(c.id(`dasha.${level}.${support.verb}-${support.house}`), support.kind, scaled(5, level), { level, planet: lord, house: support.house }));
      }
      const strain = link(lord, [8, 12]);
      if (strain) {
        c.add(reason(c.id(`dasha.${level}.${strain.verb}-${strain.house}`), strain.kind, scaled(-5, level), { level, planet: lord, house: strain.house }));
      }
    });
  },

  /** The 7th house and Venus. */
  relationship: (c) => {
    const venus = c.fromMoon("venus");
    if (venus !== null) {
      c.add(c.isFavourable("venus", venus) ? c.favourable("venus", "venus", venus, 5) : c.unfavourable("venus", "venus", venus, -4));
      c.bindus("venus", "venus");
      c.retrograde("venus.retrograde", "venus", -2);
    }

    const jupiter = c.fromMoon("jupiter");
    if (jupiter !== null && c.isFavourable("jupiter", jupiter)) c.add(c.favourable("jupiter", "jupiter", jupiter, 7));
    else if (jupiter === 6 || jupiter === 8 || jupiter === 12) c.add(c.unfavourable("jupiter", "jupiter", jupiter, -3));

    const saturn = c.fromMoon("saturn");
    if (saturn !== null) {
      if (saturn === 7) c.add(c.unfavourable("saturn", "saturn", 7, -6));
      else if (SADE_SATI_PHASE[saturn]) {
        const phase = SADE_SATI_PHASE[saturn]!;
        c.add(reason(c.id(`saturn.sade-sati-${phase}`), "sade-sati", -5, { planet: "saturn", house: saturn, phase }));
      } else if (c.isFavourable("saturn", saturn)) c.add(c.favourable("saturn", "saturn", saturn, 3));
    }

    // Either node on the Ascendant-Descendant axis (one implies the other in
    // the sky; checking both keeps the rule exact for any input).
    const nodeOnAxis = (["rahu", "ketu"] as const)
      .map((planet) => ({ planet, house: c.fromLagna(planet) }))
      .find((entry) => entry.house === 1 || entry.house === 7);
    if (nodeOnAxis && nodeOnAxis.house !== null) {
      c.add(reason(c.id("nodes.axis-1-7"), "nodes-on-axis", -6, { planet: nodeOnAxis.planet, house: nodeOnAxis.house }, "app"));
    }
    if (c.fromMoon("rahu") === 1) c.add(reason(c.id("rahu.over-moon"), "node-over-moon", -4, { planet: "rahu", house: 1 }));

    const mars = c.fromMoon("mars");
    if (mars !== null) {
      if (mars === 1 || mars === 7) c.add(c.unfavourable("mars", "mars", mars, -4));
      else if (c.sky.sign.mars === c.natal.natalSign.venus) {
        c.add(reason(c.id("mars.over-natal-venus"), "over-natal-venus", -4, { planet: "mars" }, "app"));
      } else if (c.isFavourable("mars", mars)) c.add(c.favourable("mars", "mars", mars, 2));
    }

    c.dasha(({ level, lord }) => {
      if (lord === "venus") c.add(reason(c.id(`dasha.${level}.karaka`), "dasha-karaka", scaled(5, level), { level, planet: lord }));
      else if (c.natal.ownedHouses[lord].includes(7)) c.add(reason(c.id(`dasha.${level}.owns-7`), "dasha-owns", scaled(5, level), { level, planet: lord, house: 7 }));
      else if (c.natal.natalHouse[lord] === 7) c.add(reason(c.id(`dasha.${level}.occupies-7`), "dasha-occupies", scaled(5, level), { level, planet: lord, house: 7 }));
      const occupied = c.natal.natalHouse[lord];
      if (occupied === 6 || occupied === 12) {
        c.add(reason(c.id(`dasha.${level}.occupies-${occupied}`), "dasha-occupies", scaled(-3, level), { level, planet: lord, house: occupied }));
      }
    });
  },

  /** The 1st house; the Sun, Mars and Saturn. */
  vitality: (c) => {
    const sun = c.fromMoon("sun");
    if (sun !== null) {
      c.add(c.isFavourable("sun", sun) ? c.favourable("sun", "sun", sun, 5) : c.unfavourable("sun", "sun", sun, -3));
      c.bindus("sun", "sun");
      const sign = c.sky.sign.sun!;
      const points = c.natal.ashtakavarga.sarva[sign];
      if (points >= 28) c.add(reason(c.id("sun.sav-high"), "sav", 2, { planet: "sun", points }));
      else if (points < 25) c.add(reason(c.id("sun.sav-low"), "sav", -2, { planet: "sun", points }));
    }

    const mars = c.fromMoon("mars");
    if (mars !== null) {
      if (c.isFavourable("mars", mars)) c.add(c.favourable("mars", "mars", mars, 4));
      else if ([1, 4, 5, 7, 8, 12].includes(mars)) c.add(c.unfavourable("mars", "mars", mars, -4));
      c.retrograde("mars.retrograde", "mars", -2);
    }

    const frictional = saturnFriction(c, { rising: -5, peak: -8, setting: -5, ashtama: -8, ardhashtama: -5 });
    const saturn = c.fromMoon("saturn");
    if (!frictional && saturn !== null && c.isFavourable("saturn", saturn)) {
      c.add(c.favourable("saturn", "saturn", saturn, 4));
    }

    const jupiter = c.fromMoon("jupiter");
    if (jupiter !== null && c.isFavourable("jupiter", jupiter)) c.add(c.favourable("jupiter", "jupiter", jupiter, 6));
    else if (jupiter === 6 || jupiter === 8 || jupiter === 12) c.add(c.unfavourable("jupiter", "jupiter", jupiter, -3));

    const moon = c.fromMoon("moon");
    if (moon !== null) {
      if (moon === 8) c.add(reason(c.id("moon.chandrashtama"), "chandrashtama", -6, { planet: "moon", house: 8 }));
      else if (moon === 12) c.add(c.unfavourable("moon", "moon", 12, -3));
      else if (MOON_GOOD.has(moon)) c.add(c.favourable("moon", "moon", moon, 3));
    }

    c.dasha(({ level, lord }) => {
      const occupied = c.natal.natalHouse[lord];
      if (occupied === 6 || occupied === 8 || occupied === 12) {
        c.add(reason(c.id(`dasha.${level}.occupies-${occupied}`), "dasha-occupies", scaled(-5, level), { level, planet: lord, house: occupied }));
      }
      if (lord === c.natal.lagnaLord) {
        c.add(reason(c.id(`dasha.${level}.lagna-lord`), "dasha-lagna-lord", scaled(4, level), { level, planet: lord }));
      } else if (occupied === 1 || occupied === 9 || occupied === 10) {
        c.add(reason(c.id(`dasha.${level}.occupies-${occupied}`), "dasha-occupies", scaled(4, level), { level, planet: lord, house: occupied }));
      }
    });
  },
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function evaluate(curve: LifeCurveId, sky: SkyState, natal: NatalCurveContext): CurveValue {
  const context = new RuleContext(curve, sky, natal);
  RULES[curve](context);
  const total = context.reasons.reduce((sum, entry) => sum + entry.contribution, 0);
  return { value: clampScore(LIFE_CURVE_BASELINE + total), reasons: context.reasons };
}

export type SkySegments = Readonly<Partial<Record<GrahaId, readonly MotionSegment[]>>>;

function skyAt(
  segments: SkySegments,
  zoom: ZoomLevel,
  ms: number,
  dashaPath: readonly DashaLord[],
): SkyState {
  const sign: Partial<Record<GrahaId, number>> = {};
  const retrograde: Partial<Record<GrahaId, boolean>> = {};
  for (const planet of ZOOM_PLANETS[zoom]) {
    const list = segments[planet];
    if (!list) continue;
    const segment = segmentAt(list, ms);
    if (!segment) continue;
    sign[planet] = segment.signIndex;
    retrograde[planet] = segment.retrograde;
  }
  const deepest = ZOOM_DASHA_LEVEL[zoom];
  return {
    sign,
    retrograde,
    dasha: dashaPath.slice(0, deepest).map((lord, index) => ({ level: (index + 1) as DashaLevel, lord })),
  };
}

/** The four curve values at one instant, with every contribution. */
export function lifeCurvesAt(
  natal: NatalCurveContext,
  segments: SkySegments,
  zoom: ZoomLevel,
  ms: number,
): Record<LifeCurveId, CurveValue> {
  const path = dashaStackAt(natal.clock, ms).map((span) => span.lord);
  const sky = skyAt(segments, zoom, ms, path);
  return Object.fromEntries(
    LIFE_CURVE_IDS.map((curve) => [curve, evaluate(curve, sky, natal)]),
  ) as Record<LifeCurveId, CurveValue>;
}

function sameReasons(a: readonly CurveReason[], b: readonly CurveReason[]): boolean {
  return (
    a.length === b.length &&
    a.every((entry, index) => entry.ruleId === b[index].ruleId && entry.contribution === b[index].contribution)
  );
}

/**
 * Step functions of the four curves over [fromMs, toMs). Values change only
 * where a body of this zoom level changes sign or direction, or a Dasha period
 * of this zoom level begins, so each stretch between those instants is
 * evaluated once at its midpoint and drawn as a flat step.
 */
export function lifeCurveSteps(
  natal: NatalCurveContext,
  segments: SkySegments,
  zoom: ZoomLevel,
  fromMs: number,
  toMs: number,
): Record<LifeCurveId, CurveStep[]> {
  const empty = Object.fromEntries(LIFE_CURVE_IDS.map((curve) => [curve, []])) as unknown as Record<
    LifeCurveId,
    CurveStep[]
  >;
  if (!(toMs > fromMs)) return empty;

  const dashaSpans: DashaSpan[] = dashaSpansInRange(natal.clock, ZOOM_DASHA_LEVEL[zoom], fromMs, toMs);
  const cuts = new Set<number>([fromMs, toMs]);
  for (const span of dashaSpans) {
    if (span.startMs > fromMs && span.startMs < toMs) cuts.add(span.startMs);
  }
  for (const planet of ZOOM_PLANETS[zoom]) {
    for (const segment of segments[planet] ?? []) {
      if (segment.startMs > fromMs && segment.startMs < toMs) cuts.add(segment.startMs);
      // A table that ends inside the range (the Moon's window) also changes
      // the inputs there: its rules stop applying.
      if (segment.endMs > fromMs && segment.endMs < toMs) cuts.add(segment.endMs);
    }
  }
  const times = [...cuts].sort((a, b) => a - b);

  const steps = empty;
  let spanIndex = 0;
  for (let index = 0; index < times.length - 1; index += 1) {
    const startMs = times[index];
    const endMs = times[index + 1];
    const middle = (startMs + endMs) / 2;
    while (spanIndex < dashaSpans.length - 1 && dashaSpans[spanIndex].endMs <= middle) spanIndex += 1;
    const span = dashaSpans[spanIndex];
    const path = span && middle >= span.startMs && middle < span.endMs ? span.path : [];
    const sky = skyAt(segments, zoom, middle, path);

    for (const curve of LIFE_CURVE_IDS) {
      const { value, reasons } = evaluate(curve, sky, natal);
      const list = steps[curve];
      const previous = list.at(-1);
      if (previous && previous.endMs === startMs && sameReasons(previous.reasons, reasons)) {
        list[list.length - 1] = { ...previous, endMs };
      } else {
        list.push({ startMs, endMs, value, reasons });
      }
    }
  }
  return steps;
}

/** Score words, reused from the transit view's thresholds. */
export type CurveBand = "intensive" | "reflective" | "steady" | "supportive" | "highly-supportive";

export function curveBand(value: number): CurveBand {
  if (value < 35) return "intensive";
  if (value < 50) return "reflective";
  if (value < 65) return "steady";
  if (value < 80) return "supportive";
  return "highly-supportive";
}

/** Contributions that differ between two neighbouring steps, for the inspector. */
export function reasonDifference(
  before: readonly CurveReason[],
  after: readonly CurveReason[],
): { readonly added: CurveReason[]; readonly removed: CurveReason[] } {
  const key = (entry: CurveReason) => `${entry.ruleId}:${entry.contribution}`;
  const beforeKeys = new Set(before.map(key));
  const afterKeys = new Set(after.map(key));
  return {
    added: after.filter((entry) => !beforeKeys.has(key(entry))),
    removed: before.filter((entry) => !afterKeys.has(key(entry))),
  };
}
