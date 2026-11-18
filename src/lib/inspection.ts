// Pure inspection rules — kept separate from mock data so they can be tested and later
// reused when the real model API returns angles.

export type BoltStatus = "ok" | "monitor" | "loose";

/** Rotation below this (degrees, absolute) is treated as unchanged — matches the 5° MAE target. */
export const OK_LIMIT_DEG = 5;
/** Rotation at or above this (degrees, absolute) means the bolt must be re-tightened. */
export const LOOSE_LIMIT_DEG = 15;
/** Detections below this confidence trigger a "retake photo" prompt. */
export const MIN_CONFIDENCE = 0.6;

export function getBoltStatus(angleDeg: number): BoltStatus {
  const a = Math.abs(angleDeg);
  if (a < OK_LIMIT_DEG) return "ok";
  if (a < LOOSE_LIMIT_DEG) return "monitor";
  return "loose";
}

/** Status for a bolt that may not have been measured (no reference photo) — null means "detected only". */
export function measuredStatus(angleDeg: number | null): BoltStatus | null {
  return angleDeg === null ? null : getBoltStatus(angleDeg);
}

export function needsRetake(confidences: number[]): boolean {
  return confidences.length === 0 || confidences.some((c) => c < MIN_CONFIDENCE);
}

export const statusMeta: Record<
  BoltStatus,
  { label: string; short: string; recommendation: string }
> = {
  ok: {
    label: "Secure",
    short: "OK",
    recommendation: "No visible rotation. No action needed until the next service interval.",
  },
  monitor: {
    label: "Monitor",
    short: "Watch",
    recommendation:
      "Slight rotation detected. Check torque with a wrench and re-inspect within 7 days.",
  },
  loose: {
    label: "Loose",
    short: "Fix",
    recommendation:
      "Significant rotation. Take the vehicle out of service and re-tighten to spec before next ride.",
  },
};

export function formatAngle(angleDeg: number): string {
  const sign = angleDeg > 0 ? "+" : angleDeg < 0 ? "−" : "";
  return `${sign}${Math.abs(angleDeg).toFixed(1)}°`;
}
