// Inspections (results + original photos) live in Lovable Cloud. All reads and writes go
// through this module; vehicles and reference photos still come from mock-data.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { BoltResult, Inspection } from "@/lib/mock-data";

const BUCKET = "inspection-photos";
const SIGNED_URL_SECONDS = 60 * 60;
type Row = Database["public"]["Tables"]["inspections"]["Row"];

export const inspectionsKey = ["inspections"] as const;

async function toInspections(rows: Row[]): Promise<Inspection[]> {
  const paths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
    });
  }
  return rows.map((r) => ({
    id: r.id,
    vehicleId: r.vehicle_id,
    referenceId: r.reference_id,
    capturedAt: r.captured_at,
    processingMs: r.processing_ms,
    inspector: r.inspector_name,
    bolts: r.bolts as unknown as BoltResult[],
    photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
  }));
}

/** Every inspection the team has saved, newest first (with short-lived photo links). */
export const inspectionsQuery = () =>
  queryOptions({
    queryKey: inspectionsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return toInspections(data);
    },
    // Photo links stay valid for an hour; refetch well before that.
    staleTime: 5 * 60 * 1000,
  });

/** Downscale a captured photo so uploads stay small; keeps the original framing. */
async function toJpegBlob(dataUrl: string, maxSide = 1600): Promise<Blob> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode photo"))), "image/jpeg", 0.85),
  );
}

/** Saves the original photo (if any) and the measured results. Returns the new inspection id. */
export async function saveInspection({
  inspection,
  photo,
  inspectorName,
}: {
  inspection: Inspection;
  photo: string | null;
  inspectorName: string;
}): Promise<string> {
  const id = `ins-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  let photoPath: string | null = null;
  if (photo) {
    photoPath = `shared/${id}.jpg`;
    const blob = await toJpegBlob(photo);
    const { error } = await supabase.storage.from(BUCKET).upload(photoPath, blob, { contentType: "image/jpeg" });
    if (error) throw error;
  }
  const { error } = await supabase.from("inspections").insert({
    id,
    vehicle_id: inspection.vehicleId,
    reference_id: inspection.referenceId,
    captured_at: inspection.capturedAt,
    processing_ms: inspection.processingMs,
    inspector_name: inspectorName,
    inspector_id: null,
    bolts: inspection.bolts as unknown as Json,
    photo_path: photoPath,
  });
  if (error) throw error;
  return id;
}
