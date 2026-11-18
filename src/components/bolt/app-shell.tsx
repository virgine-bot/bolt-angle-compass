import { Link, useRouterState } from "@tanstack/react-router";
import { Bike, History, House, ScanLine } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: House },
  { to: "/fleet", label: "Fleet", icon: Bike },
  { to: "/history", label: "History", icon: History },
] as const;

export function AppShell({
  children,
  hideNav = false,
  tone = "light",
}: {
  children: ReactNode;
  hideNav?: boolean;
  tone?: "light" | "scan";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh justify-center sm:py-6">
      <div
        className={cn(
          "relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden sm:min-h-[860px] sm:rounded-[2.5rem] sm:shadow-device",
          tone === "scan" ? "bg-scan text-scan-foreground" : "bg-background",
        )}
      >
        <main className={cn("flex flex-1 flex-col", !hideNav && "pb-28")}>{children}</main>

        {!hideNav && (
          <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4 pb-4 sm:bottom-6">
            <div className="flex items-center justify-between rounded-2xl border bg-card/95 px-2 py-2 shadow-card backdrop-blur">
              {tabs.slice(0, 2).map((t) => (
                <NavTab key={t.to} {...t} active={t.to === "/" ? pathname === "/" : pathname.startsWith(t.to)} />
              ))}
              <Link
                to="/inspect"
                search={{ vehicle: undefined }}
                className="-mt-8 flex size-16 flex-col items-center justify-center rounded-2xl bg-signal text-primary-foreground shadow-signal transition-transform active:scale-95"
                aria-label="New inspection"
              >
                <ScanLine className="size-7" strokeWidth={2.2} />
              </Link>
              {tabs.slice(2).map((t) => (
                <NavTab key={t.to} {...t} active={pathname.startsWith(t.to)} />
              ))}
              <NavTab to="/about" label="Project" icon={InfoDot} active={pathname.startsWith("/about")} />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

function InfoDot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="12,2.5 20.2,7.25 20.2,16.75 12,21.5 3.8,16.75 3.8,7.25" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function NavTab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/" | "/fleet" | "/history" | "/about";
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex w-16 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("size-5", active && "text-primary")} />
      {label}
    </Link>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  action,
  back,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="px-5 pt-6 pb-4">
      {back}
      <div className="flex items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
