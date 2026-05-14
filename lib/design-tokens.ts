import type { TaskPriority } from "@/lib/task-priority";

export const ACCENT_TOKENS = [
  "slate",
  "emerald",
  "amber",
  "rose",
  "violet",
  "sky",
] as const;

export type AccentToken = (typeof ACCENT_TOKENS)[number];

export const PRIORITY_TOKEN_DEFAULTS: Record<TaskPriority, AccentToken> = {
  none: "slate",
  low: "emerald",
  medium: "amber",
  high: "rose",
};

export function isAccentToken(value: string): value is AccentToken {
  return (ACCENT_TOKENS as readonly string[]).includes(value);
}

export function resolveAccentToken(
  raw: string | null | undefined,
): AccentToken | null {
  if (!raw) {
    return null;
  }
  if (isAccentToken(raw)) {
    return raw;
  }
  return null;
}

export function parseOptionalAccentToken(raw: unknown): AccentToken | null {
  if (typeof raw !== "string") {
    return null;
  }
  return resolveAccentToken(raw);
}

export function accentEdgeClass(token: AccentToken | null): string {
  return token ? `token-edge-${token}` : "token-edge-none";
}

export function accentPillClass(token: AccentToken | null): string {
  return token ? `token-pill-${token}` : "token-pill-none";
}
