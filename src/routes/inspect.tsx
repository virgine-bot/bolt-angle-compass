import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Camera, Check, ChevronRight, History, Image as ImageIcon, Layers, Loader2, ScanSearch, X, Zap } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { AppShell } from "@/components/bolt/app-shell";
import { WorstBadge } from "@/components/bolt/inspection-row";
import { ResultView } from "@/components/bolt/result-view";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import { inspectionsForType, latestPerArea } from "@/lib/history";
import { needsRetake } from "@/lib/inspection";
import { inspectionsKey, inspectionsQuery, saveInspection } from "@/lib/inspections-api";
import {
  areaSuggestions,
  DEFAULT_AREA,
  isVehicleType,
  samplePhotos,
  simulateInspection,
  vehicleTypeLabel,
  vehicleTypes,
  type Inspection,
  type VehicleType,
} from "@/lib/mock-data";
import { DEFAULT_INSPECTOR, useInspectorName } from "@/lib/user";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspect")({
  validateSearch: (s: Record<string, unknown>): { vehicle?: string | undefined } => ({
    vehicle: typeof s["vehicle"] === "string" ? s["vehicle"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: `New inspection — ${APP_NAME}` },
      { name: "description", content: "Pick motorbike, bicycle or scooter, photograph any bolt and check whether it has loosened." },
      { property: "og:title", content: `New inspection — ${APP_NAME}` },
      { property: "og:description", content: "Pick motorbike, bicycle or scooter, photograph any bolt and check whether it has loosened." },
    ],
  }),
  component: InspectFlow,
});

type Step = "type" | "setup" | "capture" | "processing" | "result";

/** Where the "before" photo comes from: none (detect only), a fresh photo, or an earlier inspection of the same spot. */
type ReferenceChoice =
  | { kind: "none" }
  | { kind: "new"; photo: string }
  | { kind: "earlier"; inspection: Inspection };

const readFile = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

function InspectFlow() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [inspectorName] = useInspectorName();
  const inspector = inspectorName || DEFAULT_INSPECTOR;
  const queryClient = useQueryClient();
  const { data: all = [] } = useQuery(inspectionsQuery());

  const initialType = search.vehicle && isVehicleType(search.vehicle) ? search.vehicle : null;
  const [type, setType] = useState<VehicleType | null>(initialType);
  const [step, setStep] = useState<Step>(initialType ? "setup" : "type");
  const [area, setArea] = useState("");
  const [reference, setReference] = useState<ReferenceChoice>({ kind: "none" });
  const [captured, setCaptured] = useState<string | null>(null);
  const [result, setResult] = useState<Inspection | null>(null);

  const save = useMutation({
    mutationFn: (vars: { inspection: Inspection; photo: string; reference: ReferenceChoice }) =>
      saveInspection({
        inspection: vars.inspection,
        photo: vars.photo,
        reference:
          vars.reference.kind === "new"
            ? { newPhoto: vars.reference.photo }
            : vars.reference.kind === "earlier"
              ? (() => {
                  const p = vars.reference.inspection.referencePhotoPath ?? vars.reference.inspection.photoPath;
                  return p ? { storedPath: p } : null;
                })()
              : null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inspectionsKey }),
  });

  const referenceImage =
    reference.kind === "new"
      ? reference.photo
      : reference.kind === "earlier"
        ? (reference.inspection.referencePhotoUrl ?? reference.inspection.photoUrl ?? null)
        : null;

  const back = () => {
    if (step === "type") navigate({ to: "/" });
    else if (step === "setup") setStep("type");
    else if (step === "result") setStep("capture");
    else setStep("setup");
  };

  const runAnalysis = () => {
    const earlier = reference.kind === "earlier" ? reference.inspection : undefined;
    const sim = simulateInspection({ hasReference: reference.kind !== "none", previous: earlier?.bolts });
    const id = `draft-${Date.now()}`;
    const photo = captured ?? samplePhotos[Math.floor(Math.random() * samplePhotos.length)]!;
    const r: Inspection = {
      id,
      vehicleType: type ?? "motorbike",
      area: earlier ? earlier.area : area.trim() || null,
      seriesId: earlier ? earlier.seriesId : id,
      capturedAt: new Date().toISOString(),
      processingMs: sim.processingMs,
      inspector,
      bolts: sim.bolts,
      photoUrl: photo,
      referencePhotoUrl: referenceImage,
    };
    setCaptured(photo);
    setResult(r);
    setStep("result");
    if (needsRetake(r.bolts.map((b) => b.confidence))) save.reset();
    else save.mutate({ inspection: r, photo, reference });
  };

  if (step === "capture" || step === "processing") {
    return (
      <AppShell hideNav tone="scan">
        {step === "capture" ? (
          <CaptureScreen
            title={reference.kind === "earlier" ? (reference.inspection.area ?? DEFAULT_AREA) : area.trim() || DEFAULT_AREA}
            referenceImage={referenceImage}
            guideBolts={reference.kind === "earlier" ? reference.inspection.bolts : []}
            onBack={back}
            onCapture={(img) => {
              setCaptured(img);
              setStep("processing");
            }}
          />
        ) : (
          <ProcessingScreen image={captured ?? samplePhotos[0]!} measuring={reference.kind !== "none"} onDone={runAnalysis} />
        )}
      </AppShell>
    );
  }

  const earlierSpots = type ? latestPerArea(inspectionsForType(all, type)).slice(0, 6) : [];

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

      {step === "type" && (
        <section className="px-5 pt-4">
          <p className="eyebrow">Step 1 of 3</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">What are you inspecting?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Any bolt on any part — you'll photograph it next.</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {vehicleTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setType(t.id);
                  setReference({ kind: "none" });
                  setStep("setup");
                }}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-card",
                  type === t.id && "border-primary ring-2 ring-primary/30",
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                  <VehicleIcon type={t.id} className="size-6" />
                </div>
                <p className="flex-1 font-display text-lg font-bold">{t.label}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "setup" && type && (
        <section className="px-5 pt-4">
          <p className="eyebrow">Step 2 of 3 · {vehicleTypeLabel(type)}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">Before the photo</h1>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">Which part? <span className="font-normal text-muted-foreground">(optional)</span></span>
            <input
              value={reference.kind === "earlier" ? (reference.inspection.area ?? DEFAULT_AREA) : area}
              disabled={reference.kind === "earlier"}
              onChange={(e) => setArea(e.target.value)}
              maxLength={60}
              placeholder={DEFAULT_AREA}
              className="mt-2 w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
            />
          </label>
          {reference.kind !== "earlier" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {areaSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setArea(area === s ? "" : s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    area === s ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <p className="mt-6 text-sm font-semibold">Reference photo <span className="font-normal text-muted-foreground">(optional)</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">With a "before" photo the app can measure how far each bolt has turned.</p>
          <div className="mt-3 flex flex-col gap-2">
            <ChoiceCard
              selected={reference.kind === "none"}
              onClick={() => setReference({ kind: "none" })}
              icon={<ScanSearch className="size-5" />}
              title="No reference — detect bolts only"
              note="Quick check, no rotation angle"
            />
            <NewReferenceCard
              selected={reference.kind === "new"}
              photo={reference.kind === "new" ? reference.photo : null}
              onPhoto={(photo) => setReference({ kind: "new", photo })}
            />
          </div>

          {earlierSpots.length > 0 && (
            <>
              <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold">
                <History className="size-4" /> Or re-check an earlier spot
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {earlierSpots.map((i) => {
                  const selected = reference.kind === "earlier" && reference.inspection.id === i.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setReference(selected ? { kind: "none" } : { kind: "earlier", inspection: i })}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border bg-card p-2.5 text-left shadow-card",
                        selected && "border-primary ring-2 ring-primary/30",
                      )}
                    >
                      <img src={i.referencePhotoUrl ?? i.photoUrl ?? samplePhotos[0]} alt="" className="size-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{i.area ?? DEFAULT_AREA}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {i.bolts.length} bolt{i.bolts.length !== 1 && "s"} · {format(new Date(i.capturedAt), "d MMM")}
                        </p>
                      </div>
                      {selected ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-4" />
                        </span>
                      ) : (
                        <WorstBadge inspection={i} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setStep("capture")}
            className="mt-6 mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-signal py-4 font-semibold text-primary-foreground shadow-signal"
          >
            <Camera className="size-5" /> Open camera
          </button>
        </section>
      )}

      {step === "result" && result && (
        <>
          <section className="px-5 pt-3 pb-4">
            <p className="eyebrow">Inspection result · {vehicleTypeLabel(result.vehicleType)}</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">{result.area ?? DEFAULT_AREA}</h1>
            <p className="mt-2 rounded-xl border border-dashed bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Demo result.</span> The detection model isn't connected yet, so the
              bolts and angles below are sample values — your photo was saved but not analyzed.
            </p>
          </section>
          <div className="mx-5 mb-4 flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-sm">
            {save.isPending && <span className="text-muted-foreground">Saving photo and results…</span>}
            {save.isSuccess && (
              <>
                <span className="font-medium">Saved to history</span>
                <Link to="/results/$inspectionId" params={{ inspectionId: save.data }} className="font-semibold text-primary">
                  View
                </Link>
              </>
            )}
            {save.isError && (
              <>
                <span className="text-loose">Couldn't save this inspection.</span>
                <button type="button" onClick={() => save.variables && save.mutate(save.variables)} className="font-semibold text-primary">
                  Try again
                </button>
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
                setArea("");
                setReference({ kind: "none" });
                setCaptured(null);
                setResult(null);
                save.reset();
                setStep("setup");
              }}
              className="flex-1 rounded-2xl bg-foreground py-4 font-semibold text-background"
            >
              Inspect another bolt
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  note,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-card", selected && "border-primary ring-2 ring-primary/30")}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
      {selected && (
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
      )}
    </button>
  );
}

function NewReferenceCard({ selected, photo, onPhoto }: { selected: boolean; photo: string | null; onPhoto: (p: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-card", selected && "border-primary ring-2 ring-primary/30")}
      >
        {photo ? (
          <img src={photo} alt="Reference" className="size-10 rounded-xl object-cover" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
            <ImageIcon className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{photo ? "Reference photo added" : "Add a reference photo"}</span>
          <span className="block text-xs text-muted-foreground">{photo ? "Tap to replace" : "Take or upload the \"before\" photo"}</span>
        </span>
        {selected && (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Reference photo"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(await readFile(f));
          e.target.value = "";
        }}
      />
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const idx = step === "type" ? 0 : step === "setup" ? 1 : 2;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("h-1.5 rounded-full transition-all", i <= idx ? "w-8 bg-primary" : "w-4 bg-border")} />
      ))}
    </div>
  );
}

function CaptureScreen({
  title,
  referenceImage,
  guideBolts,
  onBack,
  onCapture,
}: {
  title: string;
  referenceImage: string | null;
  guideBolts: Array<{ id: string; x: number; y: number; size: number }>;
  onBack: () => void;
  onCapture: (img: string | null) => void;
}) {
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
          <p className="text-sm font-semibold">{title}</p>
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
        {referenceImage && (
          <img
            src={referenceImage}
            alt="Reference overlay"
            style={{ opacity: ghost / 100 }}
            className="pointer-events-none absolute inset-0 size-full object-cover mix-blend-screen"
          />
        )}
        {guideBolts.map((b) => (
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
        {referenceImage && (
          <div className="mb-2 flex items-center gap-3">
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
        )}
        <p className="text-xs leading-relaxed text-scan-muted">
          {referenceImage
            ? "Line up with the reference photo. Keep the same angle and about 25 cm distance."
            : "Fill the frame with the bolt(s), about 25 cm away, and avoid glare."}
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
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onCapture(await readFile(f));
          }}
        />
      </div>
    </div>
  );
}

function ProcessingScreen({ image, measuring, onDone }: { image: string; measuring: boolean; onDone: () => void }) {
  const stages = measuring
    ? ["Detecting bolts (YOLOv8)", "Aligning perspective to reference", "Estimating rotation angles"]
    : ["Detecting bolts (YOLOv8)", "Checking detection confidence", "Preparing results"];
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
      <h1 className="mt-1 text-center font-display text-2xl font-extrabold">{measuring ? "Measuring rotation…" : "Finding bolts…"}</h1>
      <div className="relative mt-6 aspect-square overflow-hidden rounded-3xl scanline">
        <img src={image} alt="Captured inspection" className="size-full object-cover" />
        <div className="absolute inset-0 grid-hatch opacity-20" />
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {stages.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > stage && "opacity-40")}>
            <span className={cn("flex size-6 items-center justify-center rounded-full", i < stage ? "bg-ok text-primary-foreground" : "bg-scan-line")}>
              {i < stage ? <Check className="size-3.5" /> : i === stage ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
