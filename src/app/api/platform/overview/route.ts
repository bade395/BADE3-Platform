import { NextResponse } from "next/server";
import { verifyPlatformOwner } from "@/lib/platform-auth";
import { getPlatformOverview } from "@/lib/platform-data";

export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await verifyPlatformOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(await getPlatformOverview(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذّر تحميل بيانات المنصة." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
