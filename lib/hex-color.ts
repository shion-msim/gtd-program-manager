/** 有効な #RRGGBB のみ返す。空・不正は null */
export function normalizeHexColor(raw: string): string | null {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(t);
  if (!m) {
    return null;
  }
  let hex = m[1]!;
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex.toLowerCase()}`;
}

export function parseOptionalHexColor(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== "string") {
    return null;
  }
  return normalizeHexColor(raw);
}

/**
 * 背景色（#RRGGBB）上で読みやすい前景色（#RRGGBB）を返す
 */
export function contrastForegroundForBackground(hex: string): string {
  const n = normalizeHexColor(hex);
  if (!n) {
    return "#171717";
  }
  const r = Number.parseInt(n.slice(1, 3), 16) / 255;
  const g = Number.parseInt(n.slice(3, 5), 16) / 255;
  const b = Number.parseInt(n.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#171717" : "#fafafa";
}
