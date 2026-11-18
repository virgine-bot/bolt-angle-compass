import { cva } from "class-variance-authority";
import type { BoltStatus } from "@/lib/inspection";
import { statusMeta } from "@/lib/inspection";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider",
  {
    variants: {
      status: {
        ok: "bg-ok-soft text-ok",
        monitor: "bg-monitor-soft text-foreground",
        loose: "bg-loose-soft text-loose",
        retake: "bg-muted text-muted-foreground",
      },
    },
  },
);

const dot = cva("size-1.5 rounded-full", {
  variants: {
    status: { ok: "bg-ok", monitor: "bg-monitor", loose: "bg-loose", retake: "bg-muted-foreground" },
  },
});

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: BoltStatus | "retake";
  className?: string;
  label?: string;
}) {
  const text = label ?? (status === "retake" ? "Retake" : statusMeta[status].label);
  return (
    <span className={cn(badge({ status }), className)}>
      <span className={dot({ status })} />
      {text}
    </span>
  );
}

export const statusStroke: Record<BoltStatus, string> = {
  ok: "stroke-ok",
  monitor: "stroke-monitor",
  loose: "stroke-loose",
};

export const statusBorder: Record<BoltStatus, string> = {
  ok: "border-ok",
  monitor: "border-monitor",
  loose: "border-loose",
};

export const statusBg: Record<BoltStatus, string> = {
  ok: "bg-ok",
  monitor: "bg-monitor",
  loose: "bg-loose",
};
