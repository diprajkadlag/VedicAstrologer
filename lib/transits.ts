import {
  GRAHA_IDS,
  calculateVedicChart,
  type GrahaId,
  type GrahaPosition,
  type HouseNumber,
  type NakshatraName,
  type VedicChart,
} from "./astro/ephemeris";
import {
  getRasiDisplayName,
  type SanskritRasiName,
} from "./astro/display";
import { normalizeAbsoluteInstant } from "./astro/instants";

/**
 * Deterministic Gochara (transit) analysis.
 *
 * The astronomical placements come from the same Lahiri sidereal ephemeris as
 * the natal chart. The interpretive scores below are transparent, bounded rule
 * summaries: they are not probabilities or predictions of concrete events.
 */

export const TRANSIT_RULESET_VERSION = "gochara-v1" as const;
export const TRANSIT_SCORE_BASELINE = 50;
export const TRANSIT_SCORE_MIN = 0;
export const TRANSIT_SCORE_MAX = 100;

export type TransitScoreBand =
  | "intensive"
  | "reflective"
  | "steady"
  | "supportive"
  | "highly-supportive";

export interface TransitObserverLocation {
  latitude: number;
  longitude: number;
  elevationMeters?: number;
}

export interface TransitAnalysisInput {
  natalChart: VedicChart;
  /** A valid absolute instant, or an ISO-8601 string with an explicit offset. */
  asOf: Date | string;
  /** Defaults to the natal chart location. */
  location?: TransitObserverLocation;
}

export interface TransitRuleReason {
  /** Stable identifier suitable for UI keys and analytics. */
  ruleId: string;
  contribution: number;
  explanation: string;
}

export interface ScoredTransitTheme {
  /** Always 50; exposed so the UI can explain how the score was derived. */
  baseline: typeof TRANSIT_SCORE_BASELINE;
  /** Baseline plus rule contributions, clamped to the inclusive 0–100 range. */
  score: number;
  band: TransitScoreBand;
  headline: string;
  summary: string;
  focus: readonly string[];
  reasons: readonly TransitRuleReason[];
}

export interface TransitPosition {
  id: GrahaId;
  name: string;
  /** Sanskrit Rasi label for presentation; use signIndex for calculations. */
  sign: SanskritRasiName;
  signIndex: number;
  degreeInSign: number;
  siderealLongitudeDeg: number;
  nakshatra: NakshatraName;
  nakshatraPada: 1 | 2 | 3 | 4;
  motion: GrahaPosition["motion"];
  retrograde: boolean;
  /** Whole-sign house counted from the natal Ascendant. */
  houseFromLagna: HouseNumber;
  /** Whole-sign house counted from the natal Moon sign (Janma Rasi). */
  houseFromMoon: HouseNumber;
}

export interface DailyTransitInsight extends ScoredTransitTheme {
  moonSign: SanskritRasiName;
  moonNakshatra: NakshatraName;
  moonNakshatraPada: 1 | 2 | 3 | 4;
  moonNakshatraLord: GrahaId;
  moonHouseFromLagna: HouseNumber;
  moonHouseFromJanmaRasi: HouseNumber;
}

export interface MonthlyTransitInsight extends ScoredTransitTheme {
  sunSign: SanskritRasiName;
  mercurySign: SanskritRasiName;
  sunHouseFromLagna: HouseNumber;
  sunHouseFromJanmaRasi: HouseNumber;
  mercuryHouseFromLagna: HouseNumber;
  mercuryHouseFromJanmaRasi: HouseNumber;
  mercuryRetrograde: boolean;
}

export type MajorTransitPlanet = "jupiter" | "saturn";
export type TransitNoticeIntensity = "background" | "notable" | "major";

export interface MajorTransitNotice {
  planet: MajorTransitPlanet;
  sign: SanskritRasiName;
  houseFromLagna: HouseNumber;
  houseFromJanmaRasi: HouseNumber;
  activatedLagnaTheme: string;
  activatedMoonTheme: string;
  intensity: TransitNoticeIntensity;
  /** Reflective support score, not an event probability. */
  score: number;
  headline: string;
  summary: string;
  focus: readonly string[];
  reasons: readonly TransitRuleReason[];
}

export interface TransitAnalysis {
  asOf: string;
  natalInstant: string;
  observerLocation: Required<TransitObserverLocation>;
  natalReference: {
    lagnaSign: SanskritRasiName;
    janmaRasi: SanskritRasiName;
    moonNakshatra: NakshatraName;
  };
  positions: readonly TransitPosition[];
  daily: DailyTransitInsight;
  monthly: MonthlyTransitInsight;
  majorTransits: {
    jupiter: MajorTransitNotice;
    saturn: MajorTransitNotice;
  };
  metadata: {
    ruleSet: typeof TRANSIT_RULESET_VERSION;
    zodiac: "sidereal";
    ayanamsa: VedicChart["ayanamsa"]["model"];
    houseReference: "natal whole-sign Lagna and Janma Rasi";
    scoreRange: readonly [typeof TRANSIT_SCORE_MIN, typeof TRANSIT_SCORE_MAX];
    scoreBaseline: typeof TRANSIT_SCORE_BASELINE;
    disclaimer: string;
  };
}

interface HouseTransitRule {
  title: string;
  theme: string;
  focus: readonly string[];
  dailyMoonContribution: number;
  sunContribution: number;
  mercuryContribution: number;
}

const HOUSE_TRANSIT_RULES = [
  { title: "Self and vitality", theme: "identity, body, initiative, and personal direction", focus: ["notice your energy", "choose one personal priority"], dailyMoonContribution: 5, sunContribution: 4, mercuryContribution: 3 },
  { title: "Resources and voice", theme: "resources, values, speech, food, and family patterns", focus: ["speak deliberately", "review practical resources"], dailyMoonContribution: -6, sunContribution: -4, mercuryContribution: 7 },
  { title: "Courage and skills", theme: "initiative, communication, skills, siblings, and short journeys", focus: ["start a manageable task", "practice a useful skill"], dailyMoonContribution: 12, sunContribution: 8, mercuryContribution: -2 },
  { title: "Home and foundations", theme: "home, emotional foundations, care, property, and inner steadiness", focus: ["restore your base", "make space for emotional clarity"], dailyMoonContribution: -8, sunContribution: -5, mercuryContribution: 6 },
  { title: "Creativity and discernment", theme: "creativity, learning, counsel, children, and considered risk", focus: ["develop an idea", "separate insight from impulse"], dailyMoonContribution: 2, sunContribution: -3, mercuryContribution: -2 },
  { title: "Service and problem-solving", theme: "service, routines, health habits, debts, and competition", focus: ["resolve a practical obstacle", "strengthen a daily routine"], dailyMoonContribution: 10, sunContribution: 10, mercuryContribution: 7 },
  { title: "Partnership and exchange", theme: "partnership, agreements, clients, and reciprocal exchange", focus: ["listen before responding", "clarify an agreement"], dailyMoonContribution: 5, sunContribution: -4, mercuryContribution: 0 },
  { title: "Depth and transformation", theme: "shared resources, research, vulnerability, endings, and renewal", focus: ["leave margin for complexity", "investigate beneath the surface"], dailyMoonContribution: -14, sunContribution: -7, mercuryContribution: 5 },
  { title: "Meaning and guidance", theme: "meaning, teachers, ethics, higher learning, and long journeys", focus: ["revisit the larger purpose", "learn from a trusted source"], dailyMoonContribution: 4, sunContribution: -2, mercuryContribution: -4 },
  { title: "Work and contribution", theme: "vocation, responsibility, visibility, and public contribution", focus: ["complete visible work", "define the next responsibility"], dailyMoonContribution: 10, sunContribution: 8, mercuryContribution: 6 },
  { title: "Gains and community", theme: "networks, gains, aspirations, patrons, and collective effort", focus: ["connect with allies", "advance a long-range aim"], dailyMoonContribution: 14, sunContribution: 10, mercuryContribution: 8 },
  { title: "Rest and release", theme: "rest, retreat, expenses, distant places, and conscious release", focus: ["protect recovery time", "close an unfinished loop"], dailyMoonContribution: -10, sunContribution: -8, mercuryContribution: -4 },
] as const satisfies readonly HouseTransitRule[];

const NAKSHATRA_LORD_RULES = {
  ketu: { contribution: -2, tone: "simplification and inward discrimination", focus: "remove one distraction" },
  venus: { contribution: 5, tone: "relationship, harmony, craft, and receptivity", focus: "refine a relationship or creative detail" },
  sun: { contribution: 3, tone: "clarity, visibility, authority, and purpose", focus: "act from a clearly stated intention" },
  moon: { contribution: 4, tone: "care, responsiveness, memory, and belonging", focus: "make room for an honest emotional check-in" },
  mars: { contribution: 1, tone: "decisive effort, protection, and technical action", focus: "channel urgency into one concrete action" },
  rahu: { contribution: -3, tone: "experimentation, appetite, disruption, and unfamiliar territory", focus: "test assumptions before amplifying them" },
  jupiter: { contribution: 7, tone: "learning, perspective, guidance, and expansion", focus: "turn experience into a teachable principle" },
  saturn: { contribution: -1, tone: "patience, structure, duty, and durable effort", focus: "honour a boundary or realistic sequence" },
  mercury: { contribution: 6, tone: "analysis, language, trade, and adaptable skill", focus: "write down the key facts before deciding" },
} as const satisfies Readonly<Record<GrahaId, { contribution: number; tone: string; focus: string }>>;

const SATURN_SUPPORT_BY_MOON_HOUSE: Readonly<Record<HouseNumber, number>> = {
  1: -8, 2: -8, 3: 8, 4: -6, 5: -3, 6: 9,
  7: -4, 8: -7, 9: -3, 10: 2, 11: 10, 12: -8,
};

const JUPITER_SUPPORT_BY_MOON_HOUSE: Readonly<Record<HouseNumber, number>> = {
  1: 1, 2: 10, 3: -2, 4: -2, 5: 10, 6: -3,
  7: 9, 8: -3, 9: 10, 10: 0, 11: 11, 12: -3,
};

const ANGULAR_OR_TRINAL_HOUSES = new Set<HouseNumber>([1, 4, 5, 7, 9, 10]);
const SADE_SATI_HOUSES = new Set<HouseNumber>([12, 1, 2]);

function requireAbsoluteInstant(value: Date | string, label: string): Date {
  return new Date(normalizeAbsoluteInstant(value, label));
}

function assertSignIndex(value: unknown, label: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 11) {
    throw new RangeError(`${label} must be an integer from 0 through 11.`);
  }
}

function requireNatalPlanet(chart: VedicChart, id: GrahaId): GrahaPosition {
  const planet = chart.planets.find((candidate) => candidate.id === id);
  if (!planet) throw new TypeError(`natalChart is missing the ${id} placement.`);
  assertSignIndex(planet.sign?.index, `natalChart ${id} sign index`);
  return planet;
}

function validateNatalChart(chart: VedicChart): { instant: Date; moon: GrahaPosition } {
  if (!chart || typeof chart !== "object") {
    throw new TypeError("natalChart must be a calculated VedicChart.");
  }
  const instant = requireAbsoluteInstant(chart.instant, "natalChart.instant");
  if (chart.coordinateSystem !== "sidereal" || chart.houseSystem !== "whole-sign") {
    throw new TypeError("natalChart must use sidereal coordinates and whole-sign houses.");
  }
  assertSignIndex(chart.ascendant?.sign?.index, "natalChart ascendant sign index");
  if (!Array.isArray(chart.planets)) {
    throw new TypeError("natalChart.planets must be an array.");
  }
  for (const id of GRAHA_IDS) requireNatalPlanet(chart, id);
  return { instant, moon: requireNatalPlanet(chart, "moon") };
}

function finiteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function observerLocation(
  natalChart: VedicChart,
  override?: TransitObserverLocation,
): Required<TransitObserverLocation> {
  const source = override ?? natalChart.location;
  const latitude = finiteNumber(source.latitude, "location.latitude");
  const longitude = finiteNumber(source.longitude, "location.longitude");
  const elevationMeters = finiteNumber(source.elevationMeters ?? 0, "location.elevationMeters");
  if (latitude <= -90 || latitude >= 90) {
    throw new RangeError("location.latitude must be strictly between -90 and 90 degrees.");
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError("location.longitude must be between -180 and 180 degrees.");
  }
  if (elevationMeters < -500 || elevationMeters > 100_000) {
    throw new RangeError("location.elevationMeters must be between -500 and 100000 metres.");
  }
  return { latitude, longitude, elevationMeters };
}

/** Counts whole signs inclusively, so the reference sign itself is house 1. */
export function relativeWholeSignHouse(
  transitSignIndex: number,
  referenceSignIndex: number,
): HouseNumber {
  assertSignIndex(transitSignIndex, "transitSignIndex");
  assertSignIndex(referenceSignIndex, "referenceSignIndex");
  return (((transitSignIndex - referenceSignIndex + 12) % 12) + 1) as HouseNumber;
}

function clampScore(score: number): number {
  return Math.max(TRANSIT_SCORE_MIN, Math.min(TRANSIT_SCORE_MAX, Math.round(score)));
}

export function transitScoreBand(score: number): TransitScoreBand {
  if (!Number.isFinite(score) || score < TRANSIT_SCORE_MIN || score > TRANSIT_SCORE_MAX) {
    throw new RangeError("score must be a finite number from 0 through 100.");
  }
  if (score < 35) return "intensive";
  if (score < 50) return "reflective";
  if (score < 65) return "steady";
  if (score < 80) return "supportive";
  return "highly-supportive";
}

function scored(reasons: readonly TransitRuleReason[]): Pick<ScoredTransitTheme, "baseline" | "score" | "band" | "reasons"> {
  const score = clampScore(
    TRANSIT_SCORE_BASELINE + reasons.reduce((total, reason) => total + reason.contribution, 0),
  );
  return {
    baseline: TRANSIT_SCORE_BASELINE,
    score,
    band: transitScoreBand(score),
    reasons,
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function requireTransitPosition(positions: readonly TransitPosition[], id: GrahaId): TransitPosition {
  const position = positions.find((candidate) => candidate.id === id);
  if (!position) throw new Error(`Calculated transit chart is missing ${id}.`);
  return position;
}

function dailyInsight(
  moon: TransitPosition,
  transitMoon: GrahaPosition,
): DailyTransitInsight {
  const houseRule = HOUSE_TRANSIT_RULES[moon.houseFromMoon - 1];
  const lordRule = NAKSHATRA_LORD_RULES[transitMoon.nakshatra.lord];
  const padaContribution = ([0, 2, 1, -1] as const)[transitMoon.nakshatra.pada - 1];
  const reasons: TransitRuleReason[] = [
    {
      ruleId: `daily.moon-house.${moon.houseFromMoon}`,
      contribution: houseRule.dailyMoonContribution,
      explanation: `Transit Moon is ${moon.houseFromMoon} from the natal Moon, emphasizing ${houseRule.theme}.`,
    },
    {
      ruleId: `daily.nakshatra-lord.${transitMoon.nakshatra.lord}`,
      contribution: lordRule.contribution,
      explanation: `${transitMoon.nakshatra.name} is ${transitMoon.nakshatra.lord}-ruled, adding themes of ${lordRule.tone}.`,
    },
    {
      ruleId: `daily.nakshatra-pada.${transitMoon.nakshatra.pada}`,
      contribution: padaContribution,
      explanation: `Pada ${transitMoon.nakshatra.pada} supplies the fixed rule adjustment of ${padaContribution >= 0 ? "+" : ""}${padaContribution}.`,
    },
  ];

  return {
    ...scored(reasons),
    headline: `${transitMoon.nakshatra.name} Moon · ${houseRule.title}`,
    summary: `The day's symbolic focus combines ${transitMoon.nakshatra.name}'s ${lordRule.tone} with ${houseRule.theme}.`,
    focus: unique([...houseRule.focus, lordRule.focus]),
    moonSign: moon.sign,
    moonNakshatra: transitMoon.nakshatra.name,
    moonNakshatraPada: transitMoon.nakshatra.pada,
    moonNakshatraLord: transitMoon.nakshatra.lord,
    moonHouseFromLagna: moon.houseFromLagna,
    moonHouseFromJanmaRasi: moon.houseFromMoon,
  };
}

function monthlyInsight(
  sun: TransitPosition,
  mercury: TransitPosition,
): MonthlyTransitInsight {
  const sunRule = HOUSE_TRANSIT_RULES[sun.houseFromLagna - 1];
  const mercuryRule = HOUSE_TRANSIT_RULES[mercury.houseFromMoon - 1];
  const mercuryMotionContribution = mercury.retrograde ? -5 : 2;
  const reasons: TransitRuleReason[] = [
    {
      ruleId: `monthly.sun-from-lagna.${sun.houseFromLagna}`,
      contribution: sunRule.sunContribution,
      explanation: `Sun activates natal house ${sun.houseFromLagna} from Lagna: ${sunRule.theme}.`,
    },
    {
      ruleId: `monthly.mercury-from-moon.${mercury.houseFromMoon}`,
      contribution: mercuryRule.mercuryContribution,
      explanation: `Mercury is house ${mercury.houseFromMoon} from the natal Moon, shaping how ${mercuryRule.theme} is processed and communicated.`,
    },
    {
      ruleId: mercury.retrograde ? "monthly.mercury.retrograde" : "monthly.mercury.direct",
      contribution: mercuryMotionContribution,
      explanation: mercury.retrograde
        ? "Mercury's apparent retrograde motion favours review, correction, and extra verification."
        : "Mercury's direct motion supports sequential communication and implementation.",
    },
  ];

  return {
    ...scored(reasons),
    headline: `Sun in ${sun.sign} · Mercury in ${mercury.sign}`,
    summary: `This month's broad focus joins ${sunRule.theme} with Mercury's attention to ${mercuryRule.theme}.`,
    focus: unique([...sunRule.focus, ...mercuryRule.focus]),
    sunSign: sun.sign,
    mercurySign: mercury.sign,
    sunHouseFromLagna: sun.houseFromLagna,
    sunHouseFromJanmaRasi: sun.houseFromMoon,
    mercuryHouseFromLagna: mercury.houseFromLagna,
    mercuryHouseFromJanmaRasi: mercury.houseFromMoon,
    mercuryRetrograde: mercury.retrograde,
  };
}

function noticeIntensity(planet: MajorTransitPlanet, lagnaHouse: HouseNumber, moonHouse: HouseNumber): TransitNoticeIntensity {
  if (planet === "saturn" && SADE_SATI_HOUSES.has(moonHouse)) return "major";
  if (ANGULAR_OR_TRINAL_HOUSES.has(lagnaHouse) || [1, 4, 7, 8, 10].includes(moonHouse)) return "notable";
  return "background";
}

function majorTransitNotice(
  planet: MajorTransitPlanet,
  position: TransitPosition,
): MajorTransitNotice {
  const lagnaRule = HOUSE_TRANSIT_RULES[position.houseFromLagna - 1];
  const moonRule = HOUSE_TRANSIT_RULES[position.houseFromMoon - 1];
  const isSaturn = planet === "saturn";
  const moonContribution = isSaturn
    ? SATURN_SUPPORT_BY_MOON_HOUSE[position.houseFromMoon]
    : JUPITER_SUPPORT_BY_MOON_HOUSE[position.houseFromMoon];
  const lagnaContribution = ANGULAR_OR_TRINAL_HOUSES.has(position.houseFromLagna)
    ? (isSaturn ? 3 : 7)
    : 0;
  const reasons: TransitRuleReason[] = [
    {
      ruleId: `major.${planet}.moon-house.${position.houseFromMoon}`,
      contribution: moonContribution,
      explanation: `${planet === "jupiter" ? "Jupiter" : "Saturn"} is house ${position.houseFromMoon} from Janma Rasi, activating ${moonRule.theme}.`,
    },
    {
      ruleId: `major.${planet}.lagna-house.${position.houseFromLagna}`,
      contribution: lagnaContribution,
      explanation: `${planet === "jupiter" ? "Jupiter" : "Saturn"} occupies natal house ${position.houseFromLagna} from Lagna, emphasizing ${lagnaRule.theme}.${lagnaContribution ? " This angular or trinal placement receives the stated rule adjustment." : " No angular/trinal adjustment applies."}`,
    },
  ];

  if (isSaturn && SADE_SATI_HOUSES.has(position.houseFromMoon)) {
    reasons.push({
      ruleId: `major.saturn.sade-sati-zone.${position.houseFromMoon}`,
      contribution: -5,
      explanation: `Saturn is ${position.houseFromMoon} from the natal Moon, within the traditional three-sign Sade Sati zone; this flags sustained responsibility, not a guaranteed adverse event.`,
    });
  }

  const score = scored(reasons).score;
  const name = isSaturn ? "Saturn" : "Jupiter";
  const process = isSaturn
    ? "structure, boundaries, patience, and consequences"
    : "growth, guidance, coherence, and opportunity";

  return {
    planet,
    sign: position.sign,
    houseFromLagna: position.houseFromLagna,
    houseFromJanmaRasi: position.houseFromMoon,
    activatedLagnaTheme: lagnaRule.title,
    activatedMoonTheme: moonRule.title,
    intensity: noticeIntensity(planet, position.houseFromLagna, position.houseFromMoon),
    score,
    headline: `${name} activates ${lagnaRule.title.toLowerCase()}`,
    summary: `${name} in ${position.sign} asks you to view ${lagnaRule.theme} through ${process}; from the Moon it also highlights ${moonRule.theme}.`,
    focus: unique([...lagnaRule.focus, ...moonRule.focus]),
    reasons,
  };
}

/**
 * Calculates sidereal transit placements at `asOf` and compares every sign to
 * the natal whole-sign Lagna and Janma Rasi. Calling this function twice with
 * identical input returns structurally identical output.
 */
export function calculateTransitAnalysis(input: TransitAnalysisInput): TransitAnalysis {
  if (!input || typeof input !== "object") {
    throw new TypeError("Transit analysis input is required.");
  }
  const natal = validateNatalChart(input.natalChart);
  const asOf = requireAbsoluteInstant(input.asOf, "asOf");
  const location = observerLocation(input.natalChart, input.location);
  const transitChart = calculateVedicChart({ instant: asOf, ...location });
  const lagnaSignIndex = input.natalChart.ascendant.sign.index;
  const moonSignIndex = natal.moon.sign.index;

  const positions = transitChart.planets.map<TransitPosition>((planet) => ({
    id: planet.id,
    name: planet.name,
    sign: getRasiDisplayName(planet.sign.name),
    signIndex: planet.sign.index,
    degreeInSign: planet.sign.degreeDeg,
    siderealLongitudeDeg: planet.siderealLongitudeDeg,
    nakshatra: planet.nakshatra.name,
    nakshatraPada: planet.nakshatra.pada,
    motion: planet.motion,
    retrograde: planet.retrograde,
    houseFromLagna: relativeWholeSignHouse(planet.sign.index, lagnaSignIndex),
    houseFromMoon: relativeWholeSignHouse(planet.sign.index, moonSignIndex),
  }));

  const transitMoon = transitChart.planets.find((planet) => planet.id === "moon");
  if (!transitMoon) throw new Error("Calculated transit chart is missing moon.");
  const moon = requireTransitPosition(positions, "moon");
  const sun = requireTransitPosition(positions, "sun");
  const mercury = requireTransitPosition(positions, "mercury");
  const jupiter = requireTransitPosition(positions, "jupiter");
  const saturn = requireTransitPosition(positions, "saturn");

  return {
    asOf: asOf.toISOString(),
    natalInstant: natal.instant.toISOString(),
    observerLocation: location,
    natalReference: {
      lagnaSign: getRasiDisplayName(input.natalChart.ascendant.sign.name),
      janmaRasi: getRasiDisplayName(natal.moon.sign.name),
      moonNakshatra: natal.moon.nakshatra.name,
    },
    positions,
    daily: dailyInsight(moon, transitMoon),
    monthly: monthlyInsight(sun, mercury),
    majorTransits: {
      jupiter: majorTransitNotice("jupiter", jupiter),
      saturn: majorTransitNotice("saturn", saturn),
    },
    metadata: {
      ruleSet: TRANSIT_RULESET_VERSION,
      zodiac: "sidereal",
      ayanamsa: transitChart.ayanamsa.model,
      houseReference: "natal whole-sign Lagna and Janma Rasi",
      scoreRange: [TRANSIT_SCORE_MIN, TRANSIT_SCORE_MAX],
      scoreBaseline: TRANSIT_SCORE_BASELINE,
      disclaimer: "Gochara themes are symbolic, deterministic rule summaries—not scientific forecasts or guarantees. Use them for reflection, not consequential decisions.",
    },
  };
}
