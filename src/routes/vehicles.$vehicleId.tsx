import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Camera, ImagePlus, ScanLine } from "lucide-react";
import { useRef, useState } from "react";
import { format } from "date-fns";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { InspectionRow } from "@/components/bolt/inspection-row";
import { APP_NAME } from "@/lib/app-config";
import { inspectionsQuery } from "@/lib/inspections-api";
import { areaSuggestions, vehicleTypeLabel } from "@/lib/mock-data";
import { addVehicleReference, vehiclesKey, vehiclesQuery } from "@/lib/vehicles-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles/$vehicleId")({
  loader: async ({ context, params }) => {
    const [vehicles] = await Promise.all([
      context.queryClient.ensureQueryData(vehiclesQuery()),
      context.queryClient.ensureQueryData(inspectionsQuery()),
    ]);
    const v = vehicles.find((x) => x.id === params.vehicleId);
    if (!v) throw notFound();
    return { name: v.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Vehicle"} — ${APP_NAME}` },
      { name: "description", content: "Reference photos and inspection history for one saved vehicle." },
      { property: "og:title", content: `${loaderData?.name ?? "Vehicle"} — ${APP_NAME}` },
      { property: "og:description", content: "Reference photos and inspection history for one saved vehicle." },
    ],
  }),
  notFoundComponent: () => (
    <AppShell>
      <p className="p-8 text-center text-sm text-muted-foreground">Vehicle not found. <Link to="/fleet" className="text-primary">Back</Link></p>
    </AppShell>
  ),
  component: VehicleDetail,
});

const readFile = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });

function VehicleDetail() {
  const { vehicleId } = Route.useParams();
  const { data: vehicles } = useSuspenseQuery(vehiclesQuery());
  const { data: all } = useSuspenseQuery(inspectionsQuery());
  const v = vehicles.find((x) => x.id === vehicleId)!;
  const history = all.filter((i) => i.vehicleId === vehicleId);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const add = useMutation({
    mutationFn: async (f: File) => addVehicleReference(vehicleId, label, await readFile(f)),
    onSuccess: () => {
      setLabel("");
      return qc.invalidateQueries({ queryKey: vehiclesKey });
    },
  });

  return (
    <AppShell>
      <ScreenHeader
        back={
          <Link to="/fleet" className="mb-3 flex size-10 items-center justify-center rounded-full border bg-card" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        }
        eyebrow={`${vehicleTypeLabel(v.vehicleType)}${v.plate ? ` · ${v.plate}` : ""}`}
        title={v.name}
      />

      <div className="px-5">
        <Link
          to="/inspect"
          search={{ vehicle: v.vehicleType, vehicleId: v.id }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-signal py-3.5 font-semibold text-primary-foreground shadow-signal"
        >
          <ScanLine className="size-5" /> Inspect this vehicle
        </Link>
      </div>

      <section className="px-5 pt-6">
        <p className="eyebrow">Reference photos ({v.references.length})</p>
        <p className="mt-1 text-xs text-muted-foreground">Photos of bolts in their correct, tight position. Inspections compare against these.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {v.references.map((r) => (
            <figure key={r.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
              {r.photoUrl && <img src={r.photoUrl} alt={r.label} className="aspect-square w-full object-cover" />}
              <figcaption className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold">{r.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{format(new Date(r.createdAt), "d MMM yyyy")}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-dashed bg-card p-3">
          <p className="text-sm font-semibold">Add reference photo</p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            placeholder="Which part? e.g. Brake"
            className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {areaSuggestions.map((s) => (
              <button key={s} type="button" onClick={() => setLabel(s)} className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", label === s ? "border-foreground bg-foreground text-background" : "text-muted-foreground")}>
                {s}
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) add.mutate(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => fileRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {add.isPending ? "Uploading…" : (<><Camera className="size-4" /> Take or upload photo <ImagePlus className="size-4" /></>)}
          </button>
          {add.isError && <p className="mt-2 text-xs text-loose">Couldn't save the photo. Try again.</p>}
        </div>
      </section>

      <section className="flex flex-col gap-2.5 px-5 pt-6">
        <p className="eyebrow">Inspection history ({history.length})</p>
        {history.map((i) => <InspectionRow key={i.id} inspection={i} />)}
        {history.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No inspections for this vehicle yet.</p>}
      </section>
    </AppShell>
  );
}
