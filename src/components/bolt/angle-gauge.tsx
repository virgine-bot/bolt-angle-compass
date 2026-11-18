import type { BoltStatus } from "@/lib/inspection";
import { cn } from "@/lib/utils";
import { statusStroke } from "./status-badge";

/** Hex-bolt dial: dashed line = reference orientation, solid = current orientation. */
export function AngleGauge({
  angle,
  status,
  size = 72,
}: {
  angle: number;
  status: BoltStatus;
  size?: number;
}) {
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${50 + 26 * Math.cos(a)},${50 + 26 * Math.sin(a)}`;
  }).join(" ");

  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arcEnd = (r: number) => ({
    x: 50 + r * Math.sin(rad(angle)),
    y: 50 - r * Math.cos(rad(angle)),
  });
  const e = arcEnd(40);
  const largeArc = Math.abs(angle) > 180 ? 1 : 0;
  const sweep = angle >= 0 ? 1 : 0;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0" aria-hidden>
      <circle cx="50" cy="50" r="46" className="fill-none stroke-border" strokeWidth="1.5" />
      {Array.from({ length: 24 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="5"
          x2="50"
          y2={i % 6 === 0 ? 11 : 8}
          transform={`rotate(${i * 15} 50 50)`}
          className="stroke-muted-foreground/40"
          strokeWidth="1"
        />
      ))}
      <path
        d={`M 50 10 A 40 40 0 ${largeArc} ${sweep} ${e.x} ${e.y}`}
        className={cn("fill-none", statusStroke[status])}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <polygon points={hex} transform={`rotate(${angle} 50 50)`} className="fill-muted stroke-foreground/70" strokeWidth="2" />
      <line x1="50" y1="50" x2="50" y2="12" className="stroke-muted-foreground" strokeWidth="1.5" strokeDasharray="3 3" />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="12"
        transform={`rotate(${angle} 50 50)`}
        className={statusStroke[status]}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="3.5" className="fill-foreground" />
    </svg>
  );
}
