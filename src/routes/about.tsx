import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { LogoMark } from "@/components/bolt/logo-mark";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About the project — ${APP_NAME}` },
      { name: "description", content: "Goal, success criteria and team behind the computer-vision bolt loosening detection prototype." },
      { property: "og:title", content: `About the project — ${APP_NAME}` },
      { property: "og:description", content: "Goal, success criteria and team behind the computer-vision bolt loosening detection prototype." },
    ],
  }),
  component: About,
});

const criteria = [
  { metric: "≤ 5°", label: "Mean absolute angular error per image pair" },
  { metric: "≤ 2°", label: "Standard deviation across repeated tests" },
  { metric: "≤ 5 s", label: "Average processing time on a standard phone" },
  { metric: "Clear", label: "Shows fastener, rotation and service recommendation" },
];

const team = [
  { name: "Zwe San Hnyune", org: "Ritsumeikan", role: "Project integration & communication", lead: true },
  { name: "George Marshall", org: "Ritsumeikan", role: "Documentation, presenting" },
  { name: "Airi Sugiura", org: "Ritsumeikan", role: "Presentation material" },
  { name: "Erlangga Harrys Setyawan", org: "Dinamika", role: "Motorbike dataset collector" },
  { name: "Muhammad Ghifari Lazawardi", org: "Dinamika", role: "Dataset annotation & model", lead: true },
  { name: "Mochamad Anas Nur Hisyam", org: "Dinamika", role: "Motorbike dataset collector" },
  { name: "Made Wisnu Adi Sanjaya", org: "Telkom", role: "Data analysis & ML" },
  { name: "Roihan Adrio Hibban", org: "Telkom", role: "Coordination & technical development", lead: true },
  { name: "Ardelia Aristy Choirunnisa", org: "Telkom", role: "Research & documentation" },
  { name: "Seraphim Virgine Tadja", org: "Telkom", role: "Software development" },
];

function About() {
  return (
    <AppShell>
      <ScreenHeader eyebrow="Project overview" title="About" />
      <section className="mx-5 rounded-3xl bg-scan p-5 text-scan-foreground">
        <LogoMark className="size-10" />
        <p className="mt-4 font-display text-xl font-extrabold leading-snug">{APP_TAGLINE}</p>
        <p className="mt-2 text-sm leading-relaxed text-scan-muted">
          A fine-tuned YOLO detector finds each bolt, then compares the inspection photo with a reference photo to estimate
          how far it has rotated — no markings on the bolt required.
        </p>
      </section>

      <section className="px-5 pt-7">
        <h2 className="mb-3 font-display text-lg font-bold">Success criteria</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {criteria.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-card">
              <p className="font-readout text-2xl font-semibold text-primary">{c.metric}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="mb-3 font-display text-lg font-bold">Team</h2>
        <ul className="divide-y rounded-2xl border bg-card shadow-card">
          {team.map((m) => (
            <li key={m.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.name}
                  {m.lead && <span className="ml-2 font-mono text-[10px] text-primary uppercase">Lead</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.role}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase">{m.org}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
