// Saved vehicles (fleet) and their reference photos. All reads/writes go through this module.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { upload } from "@/lib/inspections-api";
import { isVehicleType, type VehicleType } from "@/lib/mock-data";

export interface VehicleReference {
  id: string;
  vehicleId: string;
  label: string;
  photoPath: string;
  photoUrl: string | null;
  createdAt: string;
}
export interface Vehicle {
  id: string;
  name: string;
  vehicleType: VehicleType;
  plate: string | null;
  note: string | null;
  createdAt: string;
  references: VehicleReference[];
}

export const vehiclesKey = ["vehicles"] as const;

export const vehiclesQuery = () =>
  queryOptions({
    queryKey: vehiclesKey,
    queryFn: async (): Promise<Vehicle[]> => {
      const [v, r] = await Promise.all([
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabase.from("vehicle_references").select("*").order("created_at", { ascending: false }),
      ]);
      if (v.error) throw v.error;
      if (r.error) throw r.error;
      const paths = [...new Set(r.data.map((x) => x.photo_path))];
      const urls = new Map<string, string>();
      if (paths.length) {
        const { data } = await supabase.storage.from("inspection-photos").createSignedUrls(paths, 3600);
        data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
      }
      return v.data.map((row) => ({
        id: row.id,
        name: row.name,
        vehicleType: isVehicleType(row.vehicle_type) ? row.vehicle_type : "motorbike",
        plate: row.plate,
        note: row.note,
        createdAt: row.created_at,
        references: r.data
          .filter((x) => x.vehicle_id === row.id)
          .map((x) => ({
            id: x.id,
            vehicleId: x.vehicle_id,
            label: x.label,
            photoPath: x.photo_path,
            photoUrl: urls.get(x.photo_path) ?? null,
            createdAt: x.created_at,
          })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

export async function createVehicle(input: { name: string; vehicleType: VehicleType; plate?: string; note?: string }) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      name: input.name.trim().slice(0, 60),
      vehicle_type: input.vehicleType,
      plate: input.plate?.trim().slice(0, 30) || null,
      note: input.note?.trim().slice(0, 200) || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function addVehicleReference(vehicleId: string, label: string, photo: string) {
  const path = `shared/ref-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}.jpg`;
  await upload(path, photo);
  const { error } = await supabase
    .from("vehicle_references")
    .insert({ vehicle_id: vehicleId, label: label.trim().slice(0, 60) || "General bolt", photo_path: path });
  if (error) throw error;
}
