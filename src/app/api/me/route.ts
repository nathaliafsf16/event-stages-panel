import { NextResponse } from "next/server";
import { optionalViewer, viewerLabel } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await optionalViewer(request);
  if (!identity.verified) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "cache-control": "private, no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      name: viewerLabel(identity),
      email: identity.kind === "person" ? identity.email : "",
      simulated: identity.simulated === true,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
