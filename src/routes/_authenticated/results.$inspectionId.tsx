import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/bolt/app-shell";
import { ResultView } from "@/components/bolt/result-view";
import { APP_NAME } from "@/lib/app-config";
import { getInspection, getVehicle } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/results/$inspectionId")({
  loader: ({ params }) => {
    const inspection = getInspection(params.inspectionId);
    if (!inspection) throw notFound();
    return { inspection };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `Inspection ${loaderData.inspection.id.toUpperCase()} — ${APP_NAME}`
      : `Inspection — ${APP_NAME}`;
    const description = "Measured bolt rotation and service recommendation for each detected fastener.";
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
        <p className="font-semibold">Inspection not found</p>
        <Link to="/history" className="mt-3 inline-block text-primary">
          Back to history
        </Link>
      </div>
    </AppShell>
  ),
  component: ResultPage,
});

function ResultPage() {
  const { inspection } = Route.useLoaderData();
  const v = getVehicle(inspection.vehicleId)!;
  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link to="/history" className="flex size-10 items-center justify-center rounded-full border bg-card" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="eyebrow">{inspection.id.toUpperCase()}</p>
          <h1 className="font-display text-xl font-extrabold">
            {v.code} · {v.name}
          </h1>
        </div>
      </header>
      <ResultView inspection={inspection} />
    </AppShell>
  );
}
