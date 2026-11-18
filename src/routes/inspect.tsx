import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { needsRetake } from "@/lib/inspection";
import { inspectionsKey, saveInspection } from "@/lib/inspections-api";
import { DEFAULT_INSPECTOR, useInspectorName } from "@/lib/user";
import { ArrowLeft, Check, ChevronRight, Image as ImageIcon, Layers, Loader2, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { AppShell } from "@/components/bolt/app-shell";
import { BoltPhoto } from "@/components/bolt/bolt-photo";
import { ResultView } from "@/components/bolt/result-view";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import {
  getReference,
  getVehicle,
  referencesFor,
  simulateInspection,
  vehicles,
  type Inspection,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspect")({
  validateSearch: (s: Record<string, unknown>): { vehicle?: string | undefined } => ({
    vehicle: typeof s["vehicle"] === "string" ? s["vehicle"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: `New inspection — ${APP_NAME}` },
      { name: "description", content: "Pick a vehicle and reference photo, capture an inspection photo and measure bolt rotation." },
      { property: "og:title", content: `New inspection — ${APP_NAME}` },
      { property: "og:description", content: "Pick a vehicle and reference photo, capture an inspection photo and measure bolt rotation." },
    ],
  }),
  component: InspectFlow,
});

type Step = "vehicle" | "reference" | "capture" | "processing" | "result";
const stepOrder: Step[] = ["vehicle", "reference", "capture", "processing", "result"];

function InspectFlow() {
  const search = Route.useSearch();
  const [inspectorName] = useInspectorName();
  const inspector = inspectorName || DEFAULT_INSPECTOR;
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (vars: { inspection: Inspection; photo: string | null }) => saveInspection({ ...vars, inspectorName: vars.inspection.inspector }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inspectionsKey }),
  });
  const navigate = useNavigate();
  const [vehicleId, setVehicleId] = useState<string | null>(search.vehicle ?? null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [result, setResult] = useState<Inspection | null>(null);
  const [step, setStep] = useState<Step>(search.vehicle ? "reference" : "vehicle");

  const back = () => {
    const i = stepOrder.indexOf(step);
    if (step === "vehicle") navigate({ to: "/" });
    else if (step === "result") setStep("capture");
    else setStep(stepOrder[i - 1] ?? "vehicle");
  };

  if (step === "capture" || step === "processing") {
    return (
      <AppShell hideNav tone="scan">
        {step === "capture" ? (
          <CaptureScreen
            referenceId={referenceId!}
            onBack={back}
            onCapture={(img) => {
              setCaptured(img);
              setStep("processing");
            }}
          />
        ) : (
          <ProcessingScreen
            image={captured ?? getReference(referenceId!)!.image}
            onDone={() => {
              const r = { ...simulateInspection(referenceId!), inspector };
              setResult(r);
              setStep("result");
              if (needsRetake(r.bolts.map((b) => b.confidence))) save.reset();
              else save.mutate({ inspection: r, photo: captured });
            }}
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell hideNav={step === "result"}>
      <header className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button type="button" onClick={back} className="flex size-10 items-center justify-center rounded-full border bg-card" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <Stepper step={step} />
          <Link to="/" className="flex size-10 items-center justify-center rounded-full text-muted-foreground" aria-label="Close">
            <X className="size-5" />
          </Link>
        </div>
      </header>

      {step === "vehicle" && (
        <section className="px-5 pt-4">
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">Which vehicle?</h1>
          <div className="mt-5 flex flex-col gap-2.5">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVehicleId(v.id);
                  setReferenceId(null);
                  setStep("reference");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card",
                  vehicleId === v.id && "border-primary ring-2 ring-primary/30",
                )}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
                  <VehicleIcon type={v.type} className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[11px] text-muted-foreground">{v.code}</p>
                  <p className="font-semibold">{v.name}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "reference" && vehicleId && (
        <section className="px-5 pt-4">
          <p className="eyebrow">Step 2 of 3 · {getVehicle(vehicleId)?.code}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">Choose a reference</h1>
          <p className="mt-1 text-sm text-muted-foreground">The new photo will be compared against this baseline.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {referencesFor(vehicleId).map((r) => {
              const selected = referenceId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReferenceId(r.id)}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card text-left shadow-card transition-all",
                    selected && "border-primary ring-2 ring-primary/40",
                  )}
                >
                  <BoltPhoto src={r.image} alt={r.location} markers={r.bolts.map((b) => ({ bolt: b }))} />
                  {selected && (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight">{r.location}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {r.bolts.length} bolts · {format(new Date(r.capturedAt), "d MMM yyyy")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!referenceId}
            onClick={() => setStep("capture")}
            className="mt-6 w-full rounded-2xl bg-signal py-4 font-semibold text-primary-foreground shadow-signal transition-opacity disabled:opacity-40 disabled:shadow-none"
          >
            Continue to camera
          </button>
        </section>
      )}

      {step === "result" && result && (
        <>
          <section className="px-5 pt-3 pb-4">
            <p className="eyebrow">Inspection result</p>
            <p className="mt-2 rounded-xl border border-dashed bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Demo result.</span> The detection model isn't connected yet,
              so these bolts and angles are sample values from the reference photo — your photo was not analyzed.
            </p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">
              {getVehicle(result.vehicleId)?.code} · {getReference(result.referenceId)?.location}
            </h1>
          </section>
          <div className="mx-5 mb-4 flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-sm">
            {save.isPending && <span className="text-muted-foreground">Saving photo and results…</span>}
            {save.isSuccess && (
              <>
                <span className="font-medium">Saved to {getVehicle(result.vehicleId)?.code} history</span>
                <Link to="/results/$inspectionId" params={{ inspectionId: save.data }} className="font-semibold text-primary">View</Link>
              </>
            )}
            {save.isError && (
              <>
                <span className="text-loose">Couldn't save this inspection.</span>
                <button type="button" onClick={() => save.variables && save.mutate(save.variables)} className="font-semibold text-primary">Try again</button>
              </>
            )}
            {save.isIdle && <span className="text-muted-foreground">Not saved — retake the photo first.</span>}
          </div>
          <ResultView
            inspection={result}
            inspectionImage={captured ?? undefined}
            animate
            onRetake={() => {
              setCaptured(null);
              setStep("capture");
            }}
          />
          <div className="flex gap-3 px-5 pt-6 pb-8">
            <Link to="/" className="flex-1 rounded-2xl border bg-card py-4 text-center font-semibold">
              Done
            </Link>
            <button
              type="button"
              onClick={() => {
                setReferenceId(null);
                setCaptured(null);
                setStep("reference");
              }}
              className="flex-1 rounded-2xl bg-foreground py-4 font-semibold text-background"
            >
              Inspect next area
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stepper({ step }: { step: Step }) {
  const idx = Math.min(stepOrder.indexOf(step), 2);
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("h-1.5 rounded-full transition-all", i <= idx ? "w-8 bg-primary" : "w-4 bg-border")} />
      ))}
    </div>
  );
}

function CaptureScreen({
  referenceId,
  onBack,
  onCapture,
}: {
  referenceId: string;
  onBack: () => void;
  onCapture: (img: string | null) => void;
}) {
  const ref = getReference(referenceId)!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [ghost, setGhost] = useState(35);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setLive(true);
        }
      })
      .catch(() => setLive(false));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (live && v && v.videoWidth) {
      const size = Math.min(v.videoWidth, v.videoHeight);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d")!.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, size, size);
      onCapture(c.toDataURL("image/jpeg", 0.85));
    } else {
      onCapture(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <button type="button" onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-scan-line" aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-scan-muted">Step 3 of 3</p>
          <p className="text-sm font-semibold">{ref.location}</p>
        </div>
        <button
          type="button"
          onClick={() => setFlash((f) => !f)}
          className={cn("flex size-10 items-center justify-center rounded-full", flash ? "bg-primary text-primary-foreground" : "bg-scan-line")}
          aria-label="Toggle flash"
        >
          <Zap className="size-5" />
        </button>
      </header>

      <div className="relative mx-5 mt-5 aspect-square overflow-hidden rounded-3xl bg-scan-line">
        {live ? (
          <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} className="hidden" />
            <div className="absolute inset-0 grid-hatch opacity-60" />
          </>
        )}
        <img
          src={ref.image}
          alt="Reference overlay"
          style={{ opacity: live ? ghost / 100 : Math.max(ghost, 55) / 100 }}
          className="pointer-events-none absolute inset-0 size-full object-cover mix-blend-screen"
        />
        {ref.bolts.map((b) => (
          <span
            key={b.id}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.size}%`, height: `${b.size}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-dashed border-primary/80"
          />
        ))}
        {(["top-3 left-3 border-t-2 border-l-2", "top-3 right-3 border-t-2 border-r-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"] as const).map((c) => (
          <span key={c} className={cn("absolute size-7 rounded-sm border-scan-foreground", c)} />
        ))}
        {!live && (
          <p className="absolute inset-x-0 bottom-3 text-center font-mono text-[10px] uppercase tracking-widest text-scan-muted">
            Camera unavailable · demo mode
          </p>
        )}
      </div>

      <div className="mx-5 mt-4 rounded-2xl bg-scan-line/60 p-4">
        <div className="flex items-center gap-3">
          <Layers className="size-4 text-scan-muted" />
          <span className="text-xs text-scan-muted">Reference overlay</span>
          <input
            type="range"
            min={0}
            max={80}
            value={ghost}
            onChange={(e) => setGhost(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Reference overlay opacity"
          />
          <span className="w-9 text-right font-mono text-xs">{ghost}%</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-scan-muted">
          Line up the dashed boxes with the bolts. Keep the same angle and ~25 cm distance as the reference.
        </p>
      </div>

      <div className="mt-auto flex items-center justify-around px-8 pt-6 pb-10">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex size-12 items-center justify-center rounded-xl bg-scan-line"
          aria-label="Choose from gallery"
        >
          <ImageIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={shoot}
          className="flex size-20 items-center justify-center rounded-full border-4 border-scan-foreground transition-transform active:scale-90"
          aria-label="Capture inspection photo"
        >
          <span className="size-[60px] rounded-full bg-signal" />
        </button>
        <span className="w-12" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => onCapture(String(reader.result));
            reader.readAsDataURL(f);
          }}
        />
      </div>
    </div>
  );
}

const stages = ["Detecting bolts (YOLOv8)", "Aligning perspective to reference", "Estimating rotation angles"];

function ProcessingScreen({ image, onDone }: { image: string; onDone: () => void }) {
  const [stage, setStage] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 2900),
      setTimeout(() => doneRef.current(), 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-1 flex-col px-5 pt-10">
      <p className="text-center font-mono text-[11px] uppercase tracking-widest text-scan-muted">Demo · simulated analysis</p>
      <h1 className="mt-1 text-center font-display text-2xl font-extrabold">Measuring rotation…</h1>
      <div className="relative mt-6 aspect-square overflow-hidden rounded-3xl scanline">
        <img src={image} alt="Captured inspection" className="size-full object-cover" />
        <div className="absolute inset-0 grid-hatch opacity-20" />
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {stages.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > stage && "opacity-40")}>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full",
                i < stage ? "bg-ok text-primary-foreground" : "bg-scan-line",
              )}
            >
              {i < stage ? <Check className="size-3.5" /> : i === stage ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
