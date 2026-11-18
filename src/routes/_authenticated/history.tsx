import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/bolt/app-shell";
import { InspectionRow } from "@/components/bolt/inspection-row";
import { APP_NAME } from "@/lib/app-config";
import { inspections } from "@/lib/mock-data";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({
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
  const groups = inspections.reduce<Record<string, typeof inspections>>((acc, i) => {
    const key = format(new Date(i.capturedAt), "EEEE, d MMM");
    (acc[key] ??= []).push(i);
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
