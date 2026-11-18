// Inspections (results + original photos) live in Lovable Cloud. All reads and writes go
// through this module.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { isVehicleType, legacyReferences, type BoltResult, type Inspection } from "@/lib/mock-data";

const BUCKET = "inspection-photos";
const SIGNED_URL_SECONDS = 60 * 60;
type Row = Database["public"]["Tables"]["inspections"]["Row"];

export const inspectionsKey = ["inspections"] as const;

type StoredBolt = Partial<BoltResult> & { boltId: string; angle: number | null; confidence: number };

async function toInspections(rows: Row[]): Promise<Inspection[]> {
  const paths = [
    ...new Set(rows.flatMap((r) => [r.photo_path, r.reference_photo_path]).filter((p): p is string => !!p)),
  ];
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
    });
  }
  return rows.map((r) => {
    const legacy = r.reference_id ? legacyReferences[r.reference_id] : undefined;
    const bolts = (r.bolts as unknown as StoredBolt[]).map((b, i) => {
      const pos = legacy?.bolts.find((x) => x.id === b.boltId);
      return {
        id: b.boltId,
        boltId: b.boltId,
        label: b.label ?? pos?.label ?? `B${i + 1}`,
        x: b.x ?? pos?.x ?? 50,
        y: b.y ?? pos?.y ?? 50,
        size: b.size ?? pos?.size ?? 14,
        spec: b.spec ?? pos?.spec,
        angle: b.angle ?? null,
        confidence: b.confidence,
      };
    });
    return {
      id: r.id,
      vehicleType: isVehicleType(r.vehicle_type) ? r.vehicle_type : "motorbike",
      area: r.area_label,
      seriesId: r.reference_id ?? r.id,
      capturedAt: r.captured_at,
      processingMs: r.processing_ms,
      inspector: r.inspector_name,
      bolts,
      photoPath: r.photo_path,
      photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
      referencePhotoPath: r.reference_photo_path,
      referencePhotoUrl: r.reference_photo_path ? (urls.get(r.reference_photo_path) ?? null) : (legacy?.image ?? null),
    };
  });
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
    staleTime: 5 * 60 * 1000,
  });

/** Downscale a photo (data URL or same-origin URL) so uploads stay small; keeps the framing. */
async function toJpegBlob(src: string, maxSide = 1600): Promise<Blob> {
  const img = new Image();
  img.src = src;
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

async function upload(path: string, src: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, await toJpegBlob(src), { contentType: "image/jpeg" });
  if (error) throw error;
}

/**
 * Saves the inspection photo, the reference photo (new upload, or an already-stored path when
 * re-inspecting the same spot) and the measured results. Returns the new inspection id.
 */
export async function saveInspection({
  inspection,
  photo,
  reference,
}: {
  inspection: Inspection;
  photo: string;
  reference: { newPhoto: string } | { storedPath: string } | null;
}): Promise<string> {
  const id = `ins-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const photoPath = `shared/${id}.jpg`;
  await upload(photoPath, photo);
  let referencePath: string | null = null;
  if (reference && "newPhoto" in reference) {
    referencePath = `shared/${id}-ref.jpg`;
    await upload(referencePath, reference.newPhoto);
  } else if (reference) referencePath = reference.storedPath;

  const { error } = await supabase.from("inspections").insert({
    id,
    vehicle_type: inspection.vehicleType,
    area_label: inspection.area?.trim().slice(0, 60) || null,
    // Re-inspections join the earlier spot's series; a first inspection starts its own.
    reference_id: inspection.seriesId === inspection.id ? null : inspection.seriesId,
    captured_at: inspection.capturedAt,
    processing_ms: inspection.processingMs,
    inspector_name: inspection.inspector,
    inspector_id: null,
    bolts: inspection.bolts as unknown as Json,
    photo_path: photoPath,
    reference_photo_path: referencePath,
  });
  if (error) throw error;
  return id;
}
