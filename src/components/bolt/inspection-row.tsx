import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_AREA, samplePhotos, vehicleTypeLabel, type Inspection } from "@/lib/mock-data";
import { measuredStatus, needsRetake, type BoltStatus } from "@/lib/inspection";
import { StatusBadge } from "./status-badge";
import { VehicleIcon } from "./vehicle-icon";

/** Worst bolt status; "detected" when no bolt could be measured (no reference photo). */
export function worstStatus(ins: Inspection): BoltStatus | "retake" | "detected" {
  if (needsRetake(ins.bolts.map((b) => b.confidence))) return "retake";
  const s = ins.bolts.map((b) => measuredStatus(b.angle)).filter((x): x is BoltStatus => !!x);
  if (s.length === 0) return "detected";
  return s.includes("loose") ? "loose" : s.includes("monitor") ? "monitor" : "ok";
}

export function WorstBadge({ inspection }: { inspection: Inspection }) {
  const w = worstStatus(inspection);
  return w === "detected" ? <StatusBadge status="retake" label="Detected" /> : <StatusBadge status={w} />;
}

export function InspectionRow({ inspection }: { inspection: Inspection }) {
  return (
    <Link
      to="/results/$inspectionId"
      params={{ inspectionId: inspection.id }}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card transition-transform active:scale-[0.99]"
    >
      <img src={inspection.photoUrl ?? inspection.referencePhotoUrl ?? samplePhotos[0]} alt="" className="size-14 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <VehicleIcon type={inspection.vehicleType} className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-[11px] text-muted-foreground">{vehicleTypeLabel(inspection.vehicleType)}</span>
        </div>
        <p className="truncate font-semibold">{inspection.area ?? DEFAULT_AREA}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(inspection.capturedAt), "d MMM, HH:mm")} · {inspection.inspector}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <WorstBadge inspection={inspection} />
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
