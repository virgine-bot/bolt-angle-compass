import { useCallback, useEffect, useState } from "react";

const KEY = "boltsense.inspector-name";
export const DEFAULT_INSPECTOR = "Team member";

/** The inspector name typed on this device (no accounts); stored only in this browser. */
export function useInspectorName() {
  const [name, setName] = useState("");
  useEffect(() => {
    setName(window.localStorage.getItem(KEY) ?? "");
  }, []);
  const save = useCallback((next: string) => {
    const clean = next.trim().slice(0, 40);
    if (clean) window.localStorage.setItem(KEY, clean);
    else window.localStorage.removeItem(KEY);
    setName(clean);
  }, []);
  return [name, save] as const;
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}
