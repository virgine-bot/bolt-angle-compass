import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Inspection } from "@/lib/mock-data";
import { getReference, getVehicle } from "@/lib/mock-data";
import { getBoltStatus, needsRetake, type BoltStatus } from "@/lib/inspection";
import { StatusBadge } from "./status-badge";
import { VehicleIcon } from "./vehicle-icon";

export function worstStatus(ins: Inspection): BoltStatus | "retake" {
  if (needsRetake(ins.bolts.map((b) => b.confidence))) return "retake";
  const s = ins.bolts.map((b) => getBoltStatus(b.angle));
  return s.includes("loose") ? "loose" : s.includes("monitor") ? "monitor" : "ok";
}

export function InspectionRow({ inspection }: { inspection: Inspection }) {
  const v = getVehicle(inspection.vehicleId)!;
  const r = getReference(inspection.referenceId)!;
  return (
    <Link
      to="/results/$inspectionId"
      params={{ inspectionId: inspection.id }}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card transition-transform active:scale-[0.99]"
    >
      <img src={inspection.photoUrl ?? r.image} alt="" className="size-14 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <VehicleIcon type={v.type} className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-[11px] text-muted-foreground">{v.code}</span>
        </div>
        <p className="truncate font-semibold">{r.location}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(inspection.capturedAt), "d MMM, HH:mm")} · {inspection.inspector}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={worstStatus(inspection)} />
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
