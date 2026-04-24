const ALLOWED = new Set(["/inbox", "/inbox/table"]);

export type InboxReturnPath = "/inbox" | "/inbox/table";

export function parseInboxReturnPath(formData: FormData): InboxReturnPath {
  const raw = formData.get("returnPath");
  if (typeof raw === "string" && ALLOWED.has(raw)) {
    return raw as InboxReturnPath;
  }
  return "/inbox";
}
