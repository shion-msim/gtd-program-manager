/**
 * Validates `returnPath` from inbox-related forms against open redirects.
 * Returns a pathname only (no query); callers append `?toast=…`.
 */
export function parseInboxReturnPath(formData: FormData): string {
  const raw = formData.get("returnPath");
  if (typeof raw !== "string") {
    return "/inbox/table";
  }
  const normalized = normalizeInboxRedirectPath(raw);
  return normalized ?? "/inbox/table";
}

function normalizeInboxRedirectPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return null;
  }
  // Deny schemes, slashes that escape origin, traversal, fragments, queries
  if (
    trimmed.startsWith("//") ||
    trimmed.includes("?") ||
    trimmed.includes("#") ||
    trimmed.includes("..") ||
    trimmed.includes("%") ||
    trimmed.includes("\\") ||
    !trimmed.startsWith("/")
  ) {
    return null;
  }
  // App Router pathnames only (no host, no ambiguous chars)
  if (!/^\/[a-zA-Z0-9/_-]+$/.test(trimmed)) {
    return null;
  }
  // /inbox is capture-only UX; consolidate on table so ?toast survives redirect.
  if (trimmed === "/inbox") {
    return "/inbox/table";
  }
  return trimmed;
}

/** Documented literals for inbox table flows; FAB and server accept any validated path string. */
export type InboxReturnPath = "/inbox/table";
