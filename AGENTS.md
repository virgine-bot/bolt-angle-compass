<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Inspection thresholds and the retake rule live only in `src/lib/inspection.ts` (with tests); UI reads them from there so the model team can tune them in one place.
- Saved inspections and photos go through `src/lib/inspections-api.ts` only; detection is simulated by `simulateInspection` in `src/lib/mock-data.ts` until the model API exists, so swap that one function rather than editing screens.
- Inspections are general (vehicle type + optional free-text part + optional reference photo), not tied to registered vehicles; re-checks of the same spot share a `seriesId` so they can be compared.
- The app is a mobile-first prototype: every screen renders inside `AppShell` (max 430px column, bottom nav).
- Saved vehicles and their reference photos go through `src/lib/vehicles-api.ts` only; linking a vehicle to an inspection is optional so quick checks without a saved vehicle keep working.
