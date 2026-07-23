import { describe, expect, it } from "vitest";

import { auditVedicChart } from "./analysisAudit";
import { calculateVedicChart, type VedicChart } from "./ephemeris";

function validChart(): VedicChart {
  return calculateVedicChart({
    instant: new Date("1996-11-09T20:15:00.000Z"),
    latitude: 22.5726,
    longitude: 88.3639,
  });
}

describe("auditVedicChart", () => {
  it("accepts an internally consistent calculated chart", () => {
    const result = auditVedicChart(validChart());

    expect(result.isStructurallyConsistent).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.checksPerformed).toBeGreaterThan(50);
    expect(result.limitations.map((item) => item.id)).toContain(
      "symbolic-not-scientific",
    );
    expect(result.limitations.map((item) => item.id)).toContain(
      "feature-scope",
    );
  });

  it("detects inconsistent Rasi, Nakshatra, and whole-sign house fields", () => {
    const chart = structuredClone(validChart());
    chart.planets[0].sign.index = (chart.planets[0].sign.index + 1) % 12;
    chart.planets[0].nakshatra.pada =
      chart.planets[0].nakshatra.pada === 4
        ? 1
        : ((chart.planets[0].nakshatra.pada + 1) as 1 | 2 | 3 | 4);
    chart.planets[0].house = ((((chart.planets[0].house - 1 + 2) % 12) +
      1) as typeof chart.planets[0]["house"]);

    const result = auditVedicChart(chart);
    const codes = result.findings.map((finding) => finding.code);

    expect(result.isStructurallyConsistent).toBe(false);
    expect(codes).toContain("rasi-derivation");
    expect(codes).toContain("nakshatra-derivation");
    expect(codes).toContain("planet-house");
    expect(codes).toContain("house-planets");
  });

  it("detects a broken Rahu–Ketu opposition and motion flag", () => {
    const chart = structuredClone(validChart());
    const ketu = chart.planets.find((planet) => planet.id === "ketu")!;
    const saturn = chart.planets.find((planet) => planet.id === "saturn")!;
    ketu.siderealLongitudeDeg =
      (ketu.siderealLongitudeDeg + 2) % 360;
    saturn.retrograde = !saturn.retrograde;

    const result = auditVedicChart(chart);
    const codes = result.findings.map((finding) => finding.code);

    expect(codes).toContain("node-opposition");
    expect(codes).toContain("motion-flag");
  });

  it("checks model metadata, location, and coordinate conversion", () => {
    const chart = structuredClone(validChart());
    chart.location.latitude = 90;
    Object.assign(chart.accuracy, { advertisedArcMinutes: 2 });
    chart.ayanamsa.trueDegrees += 0.5;
    chart.planets.find((planet) => planet.id === "mars")!.distanceAu = -1;

    const result = auditVedicChart(chart);
    const codes = result.findings.map((finding) => finding.code);

    expect(codes).toContain("location-range");
    expect(codes).toContain("accuracy-metadata");
    expect(codes).toContain("ayanamsa-components");
    expect(codes).toContain("sidereal-conversion");
    expect(codes).toContain("graha-coordinate-data");
  });

  it("does not confuse structural consistency with predictive validity", () => {
    const result = auditVedicChart(validChart());
    const scientificLimit = result.limitations.find(
      (item) => item.id === "symbolic-not-scientific",
    );

    expect(scientificLimit?.statement).toMatch(/not been scientifically validated/i);
    expect(result.limitations.map((item) => item.id)).toContain(
      "transit-score-method",
    );
    expect(result.limitations.map((item) => item.id)).toContain(
      "dasha-convention",
    );
  });
});
