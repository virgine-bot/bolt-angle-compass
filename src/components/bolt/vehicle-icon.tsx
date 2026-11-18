import { Bike, Motorbike, Scooter } from "lucide-react";
import type { VehicleType } from "@/lib/mock-data";

export function VehicleIcon({ type, className }: { type: VehicleType; className?: string }) {
  if (type === "bicycle") return <Bike className={className} />;
  if (type === "motorbike") return <Motorbike className={className} />;
  return <Scooter className={className} />;
}
