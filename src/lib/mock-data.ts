// Vehicle categories, legacy sample references and the simulated detector. Saved inspections
// live in Lovable Cloud (see inspections-api.ts). Swap simulateInspection for the real model API.
import boltFork from "@/assets/bolt-fork.jpg";
import boltStem from "@/assets/bolt-stem.jpg";
import boltAxle from "@/assets/bolt-axle.jpg";

export type VehicleType = "motorbike" | "bicycle" | "scooter" | "other";

export const vehicleTypes: Array<{ id: VehicleType; label: string; plural: string }> = [
  { id: "motorbike", label: "Motorbike", plural: "Motorbikes" },
  { id: "bicycle", label: "Bicycle", plural: "Bicycles" },
  { id: "scooter", label: "Scooter", plural: "Scooters" },
  { id: "other", label: "Other", plural: "Other" },
];
export const isVehicleType = (v: string): v is VehicleType => vehicleTypes.some((t) => t.id === v);
export const vehicleTypeLabel = (t: VehicleType) => vehicleTypes.find((x) => x.id === t)?.label ?? "Other";

/** Optional quick picks for "which part?" — the inspector can also type anything or leave it empty. */
export const areaSuggestions = ["Wheel / axle", "Brake", "Handlebar", "Frame", "Engine", "Exhaust", "Seat", "Suspension"];
export const DEFAULT_AREA = "General bolt";

export interface BoltRef {
  id: string;
  label: string;
  /** Position of the bolt centre in the photo, in % of width/height. */
  x: number;
  y: number;
  /** Box size in % of photo width. */
  size: number;
  spec?: string | undefined;
}

export interface BoltResult extends BoltRef {
  boltId: string;
  /** Rotation versus the reference photo in degrees; null when there was no reference (detect only). */
  angle: number | null;
  confidence: number;
}

export interface Inspection {
  id: string;
  vehicleType: VehicleType;
  /** Free-text part of the vehicle, e.g. "Brake"; null = general / not specified. */
  area: string | null;
  /** Inspections of the same spot share a series id, so they can be compared over time. */
  seriesId: string;
  capturedAt: string;
  processingMs: number;
  inspector: string;
  bolts: BoltResult[];
  photoUrl?: string | null | undefined;
  photoPath?: string | null | undefined;
  referencePhotoUrl?: string | null | undefined;
  referencePhotoPath?: string | null | undefined;
}

/** Sample photos used when the camera isn't available (demo mode). */
export const samplePhotos = [boltAxle, boltFork, boltStem];

// Older sample inspections pointed at preset reference photos; keep them readable.
const stemBolts: BoltRef[] = [
  { id: "b1", label: "B1", x: 26, y: 9, size: 16, spec: "M5 · 5 Nm" },
  { id: "b2", label: "B2", x: 74, y: 9, size: 16, spec: "M5 · 5 Nm" },
  { id: "b3", label: "B3", x: 50, y: 47, size: 22, spec: "M6 · 8 Nm" },
];
const forkBolts: BoltRef[] = [{ id: "b1", label: "B1", x: 54, y: 44, size: 28, spec: "M10 · 40 Nm" }];
const axleBolts: BoltRef[] = [
  { id: "b1", label: "B1", x: 55, y: 19, size: 12, spec: "M8 · 25 Nm" },
  { id: "b2", label: "B2", x: 39, y: 48, size: 12, spec: "M8 · 25 Nm" },
  { id: "b3", label: "B3", x: 66, y: 56, size: 18, spec: "M14 · 60 Nm" },
];
export const legacyReferences: Record<string, { image: string; bolts: BoltRef[] }> = {
  r1: { image: boltAxle, bolts: axleBolts },
  r2: { image: boltFork, bolts: forkBolts },
  r3: { image: boltStem, bolts: stemBolts },
  r4: { image: boltFork, bolts: forkBolts },
  r5: { image: boltAxle, bolts: axleBolts },
  r6: { image: boltAxle, bolts: axleBolts },
  r7: { image: boltStem, bolts: stemBolts },
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Simulated model output. Finds 1–3 bolts anywhere in the photo; measures rotation only when a
 * reference photo exists. Re-inspections reuse the previous bolt positions and drift a little.
 * ~10% of runs return a low-confidence detection so the retake prompt can be demoed.
 */
export function simulateInspection({
  hasReference,
  previous,
}: {
  hasReference: boolean;
  previous?: BoltResult[] | undefined;
}): { bolts: BoltResult[]; processingMs: number } {
  const lowConfidence = Math.random() < 0.1;
  const base: BoltRef[] =
    previous?.map(({ id, label, x, y, size, spec }) => ({ id, label, x, y, size, spec })) ??
    Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, i) => ({
      id: `b${i + 1}`,
      label: `B${i + 1}`,
      x: Math.round(rand(22, 78)),
      y: Math.round(rand(22, 78)),
      size: Math.round(rand(12, 20)),
    }));
  const bolts = base.map((b, i) => {
    const prevAngle = previous?.[i]?.angle ?? 0;
    const drift = Math.random() < 0.25 ? rand(4, 20) : rand(-3, 3);
    return {
      ...b,
      boltId: b.id,
      angle: hasReference ? round1(prevAngle + drift * (Math.random() < 0.5 ? -1 : 1)) : null,
      confidence: lowConfidence && i === 0 ? round1(rand(0.35, 0.55) * 100) / 100 : Math.round(rand(0.78, 0.96) * 100) / 100,
    };
  });
  return { bolts, processingMs: 2200 + Math.round(Math.random() * 1600) };
}
