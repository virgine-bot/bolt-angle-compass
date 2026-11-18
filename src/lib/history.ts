// Pure helpers over a list of inspections (newest first). Kept free of data access so they
// can be tested and reused whatever the inspections come from.
import { measuredStatus, type BoltStatus } from "@/lib/inspection";
import type { BoltResult, Inspection, VehicleType } from "@/lib/mock-data";

const byNewest = (a: Inspection, b: Inspection) =>
  new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();

export function sortNewestFirst(list: Inspection[]): Inspection[] {
  return [...list].sort(byNewest);
}

export function inspectionsForType(list: Inspection[], type: VehicleType): Inspection[] {
  return sortNewestFirst(list.filter((i) => i.vehicleType === type));
}

export function findInspection(list: Inspection[], id: string): Inspection | undefined {
  return list.find((i) => i.id === id);
}

/** Inspections of the same spot (same series), newest first. */
export function sameAreaInspections(list: Inspection[], seriesId: string): Inspection[] {
  return sortNewestFirst(list.filter((i) => i.seriesId === seriesId));
}

/** The inspection of the same spot taken just before this one, if any. */
export function previousOf(list: Inspection[], ins: Inspection): Inspection | undefined {
  const t = new Date(ins.capturedAt).getTime();
  return sameAreaInspections(list, ins.seriesId).find(
    (i) => i.id !== ins.id && new Date(i.capturedAt).getTime() < t,
  );
}

/** Latest inspection per spot — the current state of each inspected area. */
export function latestPerArea(list: Inspection[]): Inspection[] {
  const seen = new Set<string>();
  return sortNewestFirst(list).filter((i) => {
    if (seen.has(i.seriesId)) return false;
    seen.add(i.seriesId);
    return true;
  });
}

const rank: Record<BoltStatus, number> = { ok: 0, monitor: 1, loose: 2 };

export interface BoltChange {
  boltId: string;
  before: BoltResult | undefined;
  after: BoltResult | undefined;
  /** Rotation between the two inspections in degrees (after − before); null if a side is missing or unmeasured. */
  delta: number | null;
  beforeStatus: BoltStatus | undefined;
  afterStatus: BoltStatus | undefined;
  /** True when the bolt moved to a worse status (e.g. Secure → Monitor). */
  worsened: boolean;
}

export function compareInspections(earlier: Inspection, later: Inspection): BoltChange[] {
  const ids = [...new Set([...earlier.bolts, ...later.bolts].map((b) => b.boltId))];
  return ids.map((boltId) => {
    const before = earlier.bolts.find((b) => b.boltId === boltId);
    const after = later.bolts.find((b) => b.boltId === boltId);
    const beforeStatus = (before && measuredStatus(before.angle)) ?? undefined;
    const afterStatus = (after && measuredStatus(after.angle)) ?? undefined;
    return {
      boltId,
      before,
      after,
      delta:
        before?.angle != null && after?.angle != null ? Math.round((after.angle - before.angle) * 10) / 10 : null,
      beforeStatus,
      afterStatus,
      worsened: !!beforeStatus && !!afterStatus && rank[afterStatus] > rank[beforeStatus],
    };
  });
}
