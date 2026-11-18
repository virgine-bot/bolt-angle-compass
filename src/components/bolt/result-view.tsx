import { useState } from "react";
import { Clock, RotateCcw, Timer, TriangleAlert, Wrench } from "lucide-react";
import { format } from "date-fns";
import type { Inspection } from "@/lib/mock-data";
import { getReference, getVehicle } from "@/lib/mock-data";
import { formatAngle, getBoltStatus, needsRetake, statusMeta, MIN_CONFIDENCE } from "@/lib/inspection";
import { cn } from "@/lib/utils";
import { AngleGauge } from "./angle-gauge";
import { BoltPhoto } from "./bolt-photo";
import { StatusBadge } from "./status-badge";

export function ResultView({
  inspection,
  onRetake,
  animate = false,
  inspectionImage,
}: {
  inspection: Inspection;
  inspectionImage?: string | undefined;
  onRetake?: (() => void) | undefined;
  animate?: boolean;
}) {
  const ref = getReference(inspection.referenceId)!;
  const vehicle = getVehicle(inspection.vehicleId)!;
  const [view, setView] = useState<"inspection" | "reference">("inspection");
  const [active, setActive] = useState<string | null>(null);

  const retake = needsRetake(inspection.bolts.map((b) => b.confidence));
  const rows = inspection.bolts.map((r) => ({
    ...r,
    bolt: ref.bolts.find((b) => b.id === r.boltId)!,
    status: getBoltStatus(r.angle),
  }));
  const flagged = rows.filter((r) => r.status !== "ok").length;
  const loose = rows.filter((r) => r.status === "loose").length;

  const markers = rows.map((r) => ({
    bolt: r.bolt,
    status: retake ? ("retake" as const) : r.status,
    active: active === r.boltId,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-5 overflow-hidden rounded-3xl bg-scan">
        <div className="relative">
          <BoltPhoto
            src={view === "inspection" && inspectionImage ? inspectionImage : ref.image}
            alt={`${ref.location} on ${vehicle.name}`}
            markers={view === "inspection" ? markers : markers.map((m) => ({ ...m, status: undefined }))}
            onSelect={(id) => {
              setActive(id);
              document.getElementById(`bolt-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className={cn(view === "reference" && "opacity-80 grayscale")}
            animate={animate}
          />
          <div className="absolute top-3 left-3 flex rounded-full bg-scan/80 p-1 backdrop-blur">
            {(["inspection", "reference"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                  view === v ? "bg-scan-foreground text-scan" : "text-scan-muted",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-scan-line text-scan-foreground">
          <Stat icon={<Timer className="size-3.5" />} label="Processed" value={`${(inspection.processingMs / 1000).toFixed(1)}s`} />
          <Stat icon={<Wrench className="size-3.5" />} label="Bolts" value={String(rows.length)} />
          <Stat icon={<Clock className="size-3.5" />} label="Ref. age" value={`${daysBetween(ref.capturedAt, inspection.capturedAt)}d`} />
        </div>
      </div>

      {retake ? (
        <div className="mx-5 rounded-2xl border-2 border-dashed border-monitor bg-monitor-soft p-4">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div className="flex-1">
              <p className="font-bold">Couldn't measure rotation reliably</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Detection confidence is below {Math.round(MIN_CONFIDENCE * 100)}%. Match the reference angle more closely, move
                within 20–30 cm and avoid glare, then retake.
              </p>
              {onRetake && (
                <button
                  type="button"
                  onClick={onRetake}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                >
                  <RotateCcw className="size-4" /> Retake photo
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "mx-5 rounded-2xl p-4",
            loose ? "bg-loose text-primary-foreground" : flagged ? "bg-monitor-soft" : "bg-ok-soft",
          )}
        >
          <p className="eyebrow !text-current opacity-70">Summary</p>
          <p className="mt-1 font-display text-xl font-extrabold leading-snug">
            {loose
              ? `${loose} bolt${loose > 1 ? "s" : ""} loose — take out of service`
              : flagged
                ? `${flagged} bolt${flagged > 1 ? "s" : ""} to monitor`
                : "All bolts secure"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {vehicle.code} · {ref.location} · {format(new Date(inspection.capturedAt), "d MMM yyyy, HH:mm")}
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3 px-5">
        <p className="eyebrow">Per-bolt results</p>
        {rows.map((r) => (
          <article
            id={`bolt-${r.boltId}`}
            key={r.boltId}
            onClick={() => setActive(r.boltId)}
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-card transition-shadow",
              active === r.boltId && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center gap-4">
              <AngleGauge angle={retake ? 0 : r.angle} status={r.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {r.bolt.label} · {r.bolt.spec}
                  </p>
                  <StatusBadge status={retake ? "retake" : r.status} />
                </div>
                <p className="mt-1 font-readout text-3xl font-semibold">{retake ? "—" : formatAngle(r.angle)}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", r.confidence < MIN_CONFIDENCE ? "bg-monitor" : "bg-foreground/70")}
                      style={{ width: `${r.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{Math.round(r.confidence * 100)}% conf.</span>
                </div>
              </div>
            </div>
            {!retake && (
              <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Recommendation: </span>
                {statusMeta[r.status].recommendation}
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-scan-muted">
        {icon}
        {label}
      </p>
      <p className="font-readout text-lg font-semibold">{value}</p>
    </div>
  );
}

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
