// Prototype data. Replace with API calls once the backend/model service is ready.
import boltFork from "@/assets/bolt-fork.jpg";
import boltStem from "@/assets/bolt-stem.jpg";
import boltAxle from "@/assets/bolt-axle.jpg";

export type VehicleType = "bicycle" | "motorbike" | "scooter";

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  depot: string;
  odometer: string;
}

export interface BoltRef {
  id: string;
  label: string;
  /** Position of the bolt centre in the photo, in % of width/height. */
  x: number;
  y: number;
  /** Box size in % of photo width. */
  size: number;
  spec: string;
}

export interface ReferenceImage {
  id: string;
  vehicleId: string;
  location: string;
  image: string;
  capturedAt: string;
  bolts: BoltRef[];
}

export interface BoltResult {
  boltId: string;
  angle: number;
  confidence: number;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  referenceId: string;
  capturedAt: string;
  processingMs: number;
  inspector: string;
  bolts: BoltResult[];
}

export const vehicles: Vehicle[] = [
  { id: "sc-0142", code: "SC-0142", name: "Honda Vario 125", type: "scooter", depot: "Surabaya Timur", odometer: "12,480 km" },
  { id: "bc-2210", code: "BC-2210", name: "City Bike C3", type: "bicycle", depot: "Kyoto Station Dock", odometer: "3,105 km" },
  { id: "mb-0031", code: "MB-0031", name: "Honda CB150R", type: "motorbike", depot: "Surabaya Timur", odometer: "21,940 km" },
  { id: "sc-0087", code: "SC-0087", name: "Yamaha NMAX", type: "scooter", depot: "Bandung Dago", odometer: "8,772 km" },
  { id: "bc-1904", code: "BC-1904", name: "E-Bike Pro", type: "bicycle", depot: "Osaka Umeda", odometer: "1,560 km" },
];

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

export const references: ReferenceImage[] = [
  { id: "r1", vehicleId: "sc-0142", location: "Rear axle & caliper", image: boltAxle, capturedAt: "2026-10-02", bolts: axleBolts },
  { id: "r2", vehicleId: "sc-0142", location: "Front fork clamp", image: boltFork, capturedAt: "2026-10-02", bolts: forkBolts },
  { id: "r3", vehicleId: "bc-2210", location: "Handlebar stem", image: boltStem, capturedAt: "2026-09-21", bolts: stemBolts },
  { id: "r4", vehicleId: "mb-0031", location: "Front fork clamp", image: boltFork, capturedAt: "2026-08-30", bolts: forkBolts },
  { id: "r5", vehicleId: "mb-0031", location: "Rear axle & caliper", image: boltAxle, capturedAt: "2026-08-30", bolts: axleBolts },
  { id: "r6", vehicleId: "sc-0087", location: "Rear axle & caliper", image: boltAxle, capturedAt: "2026-10-11", bolts: axleBolts },
  { id: "r7", vehicleId: "bc-1904", location: "Handlebar stem", image: boltStem, capturedAt: "2026-10-28", bolts: stemBolts },
];

export const inspections: Inspection[] = [
  {
    id: "ins-1048", vehicleId: "sc-0142", referenceId: "r1", capturedAt: "2026-11-18T08:42:00", processingMs: 3240, inspector: "Erlangga H.",
    bolts: [ { boltId: "b1", angle: 2.1, confidence: 0.93 }, { boltId: "b2", angle: 11.4, confidence: 0.88 }, { boltId: "b3", angle: -18.7, confidence: 0.91 } ],
  },
  {
    id: "ins-1047", vehicleId: "bc-2210", referenceId: "r3", capturedAt: "2026-11-17T16:10:00", processingMs: 2810, inspector: "Airi S.",
    bolts: [ { boltId: "b1", angle: 0.8, confidence: 0.95 }, { boltId: "b2", angle: -1.6, confidence: 0.94 }, { boltId: "b3", angle: 3.2, confidence: 0.9 } ],
  },
  {
    id: "ins-1046", vehicleId: "mb-0031", referenceId: "r4", capturedAt: "2026-11-17T10:25:00", processingMs: 2150, inspector: "Anas N.",
    bolts: [ { boltId: "b1", angle: 7.9, confidence: 0.86 } ],
  },
  {
    id: "ins-1045", vehicleId: "sc-0087", referenceId: "r6", capturedAt: "2026-11-16T14:02:00", processingMs: 3610, inspector: "Erlangga H.",
    bolts: [ { boltId: "b1", angle: 1.2, confidence: 0.9 }, { boltId: "b2", angle: -2.4, confidence: 0.89 }, { boltId: "b3", angle: 4.1, confidence: 0.87 } ],
  },
  {
    id: "ins-1044", vehicleId: "bc-1904", referenceId: "r7", capturedAt: "2026-11-15T09:30:00", processingMs: 2990, inspector: "Airi S.",
    bolts: [ { boltId: "b1", angle: 16.3, confidence: 0.84 }, { boltId: "b2", angle: 0.4, confidence: 0.93 }, { boltId: "b3", angle: -6.2, confidence: 0.88 } ],
  },
];

/**
 * Simulated model output for a new capture. Reference r2 (fork clamp, steep angle in the
 * sample) returns a low-confidence detection so the retake prompt can be demoed.
 */
export function simulateInspection(referenceId: string): Inspection {
  const ref = getReference(referenceId)!;
  const presets: Record<string, Array<[number, number]>> = {
    r2: [[3.4, 0.42]],
    r1: [[1.4, 0.92], [6.8, 0.87], [-21.5, 0.9]],
    r3: [[0.6, 0.94], [-12.3, 0.89], [1.9, 0.91]],
    r4: [[9.2, 0.85]],
    r5: [[0.9, 0.93], [1.1, 0.9], [2.6, 0.88]],
    r6: [[-3.1, 0.9], [17.4, 0.86], [2.2, 0.89]],
    r7: [[4.4, 0.92], [0.3, 0.95], [-8.8, 0.87]],
  };
  const values = presets[referenceId] ?? ref.bolts.map(() => [0, 0.9] as [number, number]);
  return {
    id: `ins-new-${Date.now()}`,
    vehicleId: ref.vehicleId,
    referenceId,
    capturedAt: new Date().toISOString(),
    processingMs: 2400 + Math.round(Math.random() * 1400),
    inspector: "Seraphim V.",
    bolts: ref.bolts.map((b, i) => ({ boltId: b.id, angle: values[i]?.[0] ?? 0, confidence: values[i]?.[1] ?? 0.9 })),
  };
}

export const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
export const getReference = (id: string) => references.find((r) => r.id === id);
export const getInspection = (id: string) => inspections.find((i) => i.id === id);
export const referencesFor = (vehicleId: string) => references.filter((r) => r.vehicleId === vehicleId);
export const inspectionsFor = (vehicleId: string) => inspections.filter((i) => i.vehicleId === vehicleId);
export const latestInspectionFor = (vehicleId: string) => inspectionsFor(vehicleId)[0];
