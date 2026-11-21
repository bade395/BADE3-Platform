import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner } from "@/lib/platform-auth";
export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id: string; data?: Record<string, unknown> };
async function rows(table: string) {
  const q = encodeURIComponent(JSON.stringify({ method: "limit", values: [500] }));
  const result = await appwriteRequest<{ rows?: Row[] }>(`/tablesdb/${encodeURIComponent(db)}/tables/${table}/rows?queries[]=${q}`);
  return (result.rows ?? []).map(r => ({ id: r.$id, ...(r.data ?? {}) }));
}
export async function GET() {
  try {
    if (!await verifyPlatformOwner()) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
    const [subscriptions, tenants, plans] = await Promise.all([rows("subscriptions"), rows("tenants"), rows("plans")]);
    const tenantMap = new Map(tenants.map(t => [t.id, t]));
    const planMap = new Map(plans.map(p => [p.id, p]));
    return NextResponse.json({ subscriptions: subscriptions.map(s => ({ ...s, tenant: tenantMap.get(String(s.tenant_id)), plan: planMap.get(String(s.plan_id)) })), tenants, plans: plans.filter(p => p.is_active === true) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذّر تحميل الاشتراكات." }, { status: 503 });
  }
}