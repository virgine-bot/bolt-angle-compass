import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Camera, Plus } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/bolt/app-shell";
import { InspectionRow } from "@/components/bolt/inspection-row";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import { getVehicle, inspectionsFor, referencesFor } from "@/lib/mock-data";

export const Route = createFileRoute("/vehicles/$vehicleId")({
  loader: ({ params }) => {
    const vehicle = getVehicle(params.vehicleId);
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.vehicle.code} ${loaderData.vehicle.name} — ${APP_NAME}` : `Vehicle — ${APP_NAME}`;
    const description = "Reference photos, bolt locations and inspection history for this vehicle.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10 text-center">
        <p className="font-semibold">Vehicle not found</p>
        <Link to="/fleet" className="mt-3 inline-block text-primary">
          Back to fleet
        </Link>
      </div>
    </AppShell>
  ),
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicle } = Route.useLoaderData();
  const refs = referencesFor(vehicle.id);
  const history = inspectionsFor(vehicle.id);

  return (
    <AppShell>
      <header className="px-5 pt-6">
        <Link to="/fleet" className="flex size-10 items-center justify-center rounded-full border bg-card" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{vehicle.code}</p>
            <h1 className="mt-1 font-display text-[28px] leading-tight font-extrabold tracking-tight">{vehicle.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {vehicle.type} · {vehicle.depot}
            </p>
          </div>
          <div className="flex size-16 items-center justify-center rounded-2xl bg-scan text-scan-foreground">
            <VehicleIcon type={vehicle.type} className="size-8" />
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2">
          <Fact label="Odometer" value={vehicle.odometer} />
          <Fact label="References" value={String(refs.length)} />
          <Fact label="Inspections" value={String(history.length)} />
        </dl>
      </header>

      <section className="pt-7">
        <div className="mb-3 flex items-baseline justify-between px-5">
          <h2 className="font-display text-lg font-bold">Reference photos</h2>
          <span className="eyebrow">Baseline</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2">
          {refs.map((r) => (
            <div key={r.id} className="w-40 shrink-0 overflow-hidden rounded-2xl border bg-card shadow-card">
              <img src={r.image} alt={r.location} className="aspect-square w-full object-cover" />
              <div className="p-3">
                <p className="truncate text-sm font-semibold">{r.location}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {r.bolts.length} bolts · {format(new Date(r.capturedAt), "d MMM")}
                </p>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="flex w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-muted-foreground"
          >
            <Plus className="size-6" />
            <span className="text-sm font-medium">New reference</span>
          </button>
        </div>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 font-display text-lg font-bold">Inspection history</h2>
        <div className="flex flex-col gap-2.5">
          {history.map((i) => (
            <InspectionRow key={i.id} inspection={i} />
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground">No inspections yet.</p>}
        </div>
      </section>

      <div className="px-5 pt-6">
        <Link
          to="/inspect"
          search={{ vehicle: vehicle.id }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-signal py-4 font-semibold text-primary-foreground shadow-signal"
        >
          <Camera className="size-5" /> Inspect this vehicle
        </Link>
      </div>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-readout text-base font-semibold">{value}</dd>
    </div>
  );
}
