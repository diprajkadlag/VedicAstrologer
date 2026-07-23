import type { ScoredTransitTheme } from "../../lib/transits";

export function transitInstantForDateInput(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Transit date must use YYYY-MM-DD.");
  }
  const instant = new Date(`${value}T12:00:00.000Z`);
  if (
    !Number.isFinite(instant.getTime()) ||
    instant.toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError("Transit date is outside the supported calendar.");
  }
  return instant;
}

export function getTransitScoreArithmetic(
  theme: Pick<ScoredTransitTheme, "baseline" | "score" | "reasons">,
): { baseline: number; unbounded: number; bounded: number } {
  const unbounded =
    theme.baseline +
    theme.reasons.reduce(
      (total, reason) => total + reason.contribution,
      0,
    );
  return { baseline: theme.baseline, unbounded, bounded: theme.score };
}

