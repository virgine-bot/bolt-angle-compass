import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { latestPerArea } from "@/lib/history";
import { inspectionsQuery } from "@/lib/inspections-api";
import { displayName, initials } from "@/lib/user";
import { ArrowRight, ScanLine } from "lucide-react";
import { AppShell } from "@/components/bolt/app-shell";
import { InspectionRow, worstStatus } from "@/components/bolt/inspection-row";
import { LogoMark } from "@/components/bolt/logo-mark";
import { APP_NAME } from "@/lib/app-config";
import { getBoltStatus } from "@/lib/inspection";
import { vehicles } from "@/lib/mock-data";
import boltStem from "@/assets/bolt-stem.jpg";

export const Route = createFileRoute("/_authenticated/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionsQuery()).then(() => undefined),
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Fleet inspection dashboard` },
      { name: "description", content: "See which bolts on your two-wheeled fleet have loosened and start a new photo inspection." },
      { property: "og:title", content: `${APP_NAME} — Fleet inspection dashboard` },
      { property: "og:description", content: "See which bolts on your two-wheeled fleet have loosened and start a new photo inspection." },
    ],
  }),
  component: Home,
});

const authRoute = getRouteApi("/_authenticated");

function Home() {
  const { user } = authRoute.useRouteContext();
  const name = displayName(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: all } = useSuspenseQuery(inspectionsQuery());
  const inspections = latestPerArea(all);
  const hour = new Date().getHours();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };
  const allBolts = inspections.flatMap((i) => i.bolts);
  const flagged = allBolts.filter((b) => getBoltStatus(b.angle) !== "ok").length;
  const avgMs = inspections.reduce((s, i) => s + i.processingMs, 0) / Math.max(1, inspections.length);
  const attention = inspections.filter((i) => worstStatus(i) !== "ok");

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-extrabold tracking-tight">{APP_NAME}</span>
        </div>
        <button
          type="button"
          onClick={signOut}
          title={`Signed in as ${name} — tap to sign out`}
          className="flex h-10 items-center gap-2 rounded-full bg-secondary pr-3 pl-1 text-xs font-medium"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-card font-mono text-sm font-semibold">{initials(name)}</span>
          Sign out
        </button>
      </header>

      <section className="px-5 pt-6">
        <p className="eyebrow">{format(new Date(), "EEE · d MMM yyyy")}</p>
        <h1 className="mt-1 font-display text-[30px] leading-[1.05] font-extrabold tracking-tight">
          {hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"},
          <br />
          {name.split(" ")[0]}.
        </h1>
      </section>

      <section className="px-5 pt-5">
        <Link
          to="/inspect"
          search={{ vehicle: undefined }}
          className="group relative block overflow-hidden rounded-3xl bg-scan p-5 text-scan-foreground"
        >
          <img src={boltStem} alt="" className="absolute -right-10 -bottom-10 size-52 rounded-full object-cover opacity-50" />
          <div className="absolute inset-0 grid-hatch opacity-30" />
          <div className="relative">
            <div className="flex size-11 items-center justify-center rounded-xl bg-signal shadow-signal">
              <ScanLine className="size-6 text-primary-foreground" />
            </div>
            <p className="mt-6 font-display text-2xl font-extrabold leading-tight">
              Start a new
              <br />
              inspection
            </p>
            <p className="mt-1 max-w-[60%] text-sm text-scan-muted">Compare today's photo with a reference to measure bolt rotation.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Open camera <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-3 gap-2 px-5 pt-4">
        <Kpi label="Vehicles" value={String(vehicles.length)} />
        <Kpi label="Flagged bolts" value={String(flagged)} tone="alert" />
        <Kpi label="Avg. time" value={`${(avgMs / 1000).toFixed(1)}s`} />
      </section>

      <section className="px-5 pt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold">Needs attention</h2>
          <Link to="/history" className="text-sm font-medium text-primary">
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {attention.map((i) => (
            <InspectionRow key={i.id} inspection={i} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "alert" }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card">
      <p className={`font-readout text-2xl font-semibold ${tone === "alert" ? "text-loose" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
