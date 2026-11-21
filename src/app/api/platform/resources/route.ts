import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner } from "@/lib/platform-auth";

export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id: string; data?: Record<string, unknown> } & Record<string, unknown>;
type Rows = { rows?: Row[] };
const tables = ["plans", "branches", "subscriptions"] as const;
type ResourceTable = typeof tables[number];\ntype Table = ResourceTable | "tenants";
const clean = (row: Row) => row.data && typeof row.data === "object" ? row.data : Object.fromEntries(Object.entries(row).filter(([k]) => !k.startsWith("$") && k !== "data"));
const validTable = (v: unknown): v is ResourceTable => typeof v === "string" && tables.includes(v as ResourceTable);
const originOK = (r: Request) => { const o = r.headers.get("origin"); return !!o && o === new URL(r.url).origin; };
async function list(table: Table) {
  const q = encodeURIComponent(JSON.stringify({ method: "limit", values: [500] }));
  const result = await appwriteRequest<Rows>(`/tablesdb/${encodeURIComponent(db)}/tables/${table}/rows?queries[]=${q}`);
  return result.rows ?? [];
}
async function exists(table: Table, id: string) { return (await list(table)).some(row => row.$id === id); }
function bad(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  try {
    if (!originOK(request)) return bad("طلب غير صالح.", 403);
    if (!await verifyPlatformOwner()) return bad("غير مصرح.", 401);
    const body = await request.json() as Record<string, unknown>;
    if (!validTable(body.resource)) return bad("نوع السجل غير مدعوم.");
    const table = body.resource;
    let data: Record<string, unknown>;
    if (table === "plans") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
      const price = Number(body.price_monthly), limit = Number(body.branch_limit);
      if (name.length < 2 || name.length > 128 || !/^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/.test(code) || !Number.isFinite(price) || price < 0 || !Number.isInteger(limit) || limit < 1) return bad("بيانات الباقة غير صالحة.");
      const all = await list(table);
      if (all.some(r => String(clean(r).code ?? "").toLowerCase() === code)) return bad("كود الباقة مستخدم بالفعل.", 409);
      data = { name, code, price_monthly: price, branch_limit: limit, is_active: true };
    } else if (table === "branches") {
      const tenant_id = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
      if (!tenant_id || !(await list("tenants")).some(r => r.$id === tenant_id)) return bad("الشركة المحددة غير موجودة.");
      if (name.length < 2 || name.length > 128 || !/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(slug)) return bad("بيانات الفرع غير صالحة.");
      const all = await list(table);
      if (all.some(r => clean(r).tenant_id === tenant_id && clean(r).slug === slug)) return bad("معرّف الفرع مستخدم داخل الشركة.", 409);
      data = { tenant_id, name, slug, status: "active" };
    } else {
      const tenant_id = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
      const plan_id = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
      const status = typeof body.status === "string" ? body.status : "active";
      if (!tenant_id || !(await list("tenants")).some(r => r.$id === tenant_id)) return bad("الشركة المحددة غير موجودة.");
      if (!plan_id || !(await exists("plans", plan_id))) return bad("الباقة المحددة غير موجودة.");
      if (!["active", "trial", "cancelled", "expired", "pending"].includes(status)) return bad("حالة الاشتراك غير صالحة.");
      const starts_at = typeof body.starts_at === "string" && body.starts_at ? new Date(body.starts_at).toISOString() : undefined;
      const ends_at = typeof body.ends_at === "string" && body.ends_at ? new Date(body.ends_at).toISOString() : undefined;
      if (starts_at === undefined && body.starts_at || ends_at === undefined && body.ends_at) return bad("تاريخ الاشتراك غير صالح.");
      data = { tenant_id, plan_id, status, ...(starts_at ? { starts_at } : {}), ...(ends_at ? { ends_at } : {}) };
    }
    const id = crypto.randomUUID();
    await appwriteRequest(`/tablesdb/${encodeURIComponent(db)}/tables/${table}/rows`, { method: "POST", body: JSON.stringify({ rowId: id, data, permissions: [] }) });
    return NextResponse.json({ success: true, id, data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return bad("تعذّر حفظ السجل.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!originOK(request)) return bad("طلب غير صالح.", 403);
    if (!await verifyPlatformOwner()) return bad("غير مصرح.", 401);
    const body = await request.json() as Record<string, unknown>;
    if (!validTable(body.resource) || typeof body.id !== "string" || !body.id.trim()) return bad("بيانات التحديث غير صالحة.");
    const table = body.resource, id = body.id.trim();
    const rows = await list(table), current = rows.find(r => r.$id === id);
    if (!current) return bad("السجل غير موجود.", 404);
    const data = { ...clean(current) };
    if (table === "plans") {
      if (body.name !== undefined) { if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 128) return bad("اسم الباقة غير صالح."); data.name = body.name.trim(); }
      if (body.price_monthly !== undefined) { const n = Number(body.price_monthly); if (!Number.isFinite(n) || n < 0) return bad("السعر غير صالح."); data.price_monthly = n; }
      if (body.branch_limit !== undefined) { const n = Number(body.branch_limit); if (!Number.isInteger(n) || n < 1) return bad("حد الفروع غير صالح."); data.branch_limit = n; }
      if (body.is_active !== undefined) { if (typeof body.is_active !== "boolean") return bad("حالة الباقة غير صالحة."); data.is_active = body.is_active; }
    } else if (table === "branches") {
      if (body.name !== undefined) { if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 128) return bad("اسم الفرع غير صالح."); data.name = body.name.trim(); }
      if (body.status !== undefined) { if (!["active", "inactive", "suspended"].includes(String(body.status))) return bad("حالة الفرع غير صالحة."); data.status = body.status; }
    } else {
      if (body.status !== undefined) { if (!["active", "trial", "cancelled", "expired", "pending"].includes(String(body.status))) return bad("حالة الاشتراك غير صالحة."); data.status = body.status; }
      for (const key of ["starts_at", "ends_at"] as const) if (body[key] !== undefined) {
        if (body[key] === null || body[key] === "") delete data[key];
        else { if (typeof body[key] !== "string" || Number.isNaN(Date.parse(body[key]))) return bad("تاريخ الاشتراك غير صالح."); data[key] = new Date(body[key]).toISOString(); }
      }
    }
    await appwriteRequest(`/tablesdb/${encodeURIComponent(db)}/tables/${table}/rows/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ data }) });
    return NextResponse.json({ success: true, id, data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return bad("تعذّر تحديث السجل.", 500);
  }
}
