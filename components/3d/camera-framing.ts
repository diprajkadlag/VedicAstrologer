const DEFAULT_FILL_RATIO = 0.72;

export interface PerspectiveFrameInput {
  width: number;
  height: number;
  verticalFovDeg: number;
  radius: number;
  /** Fraction of the limiting viewport dimension occupied by the sphere. */
  fillRatio?: number;
}

function distanceForHalfFov(
  radius: number,
  halfFovRad: number,
  fillRatio: number,
): number {
  const targetAngularRadius = Math.atan(
    Math.tan(halfFovRad) * fillRatio,
  );
  return radius / Math.sin(targetAngularRadius);
}

/**
 * Fits a bounding sphere against both axes of a perspective viewport.
 *
 * Using the sphere's angular radius avoids the clipping caused by treating
 * its centre plane as a flat rectangle. The result is deterministic across
 * embedded, fullscreen, landscape, and portrait canvas sizes.
 */
export function calculatePerspectiveFrameDistance({
  width,
  height,
  verticalFovDeg,
  radius,
  fillRatio = DEFAULT_FILL_RATIO,
}: PerspectiveFrameInput): number {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(verticalFovDeg) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(fillRatio) ||
    width <= 0 ||
    height <= 0 ||
    verticalFovDeg <= 0 ||
    verticalFovDeg >= 179 ||
    radius <= 0 ||
    fillRatio <= 0 ||
    fillRatio >= 1
  ) {
    throw new RangeError("Perspective frame inputs must be finite and positive.");
  }

  const aspect = width / height;
  const verticalHalfFov = (verticalFovDeg * Math.PI) / 360;
  const horizontalHalfFov = Math.atan(
    Math.tan(verticalHalfFov) * aspect,
  );

  return Math.max(
    distanceForHalfFov(radius, verticalHalfFov, fillRatio),
    distanceForHalfFov(radius, horizontalHalfFov, fillRatio),
  );
}

