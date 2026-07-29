import type {
  GrahaId,
  GrahaPosition,
  HouseNumber,
  HousePosition,
  VedicChart,
} from "@/lib/astro/ephemeris";
import { RASI_DISPLAY_ABBREVIATIONS } from "../../lib/astro/display";
import {
  getLocalizedGrahaName,
  getLocalizedRasiName,
} from "../../lib/astro/localizedNames";
import {
  defineMessages,
  formatMessage,
  type AppLocale,
} from "../../lib/i18n";

export interface PlanetPresentation {
  abbreviation: string;
  color: string;
  glyph: string;
}

export const PLANET_PRESENTATION: Record<GrahaId, PlanetPresentation> = {
  sun: { abbreviation: "Su", color: "#fbbf24", glyph: "☉" },
  moon: { abbreviation: "Mo", color: "#e2e8f0", glyph: "☽" },
  mercury: { abbreviation: "Me", color: "#5eead4", glyph: "☿" },
  venus: { abbreviation: "Ve", color: "#f9a8d4", glyph: "♀" },
  mars: { abbreviation: "Ma", color: "#fb7185", glyph: "♂" },
  jupiter: { abbreviation: "Ju", color: "#fde047", glyph: "♃" },
  saturn: { abbreviation: "Sa", color: "#93c5fd", glyph: "♄" },
  rahu: { abbreviation: "Ra", color: "#c4b5fd", glyph: "☊" },
  ketu: { abbreviation: "Ke", color: "#fdba74", glyph: "☋" },
};

export { RASI_DISPLAY_ABBREVIATIONS };

const CHART_DESCRIPTION_MESSAGES = defineMessages({
  en: {
    empty: "no grahas",
    house: "Bhava {house}, {rasi}, {occupants}",
    planet:
      "{planet}, {rasi}, Bhava {house}, {degrees} degrees{retrograde}",
    retrograde: ", retrograde",
  },
  hi: {
    empty: "कोई ग्रह नहीं",
    house: "भाव {house}, {rasi}, {occupants}",
    planet: "{planet}, {rasi}, भाव {house}, {degrees} अंश{retrograde}",
    retrograde: ", वक्री",
  },
  mr: {
    empty: "एकही ग्रह नाही",
    house: "भाव {house}, {rasi}, {occupants}",
    planet: "{planet}, {rasi}, भाव {house}, {degrees} अंश{retrograde}",
    retrograde: ", वक्री",
  },
  de: {
    empty: "keine Grahas",
    house: "Bhava {house}, {rasi}, {occupants}",
    planet:
      "{planet}, {rasi}, Bhava {house}, {degrees} Grad{retrograde}",
    retrograde: ", rückläufig",
  },
});

export function getChartRasiAbbreviation(
  signIndex: number,
  signName: GrahaPosition["sign"]["name"],
  locale: AppLocale,
): string {
  return locale === "en"
    ? RASI_DISPLAY_ABBREVIATIONS[signIndex]
    : getLocalizedRasiName(signName, locale);
}

export const HOUSE_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const satisfies readonly HouseNumber[];

export interface SouthIndianSignCell {
  column: 0 | 1 | 2 | 3;
  row: 0 | 1 | 2 | 3;
  signIndex: number;
}

/**
 * South Indian charts keep signs fixed. The zodiac advances clockwise from
 * Mesha in the second cell of the top row.
 */
export const SOUTH_INDIAN_SIGN_CELLS: readonly SouthIndianSignCell[] = [
  { signIndex: 11, row: 0, column: 0 }, // Meena
  { signIndex: 0, row: 0, column: 1 }, // Mesha
  { signIndex: 1, row: 0, column: 2 }, // Vrishabha
  { signIndex: 2, row: 0, column: 3 }, // Mithuna
  { signIndex: 3, row: 1, column: 3 }, // Karka
  { signIndex: 4, row: 2, column: 3 }, // Simha
  { signIndex: 5, row: 3, column: 3 }, // Kanya
  { signIndex: 6, row: 3, column: 2 }, // Tula
  { signIndex: 7, row: 3, column: 1 }, // Vrishchika
  { signIndex: 8, row: 3, column: 0 }, // Dhanu
  { signIndex: 9, row: 2, column: 0 }, // Makara
  { signIndex: 10, row: 1, column: 0 }, // Kumbha
] as const;

export function getHouse(
  chart: Pick<VedicChart, "houses">,
  number: HouseNumber,
): HousePosition {
  const house = chart.houses.find((candidate) => candidate.number === number);
  if (!house) {
    throw new RangeError(`Chart is missing house ${number}.`);
  }
  return house;
}

export function getHouseForSign(
  chart: Pick<VedicChart, "houses">,
  signIndex: number,
): HousePosition {
  const house = chart.houses.find(
    (candidate) => candidate.sign.index === signIndex,
  );
  if (!house) {
    throw new RangeError(`Chart is missing sidereal sign index ${signIndex}.`);
  }
  return house;
}

export function getPlanetsForHouse(
  chart: Pick<VedicChart, "planets">,
  number: HouseNumber,
): GrahaPosition[] {
  return chart.planets.filter((planet) => planet.house === number);
}

export function getPlanet(
  chart: Pick<VedicChart, "planets">,
  planetId: GrahaId | null | undefined,
): GrahaPosition | undefined {
  return planetId
    ? chart.planets.find((planet) => planet.id === planetId)
    : undefined;
}

export function describeHouse(
  house: HousePosition,
  planets: readonly GrahaPosition[],
  locale: AppLocale = "en",
): string {
  const occupants = planets.length
    ? planets
        .map((planet) => getLocalizedGrahaName(planet.id, locale))
        .join(", ")
    : CHART_DESCRIPTION_MESSAGES[locale].empty;
  return formatMessage(CHART_DESCRIPTION_MESSAGES[locale].house, {
    house: house.number,
    rasi: getLocalizedRasiName(house.sign.name, locale),
    occupants,
  });
}

export function describePlanet(
  planet: GrahaPosition,
  locale: AppLocale = "en",
): string {
  return formatMessage(CHART_DESCRIPTION_MESSAGES[locale].planet, {
    planet: getLocalizedGrahaName(planet.id, locale),
    rasi: getLocalizedRasiName(planet.sign.name, locale),
    house: planet.house,
    degrees: planet.sign.degreeDeg.toFixed(1),
    retrograde: planet.retrograde
      ? CHART_DESCRIPTION_MESSAGES[locale].retrograde
      : "",
  });
}
