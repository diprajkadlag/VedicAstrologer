import { describe, expect, it } from "vitest";

import {
  RASIS,
  type HousePosition,
} from "../../lib/astro/ephemeris";
import {
  describeHouse,
  getChartRasiAbbreviation,
  getHouseForSign,
  HOUSE_NUMBERS,
  SOUTH_INDIAN_SIGN_CELLS,
} from "./chart-utils";
import { NORTH_INDIAN_HOUSE_SHAPES } from "./NorthIndianChart";

function wholeSignHouses(ascendantSignIndex: number): HousePosition[] {
  return HOUSE_NUMBERS.map((number) => {
    const signIndex = (ascendantSignIndex + number - 1) % 12;
    return {
      number,
      sign: { index: signIndex, name: RASIS[signIndex] },
      siderealStartLongitudeDeg: signIndex * 30,
      planets: [],
    };
  });
}

describe("Vedic chart layout maps", () => {
  it("places every fixed sign exactly once in the South Indian perimeter", () => {
    expect(SOUTH_INDIAN_SIGN_CELLS).toHaveLength(12);
    expect(
      [...SOUTH_INDIAN_SIGN_CELLS.map((cell) => cell.signIndex)].sort(
        (a, b) => a - b,
      ),
    ).toEqual(Array.from({ length: 12 }, (_, index) => index));
    expect(
      new Set(
        SOUTH_INDIAN_SIGN_CELLS.map(
          (cell) => `${cell.row},${cell.column}`,
        ),
      ).size,
    ).toBe(12);
  });

  it("uses the traditional South Indian fixed-sign coordinates", () => {
    const positions = Object.fromEntries(
      SOUTH_INDIAN_SIGN_CELLS.map((cell) => [
        RASIS[cell.signIndex],
        [cell.row, cell.column],
      ]),
    );

    expect(positions).toMatchObject({
      Pisces: [0, 0],
      Aries: [0, 1],
      Gemini: [0, 3],
      Cancer: [1, 3],
      Virgo: [3, 3],
      Libra: [3, 2],
      Sagittarius: [3, 0],
      Aquarius: [1, 0],
    });
  });

  it("derives moving houses from the ascendant sign", () => {
    const chart = { houses: wholeSignHouses(3) }; // Cancer ascendant

    expect(getHouseForSign(chart, 3).number).toBe(1);
    expect(getHouseForSign(chart, 9).number).toBe(7);
    expect(getHouseForSign(chart, 0).number).toBe(10);
  });

  it("orients the North Indian fixed houses anti-clockwise from the top", () => {
    expect(NORTH_INDIAN_HOUSE_SHAPES[1].points).toBe("200,0 300,100 200,200 100,100");
    expect(NORTH_INDIAN_HOUSE_SHAPES[4].points).toBe("0,200 100,100 200,200 100,300");
    expect(NORTH_INDIAN_HOUSE_SHAPES[7].points).toBe("100,300 200,200 300,300 200,400");
    expect(NORTH_INDIAN_HOUSE_SHAPES[10].points).toBe("200,200 300,100 400,200 300,300");
  });

  it("localizes dense Rasi labels and accessible Bhava descriptions", () => {
    const simhaBhava = wholeSignHouses(4)[0];

    expect(
      getChartRasiAbbreviation(
        simhaBhava.sign.index,
        simhaBhava.sign.name,
        "en",
      ),
    ).toBe("Simha");
    expect(
      getChartRasiAbbreviation(
        simhaBhava.sign.index,
        simhaBhava.sign.name,
        "hi",
      ),
    ).toBe("सिंह");
    expect(describeHouse(simhaBhava, [], "hi")).toBe(
      "भाव 1, सिंह, कोई ग्रह नहीं",
    );
    expect(describeHouse(simhaBhava, [], "mr")).toBe(
      "भाव 1, सिंह, एकही ग्रह नाही",
    );
  });
});
