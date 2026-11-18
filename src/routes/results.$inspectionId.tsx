import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/bolt/app-shell";
import { ResultView } from "@/components/bolt/result-view";
import { APP_NAME } from "@/lib/app-config";
import { findInspection, previousOf } from "@/lib/history";
import { inspectionsQuery } from "@/lib/inspections-api";
import { getVehicle } from "@/lib/mock-data";

export const Route = createFileRoute("/results/$inspectionId")({
  loader: async ({ context, params }) => {
    const list = await context.queryClient.ensureQueryData(inspectionsQuery());
    if (!findInspection(list, params.inspectionId)) throw notFound();
    return { id: params.inspectionId };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Inspection ${loaderData.id.toUpperCase()} — ${APP_NAME}` : `Inspection — ${APP_NAME}`;
    const description = "Original photo, measured bolt rotation and service recommendation for each fastener.";
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
        <Link to="/history" className="mt-3 inline-block text-primary">Back to history</Link>
      </div>
    </AppShell>
  ),
  component: ResultPage,
});

function ResultPage() {
  const { inspectionId } = Route.useParams();
  const { data: list } = useSuspenseQuery(inspectionsQuery());
  const inspection = findInspection(list, inspectionId)!;
  const prev = previousOf(list, inspection);
  const v = getVehicle(inspection.vehicleId)!;
  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link to="/vehicles/$vehicleId" params={{ vehicleId: v.id }} className="flex size-10 items-center justify-center rounded-full border bg-card" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <p className="eyebrow">{inspection.id.toUpperCase()} · {inspection.inspector}</p>
          <h1 className="font-display text-xl font-extrabold">{v.code} · {v.name}</h1>
        </div>
      </header>
      <ResultView inspection={inspection} inspectionImage={inspection.photoUrl ?? undefined} />
      {prev && (
        <div className="px-5 pt-6">
          <Link
            to="/compare"
            search={{ a: prev.id, b: inspection.id }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 font-semibold text-background"
          >
            <GitCompareArrows className="size-5" /> Compare with {format(new Date(prev.capturedAt), "d MMM")}
          </Link>
        </div>
      )}
    </AppShell>
  );
}
