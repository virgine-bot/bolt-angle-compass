import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { worstStatus } from "@/components/bolt/inspection-row";
import { StatusBadge } from "@/components/bolt/status-badge";
import { VehicleIcon } from "@/components/bolt/vehicle-icon";
import { APP_NAME } from "@/lib/app-config";
import { latestInspectionFor, referencesFor, vehicles, type VehicleType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fleet")({
  head: () => ({
    meta: [
      { title: `Fleet — ${APP_NAME}` },
      { name: "description", content: "All bicycles, scooters and motorbikes in the fleet with their latest bolt inspection status." },
      { property: "og:title", content: `Fleet — ${APP_NAME}` },
      { property: "og:description", content: "All bicycles, scooters and motorbikes in the fleet with their latest bolt inspection status." },
    ],
  }),
  component: Fleet,
});

const filters: Array<{ id: VehicleType | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "scooter", label: "Scooters" },
  { id: "motorbike", label: "Motorbikes" },
  { id: "bicycle", label: "Bicycles" },
];

function Fleet() {
  const [filter, setFilter] = useState<VehicleType | "all">("all");
  const [q, setQ] = useState("");
  const list = vehicles.filter(
    (v) =>
      (filter === "all" || v.type === filter) &&
      `${v.code} ${v.name} ${v.depot}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <ScreenHeader eyebrow={`${vehicles.length} vehicles`} title="Fleet" />
      <div className="px-5">
        <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, model or depot"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.id ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        {list.map((v) => {
          const last = latestInspectionFor(v.id);
          return (
            <Link
              key={v.id}
              to="/vehicles/$vehicleId"
              params={{ vehicleId: v.id }}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                <VehicleIcon type={v.type} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-muted-foreground">{v.code}</p>
                <p className="truncate font-semibold">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.depot} · {referencesFor(v.id).length} reference{referencesFor(v.id).length !== 1 && "s"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {last ? <StatusBadge status={worstStatus(last)} /> : <StatusBadge status="retake" label="New" />}
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No vehicles match.</p>}
      </div>
    </AppShell>
  );
}
