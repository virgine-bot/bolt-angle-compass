import type { BoltRef } from "@/lib/mock-data";
import type { BoltStatus } from "@/lib/inspection";
import { cn } from "@/lib/utils";
import { statusBg, statusBorder } from "./status-badge";

export interface PhotoMarker {
  bolt: BoltRef;
  status?: BoltStatus | "retake" | undefined;
  active?: boolean | undefined;
}

/** Photo with bolt detection boxes positioned in % so they scale with the image. */
export function BoltPhoto({
  src,
  alt,
  markers = [],
  onSelect,
  className,
  animate = false,
}: {
  src: string;
  alt: string;
  markers?: PhotoMarker[];
  onSelect?: (boltId: string) => void;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn("relative aspect-square w-full overflow-hidden", className)}>
      <img src={src} alt={alt} className="size-full object-cover" />
      {markers.map(({ bolt, status, active }, i) => {
        const tone = status && status !== "retake" ? status : undefined;
        const Tag = onSelect ? "button" : "span";
        return (
          <Tag
            key={bolt.id}
            {...(onSelect ? { type: "button" as const, onClick: () => onSelect(bolt.id) } : {})}
            style={{
              left: `${bolt.x}%`,
              top: `${bolt.y}%`,
              width: `${bolt.size}%`,
              height: `${bolt.size}%`,
              animationDelay: animate ? `${i * 160}ms` : undefined,
            }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 transition-all",
              tone ? statusBorder[tone] : "border-dashed border-scan-foreground/80",
              active && "ring-4 ring-primary/40",
              animate && "animate-box-in",
            )}
            aria-label={`Bolt ${bolt.label}`}
          >
            <span
              className={cn(
                "absolute -top-2.5 -left-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-scan-foreground",
                tone ? statusBg[tone] : "bg-scan",
              )}
            >
              {bolt.label}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
