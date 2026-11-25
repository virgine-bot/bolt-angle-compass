import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Images, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { InspectionRow, WorstBadge, worstStatus } from "@/components/bolt/inspection-row";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import { inspectionsForType, latestPerArea } from "@/lib/history";
import { inspectionsQuery } from "@/lib/inspections-api";
import { DEFAULT_AREA, vehicleTypes, type VehicleType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { createVehicle, vehiclesKey, vehiclesQuery } from "@/lib/vehicles-api";

export const Route = createFileRoute("/fleet")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(inspectionsQuery()), context.queryClient.ensureQueryData(vehiclesQuery())]).then(() => undefined),
  head: () => ({
    meta: [
      { title: `Vehicles — ${APP_NAME}` },
      { name: "description", content: "Inspected bolts grouped by motorbike, bicycle and scooter, with the latest status of each spot." },
      { property: "og:title", content: `Vehicles — ${APP_NAME}` },
      { property: "og:description", content: "Inspected bolts grouped by motorbike, bicycle and scooter, with the latest status of each spot." },
    ],
  }),
  component: Vehicles,
});

function Vehicles() {
  const [type, setType] = useState<VehicleType>("motorbike");
  const [q, setQ] = useState("");
  const { data: all } = useSuspenseQuery(inspectionsQuery());
  const { data: vehicles } = useSuspenseQuery(vehiclesQuery());
  const [adding, setAdding] = useState(false);
  const saved = vehicles.filter(
    (v) => v.vehicleType === type && `${v.name} ${v.plate ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );
  const spots = latestPerArea(inspectionsForType(all, type).filter((i) => !i.vehicleId || !vehicles.some((v) => v.id === i.vehicleId))).filter((i) =>
    `${i.area ?? DEFAULT_AREA} ${i.inspector}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <ScreenHeader eyebrow="Grouped by type" title="Vehicles" />
      <div className="grid grid-cols-3 gap-2 px-5">
        {vehicleTypes.map((t) => {
          const latest = latestPerArea(inspectionsForType(all, t.id));
          const flagged = latest.filter((i) => ["loose", "monitor", "retake"].includes(worstStatus(i))).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border bg-card p-3 text-left shadow-card transition-colors",
                type === t.id && "border-foreground bg-foreground text-background",
              )}
            >
              <VehicleIcon type={t.id} className="size-6" />
              <span className="text-sm font-semibold">{t.plural}</span>
              <span className={cn("font-mono text-[11px]", type === t.id ? "opacity-70" : "text-muted-foreground")}>
                {latest.length} spot{latest.length !== 1 && "s"}
                {flagged > 0 && ` · ${flagged} flagged`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-5 pt-4">
        <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vehicle, part or inspector"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Saved vehicles</p>
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <Plus className="size-4" /> Add vehicle
          </button>
        </div>
        {adding && <AddVehicleForm type={type} onClose={() => setAdding(false)} />}
        {saved.map((v) => {
          const last = all.find((i) => i.vehicleId === v.id);
          return (
            <Link
              key={v.id}
              to="/vehicles/$vehicleId"
              params={{ vehicleId: v.id }}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card"
            >
              {v.references[0]?.photoUrl ? (
                <img src={v.references[0].photoUrl} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-xl bg-secondary">
                  <VehicleIcon type={v.vehicleType} className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{v.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {v.plate ? `${v.plate} · ` : ""}
                  <Images className="inline size-3" /> {v.references.length} ref{v.references.length !== 1 && "s"}
                </p>
              </div>
              {last ? <WorstBadge inspection={last} /> : null}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
        {saved.length === 0 && !adding && (
          <p className="py-3 text-center text-sm text-muted-foreground">No saved {vehicleTypes.find((t) => t.id === type)?.plural.toLowerCase()} yet.</p>
        )}

        <p className="eyebrow mt-4">Quick checks (no saved vehicle)</p>
        {spots.map((i) => (
          <InspectionRow key={i.id} inspection={i} />
        ))}
        {spots.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No inspections here yet.</p>
        )}
        <Link
          to="/inspect"
          search={{ vehicle: type }}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-sm font-semibold"
        >
          <Plus className="size-4" /> Inspect a {vehicleTypes.find((t) => t.id === type)?.label.toLowerCase()}
        </Link>
      </div>
    </AppShell>
  );
}

function AddVehicleForm({ type, onClose }: { type: VehicleType; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [vType, setVType] = useState<VehicleType>(type);
  const m = useMutation({
    mutationFn: () => createVehicle({ name, vehicleType: vType, plate }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: vehiclesKey });
      onClose();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) m.mutate();
      }}
      className="flex flex-col gap-2.5 rounded-2xl border bg-card p-3 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">New vehicle</p>
        <button type="button" onClick={onClose} aria-label="Cancel" className="text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {vehicleTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setVType(t.id)}
            className={cn("rounded-lg border py-1.5 text-xs font-medium", vType === t.id && "border-foreground bg-foreground text-background")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Name, e.g. Honda Beat #3" className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
      <input value={plate} onChange={(e) => setPlate(e.target.value)} maxLength={30} placeholder="Plate / fleet code (optional)" className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
      {m.isError && <p className="text-xs text-loose">Couldn't save. Try again.</p>}
      <button type="submit" disabled={!name.trim() || m.isPending} className="rounded-xl bg-signal py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {m.isPending ? "Saving…" : "Save vehicle"}
      </button>
    </form>
  );
}
