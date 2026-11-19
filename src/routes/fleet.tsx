import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { InspectionRow, worstStatus } from "@/components/bolt/inspection-row";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import { inspectionsForType, latestPerArea } from "@/lib/history";
import { inspectionsQuery } from "@/lib/inspections-api";
import { DEFAULT_AREA, vehicleTypes, type VehicleType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fleet")({
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionsQuery()).then(() => undefined),
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
  const spots = latestPerArea(inspectionsForType(all, type)).filter((i) =>
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
            placeholder="Search part or inspector"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        <p className="eyebrow">Latest check per spot</p>
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
