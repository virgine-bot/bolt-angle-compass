import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { InspectionRow } from "@/components/bolt/inspection-row";
import { APP_NAME } from "@/lib/app-config";
import { inspectionsQuery } from "@/lib/inspections-api";
import type { Inspection } from "@/lib/mock-data";

export const Route = createFileRoute("/history")({
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionsQuery()).then(() => undefined),
  head: () => ({
    meta: [
      { title: `Inspection history — ${APP_NAME}` },
      { name: "description", content: "Every bolt inspection with measured rotation angles and service recommendations." },
      { property: "og:title", content: `Inspection history — ${APP_NAME}` },
      { property: "og:description", content: "Every bolt inspection with measured rotation angles and service recommendations." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: inspections } = useSuspenseQuery(inspectionsQuery());
  const groups = inspections.reduce<Record<string, Inspection[]>>((acc, i) => {
    (acc[format(new Date(i.capturedAt), "EEEE, d MMM")] ??= []).push(i);
    return acc;
  }, {});

  return (
    <AppShell>
      <ScreenHeader eyebrow={`${inspections.length} inspections`} title="History" />
      <div className="flex flex-col gap-6 px-5">
        {Object.entries(groups).map(([day, items]) => (
          <section key={day}>
            <p className="eyebrow mb-2">{day}</p>
            <div className="flex flex-col gap-2.5">
              {items.map((i) => (
                <InspectionRow key={i.id} inspection={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
