import { describe, expect, it } from "vitest";
import { compareInspections, latestPerArea, previousOf } from "./history";
import type { Inspection } from "./mock-data";

const ins = (id: string, referenceId: string, capturedAt: string, angles: number[]): Inspection => ({
  id,
  vehicleId: "sc-0142",
  referenceId,
  capturedAt,
  processingMs: 3000,
  inspector: "Test",
  bolts: angles.map((angle, i) => ({ boltId: `b${i + 1}`, angle, confidence: 0.9 })),
});

const oct = ins("a", "r1", "2026-10-20T08:00:00Z", [0.3, 1.8, -3.2]);
const nov4 = ins("b", "r1", "2026-11-04T08:00:00Z", [1.2, 5.6, -9.4]);
const nov18 = ins("c", "r1", "2026-11-18T08:00:00Z", [2.1, 11.4, -18.7]);
const other = ins("d", "r2", "2026-11-19T08:00:00Z", [3]);
const all = [oct, nov18, other, nov4];

describe("inspection history", () => {
  it("finds the previous inspection of the same area, not another area", () => {
    expect(previousOf(all, nov18)?.id).toBe("b");
    expect(previousOf(all, oct)).toBeUndefined();
    expect(previousOf(all, other)).toBeUndefined();
  });

  it("keeps only the latest inspection per area", () => {
    expect(latestPerArea(all).map((i) => i.id)).toEqual(["d", "c"]);
  });

  it("reports rotation between two inspections as later minus earlier", () => {
    const changes = compareInspections(nov4, nov18);
    expect(changes.map((c) => c.delta)).toEqual([0.9, 5.8, -9.3]);
  });

  it("flags bolts whose status got worse", () => {
    // B2: 5.6° (Monitor) → 11.4° (Monitor) is not worse; B3: −9.4° (Monitor) → −18.7° (Loose) is.
    const changes = compareInspections(nov4, nov18);
    expect(changes.map((c) => c.worsened)).toEqual([false, false, true]);
  });
});
