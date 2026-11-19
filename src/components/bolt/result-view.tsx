import { useState, type ReactNode } from "react";
import { Clock, ImageOff, RotateCcw, ScanSearch, Timer, TriangleAlert, Wrench } from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_AREA, samplePhotos, vehicleTypeLabel, type Inspection } from "@/lib/mock-data";
import { formatAngle, measuredStatus, needsRetake, statusMeta, MIN_CONFIDENCE } from "@/lib/inspection";
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
  const photo = inspectionImage ?? inspection.photoUrl ?? samplePhotos[0]!;
  const referencePhoto = inspection.referencePhotoUrl ?? null;
  const [view, setView] = useState<"inspection" | "reference">("inspection");
  const [active, setActive] = useState<string | null>(null);

  const retake = needsRetake(inspection.bolts.map((b) => b.confidence));
  const rows = inspection.bolts.map((b) => ({ ...b, status: measuredStatus(b.angle) }));
  const measured = rows.some((r) => r.status);
  const flagged = rows.filter((r) => r.status && r.status !== "ok").length;
  const loose = rows.filter((r) => r.status === "loose").length;
  const area = inspection.area ?? DEFAULT_AREA;

  const markers = rows.map((r) => ({
    bolt: r,
    status: retake ? ("retake" as const) : (r.status ?? undefined),
    active: active === r.boltId,
  }));
  const showingReference = view === "reference" && referencePhoto;

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-5 overflow-hidden rounded-3xl bg-scan">
        <div className="relative">
          <BoltPhoto
            src={showingReference ? referencePhoto : photo}
            alt={`${area} on ${vehicleTypeLabel(inspection.vehicleType).toLowerCase()}`}
            markers={showingReference ? markers.map((m) => ({ ...m, status: undefined })) : markers}
            onSelect={(id) => {
              setActive(id);
              document.getElementById(`bolt-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className={cn(showingReference && "opacity-80 grayscale")}
            animate={animate}
          />
          {referencePhoto ? (
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
          ) : (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-scan/80 px-3 py-1.5 text-xs font-semibold text-scan-muted backdrop-blur">
              <ImageOff className="size-3.5" /> No reference
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-scan-line text-scan-foreground">
          <Stat icon={<Timer className="size-3.5" />} label="Processed" value={`${(inspection.processingMs / 1000).toFixed(1)}s`} />
          <Stat icon={<Wrench className="size-3.5" />} label="Bolts" value={String(rows.length)} />
          <Stat icon={<Clock className="size-3.5" />} label="Taken" value={format(new Date(inspection.capturedAt), "d MMM")} />
        </div>
      </div>

      {retake ? (
        <div className="mx-5 rounded-2xl border-2 border-dashed border-monitor bg-monitor-soft p-4">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div className="flex-1">
              <p className="font-bold">Couldn't detect the bolts reliably</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Detection confidence is below {Math.round(MIN_CONFIDENCE * 100)}%. Move within 20–30 cm, keep the bolt in focus
                and avoid glare, then retake.
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
            !measured ? "bg-secondary" : loose ? "bg-loose text-primary-foreground" : flagged ? "bg-monitor-soft" : "bg-ok-soft",
          )}
        >
          <p className="eyebrow !text-current opacity-70">Summary</p>
          <p className="mt-1 font-display text-xl font-extrabold leading-snug">
            {!measured
              ? `${rows.length} bolt${rows.length !== 1 ? "s" : ""} detected`
              : loose
                ? `${loose} bolt${loose > 1 ? "s" : ""} loose — take out of service`
                : flagged
                  ? `${flagged} bolt${flagged > 1 ? "s" : ""} to monitor`
                  : "All bolts secure"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {!measured
              ? "No reference photo, so rotation wasn't measured. Re-check this spot later to compare."
              : `${vehicleTypeLabel(inspection.vehicleType)} · ${area} · ${format(new Date(inspection.capturedAt), "d MMM yyyy, HH:mm")}`}
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
            className={cn("rounded-2xl border bg-card p-4 shadow-card transition-shadow", active === r.boltId && "ring-2 ring-primary")}
          >
            <div className="flex items-center gap-4">
              {r.status && r.angle !== null && !retake ? (
                <AngleGauge angle={r.angle} status={r.status} />
              ) : (
                <span className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <ScanSearch className="size-7" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {r.label}
                    {r.spec ? ` · ${r.spec}` : ""}
                  </p>
                  {retake ? (
                    <StatusBadge status="retake" />
                  ) : r.status ? (
                    <StatusBadge status={r.status} />
                  ) : (
                    <StatusBadge status="retake" label="Detected" />
                  )}
                </div>
                <p className="mt-1 font-readout text-3xl font-semibold">{retake || r.angle === null ? "—" : formatAngle(r.angle)}</p>
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
                <span className="font-semibold text-foreground">{r.status ? "Recommendation: " : "Note: "}</span>
                {r.status ? statusMeta[r.status].recommendation : "Bolt found. Add a reference photo next time to measure rotation."}
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
