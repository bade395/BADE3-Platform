import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner } from "@/lib/platform-auth";
export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id: string; data?: Record<string, unknown> } & Record<string, unknown>;
type Rows = { rows?: Row[]; total?: number };
const clean = (r: Row) => r.data && typeof r.data === "object" ? r.data : Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("$") && k !== "data"));
export async function GET() {
  try {
    if (!await verifyPlatformOwner()) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
    const q = encodeURIComponent(JSON.stringify({ method: "orderDesc", attribute: "created_at" }));
    const l = encodeURIComponent(JSON.stringify({ method: "limit", values: [200] }));
    const r = await appwriteRequest<Rows>(`/tablesdb/${encodeURIComponent(db)}/tables/platform_audit_logs/rows?queries[]=${q}&queries[]=${l}`);
    return NextResponse.json({ events: (r.rows ?? []).map(x => ({ id: x.$id, ...clean(x) })), total: r.total ?? 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "تعذّر تحميل سجل التدقيق." }, { status: 503 }); }
}