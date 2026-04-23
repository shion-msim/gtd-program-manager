/** 週次負荷用: JST（Asia/Tokyo）の暦日 YYYY-MM-DD */
export function ymdInTimeZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function parseYmd(ymd: string): { y: number; m0: number; d: number } {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || m === undefined || d === undefined) {
    throw new Error("Invalid YMD");
  }
  return { y, m0: m - 1, d };
}

/** UTC 暦日として Y-M-D の「その週の月曜日」(月曜始まり) */
export function mondayOfWeekContainingYmd(ymd: string): string {
  const { y, m0, d } = parseYmd(ymd);
  const t = Date.UTC(y, m0, d);
  const dow = new Date(t).getUTCDay();
  const daysFromMonday = (dow + 6) % 7;
  const mon = new Date(t - daysFromMonday * 86_400_000);
  return toYmdUtc(mon);
}

function toYmdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const { y, m0, d } = parseYmd(ymd);
  const t = Date.UTC(y, m0, d) + days * 86_400_000;
  return toYmdUtc(new Date(t));
}

export type WeekBucketRange = { weekStart: string; weekEndInclusive: string };

/**
 * 今日（TZ の暦日）を含む週を 0 週目とし、合計 6 週分の [weekStart, weekEndInclusive]（いずれも月〜日の暦週区切り、比較は次週前までに due が入る想定で exclude 用の endExclusive を使う）
 */
export function getSixMonWeekBuckets(anchorYmd: string): {
  weekStart: string;
  endExclusive: string;
}[] {
  const w0 = mondayOfWeekContainingYmd(anchorYmd);
  const out: { weekStart: string; endExclusive: string }[] = [];
  for (let w = 0; w < 6; w++) {
    const weekStart = addDaysYmd(w0, w * 7);
    const endExclusive = addDaysYmd(weekStart, 7);
    out.push({ weekStart, endExclusive });
  }
  return out;
}

export function ymdFallsInRange(
  ymd: string,
  startInclusive: string,
  endExclusive: string,
): boolean {
  return ymd >= startInclusive && ymd < endExclusive;
}
