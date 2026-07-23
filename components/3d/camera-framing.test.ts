import { describe, expect, it } from "vitest";

import { calculatePerspectiveFrameDistance } from "./camera-framing";

function projectedFill(
  radius: number,
  distance: number,
  halfFovRad: number,
): number {
  const angularRadius = Math.asin(radius / distance);
  return Math.tan(angularRadius) / Math.tan(halfFovRad);
}

describe("responsive celestial camera framing", () => {
  it.each([
    { width: 1920, height: 920 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 700 },
    { width: 390, height: 700 },
  ])("fits the outer sphere at $width x $height", ({ width, height }) => {
    const radius = 8;
    const verticalFovDeg = 46;
    const distance = calculatePerspectiveFrameDistance({
      width,
      height,
      verticalFovDeg,
      radius,
    });
    const verticalHalfFov = (verticalFovDeg * Math.PI) / 360;
    const horizontalHalfFov = Math.atan(
      Math.tan(verticalHalfFov) * (width / height),
    );

    expect(projectedFill(radius, distance, verticalHalfFov)).toBeLessThanOrEqual(
      0.7200001,
    );
    expect(
      projectedFill(radius, distance, horizontalHalfFov),
    ).toBeLessThanOrEqual(0.7200001);
    expect(
      Math.max(
        projectedFill(radius, distance, verticalHalfFov),
        projectedFill(radius, distance, horizontalHalfFov),
      ),
    ).toBeCloseTo(0.72, 8);
    expect(
      Math.max(
        projectedFill(radius, distance * 1.18, verticalHalfFov),
        projectedFill(radius, distance * 1.18, horizontalHalfFov),
      ),
    ).toBeGreaterThan(0.59);
  });

  it("rejects stale or impossible surface measurements", () => {
    expect(() =>
      calculatePerspectiveFrameDistance({
        width: 0,
        height: 920,
        verticalFovDeg: 46,
        radius: 8,
      }),
    ).toThrow(RangeError);
  });
});
