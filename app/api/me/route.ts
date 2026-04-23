import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/route-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  });
}
