import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/bolt/app-shell";
import { BoltPhoto } from "@/components/bolt/bolt-photo";
import { StatusBadge } from "@/components/bolt/status-badge";
import { APP_NAME } from "@/lib/app-config";
import { compareInspections, findInspection, sameAreaInspections } from "@/lib/history";
import { formatAngle, measuredStatus } from "@/lib/inspection";
import { inspectionsQuery } from "@/lib/inspections-api";
import { DEFAULT_AREA, samplePhotos, vehicleTypeLabel, type Inspection } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): { a: string; b: string } => ({
    a: typeof s["a"] === "string" ? s["a"] : "",
    b: typeof s["b"] === "string" ? s["b"] : "",
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionsQuery()).then(() => undefined),
  head: () => ({
    meta: [
      { title: `Compare inspections — ${APP_NAME}` },
      { name: "description", content: "Compare two inspections of the same bolts side by side to see how far each bolt has rotated." },
      { property: "og:title", content: `Compare inspections — ${APP_NAME}` },
      { property: "og:description", content: "Compare two inspections of the same bolts side by side to see how far each bolt has rotated." },
    ],
  }),
  component: ComparePage,
});

const angleText = (a: number | null | undefined) => (a == null ? "—" : formatAngle(a));

function ComparePage() {
  const { a, b } = Route.useSearch();
  const { data: list } = useSuspenseQuery(inspectionsQuery());
  const later = findInspection(list, b);
  const earlier = findInspection(list, a);
  if (!later || !earlier) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          <p className="font-semibold">Pick two inspections to compare</p>
          <Link to="/history" className="mt-3 inline-block text-primary">Go to history</Link>
        </div>
      </AppShell>
    );
  }
  const changes = compareInspections(earlier, later);
  const others = sameAreaInspections(list, later.seriesId).filter((i) => i.id !== later.id);
  const worsened = changes.filter((c) => c.worsened).length;

  const photo = (ins: Inspection, label: string) => (
    <figure className="overflow-hidden rounded-2xl bg-scan">
      <BoltPhoto
        src={ins.photoUrl ?? ins.referencePhotoUrl ?? samplePhotos[0]!}
        alt={`${label} inspection`}
        markers={ins.bolts.map((r) => ({ bolt: r, status: measuredStatus(r.angle) ?? undefined }))}
      />
      <figcaption className="px-3 py-2 text-scan-foreground">
        <p className="text-[10px] uppercase tracking-wider text-scan-muted">{label}</p>
        <p className="text-sm font-semibold">{format(new Date(ins.capturedAt), "d MMM yyyy")}</p>
        <p className="truncate text-[11px] text-scan-muted">{ins.photoUrl ? ins.inspector : `${ins.inspector} · no photo`}</p>
      </figcaption>
    </figure>
  );

  return (
    <AppShell>
      <header className="px-5 pt-6 pb-4">
        <Link
          to="/results/$inspectionId"
          params={{ inspectionId: later.id }}
          className="flex size-10 items-center justify-center rounded-full border bg-card"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="eyebrow mt-5">{vehicleTypeLabel(later.vehicleType)} · Compare</p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight">{later.area ?? DEFAULT_AREA}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 px-5">
        {photo(earlier, "Earlier")}
        {photo(later, "Later")}
      </div>

      <div className={cn("mx-5 mt-4 rounded-2xl p-4", worsened ? "bg-monitor-soft" : "bg-ok-soft")}>
        <p className="flex items-center gap-2 font-display text-lg font-extrabold">
          <TrendingUp className="size-5" />
          {worsened ? `${worsened} bolt${worsened > 1 ? "s" : ""} got worse` : "No bolt got worse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Rotation between {format(new Date(earlier.capturedAt), "d MMM")} and {format(new Date(later.capturedAt), "d MMM")}.
        </p>
      </div>

      <section className="flex flex-col gap-2.5 px-5 pt-5">
        <p className="eyebrow">Per bolt</p>
        {changes.map((c) => {
          const bolt = c.after ?? c.before;
          return (
            <div key={c.boltId} className={cn("rounded-2xl border bg-card p-3 shadow-card", c.worsened && "border-loose")}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-muted-foreground">
                  {bolt?.label ?? c.boltId}
                  {bolt?.spec ? ` · ${bolt.spec}` : ""}
                </p>
                <p className="font-readout text-lg font-semibold">{angleText(c.delta)}</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-secondary px-2 py-1.5">
                  <span className="font-readout">{angleText(c.before?.angle)}</span>
                  {c.beforeStatus && <StatusBadge status={c.beforeStatus} />}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary px-2 py-1.5">
                  <span className="font-readout">{angleText(c.after?.angle)}</span>
                  {c.afterStatus && <StatusBadge status={c.afterStatus} />}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {others.length > 1 && (
        <section className="px-5 pt-6">
          <p className="eyebrow mb-2">Compare later photo against</p>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.id}
                to="/compare"
                search={{ a: o.id, b: later.id }}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", o.id === earlier.id ? "border-foreground bg-foreground text-background" : "bg-card")}
              >
                {format(new Date(o.capturedAt), "d MMM")}
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
