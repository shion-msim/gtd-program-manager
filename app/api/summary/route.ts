import { NextResponse } from "next/server";
import {
  getDefaultTimeZone,
  getSummaryForUser,
} from "@/lib/dashboard-data";
import { getSessionUserId, unauthorized } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { searchParams } = new URL(request.url);
  const tz = searchParams.get("timeZone") ?? getDefaultTimeZone();
  const data = await getSummaryForUser(userId, tz);
  return NextResponse.json(data);
}
