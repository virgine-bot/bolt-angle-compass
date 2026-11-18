import type { User } from "@supabase/supabase-js";

/** Name shown as the inspector on saved inspections. */
export function displayName(user: Pick<User, "email" | "user_metadata">): string {
  const meta = user.user_metadata ?? {};
  const name = (meta["full_name"] ?? meta["name"]) as string | undefined;
  if (name && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Team member";
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
