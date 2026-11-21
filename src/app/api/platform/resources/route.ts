import { NextResponse } from "next/server";
import { appwriteRequest, verifyPlatformOwner, writePlatformAudit } from "@/lib/platform-auth";

export const runtime = "nodejs";
const db = process.env.BADE3_CORE_DATABASE_ID ?? "";
type Row = { $id: string; data?: Record<string, unknown> } & Record<string, unknown>;
type Rows = { rows?: Row[] };
const tables = ["plans", "branches", "subscriptions"] as const;
type ResourceTable = typeof tables[number];
type Table = ResourceTable | "tenants";
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
    const actor = await verifyPlatformOwner(); if (!actor) return bad("غير مصرح.", 401);
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
      data = { name, code, price_monthly: price, branch_limit: limit, is_active: true, ...(typeof body.price_yearly === "number" && body.price_yearly >= 0 ? { price_yearly: body.price_yearly } : {}), ...(typeof body.description === "string" ? { description: body.description.slice(0, 2000) } : {}), ...(typeof body.features === "string" ? { features: body.features.slice(0, 5000) } : {}), ...(typeof body.terms === "string" ? { terms: body.terms.slice(0, 5000) } : {}) };
    } else if (table === "branches") {
      const tenant_id = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
      if (!tenant_id || !(await list("tenants")).some(r => r.$id === tenant_id && clean(r).status === "active")) return bad("الشركة المحددة غير موجودة أو غير نشطة.");
      if (name.length < 2 || name.length > 128 || !/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(slug)) return bad("بيانات الفرع غير صالحة.");
      const all = await list(table);
      if (all.some(r => clean(r).tenant_id === tenant_id && clean(r).slug === slug)) return bad("معرّف الفرع مستخدم داخل الشركة.", 409);
      const subscriptions = await list("subscriptions");
      const currentSubscription = subscriptions.filter(r => clean(r).tenant_id === tenant_id && ["active", "trial"].includes(String(clean(r).status))).sort((a,b) => String(clean(b).starts_at ?? "").localeCompare(String(clean(a).starts_at ?? "")))[0];
      if (!currentSubscription) return bad("لا يمكن إضافة فرع قبل وجود اشتراك نشط أو تجريبي.");
      const plans = await list("plans");
      const plan = plans.find(r => r.$id === String(clean(currentSubscription).plan_id));
      const branchLimit = Number(plan ? clean(plan).branch_limit : 0);
      const usedBranches = all.filter(r => clean(r).tenant_id === tenant_id && clean(r).status !== "inactive").length;
      if (!Number.isInteger(branchLimit) || branchLimit < 1 || usedBranches >= branchLimit) return bad("تم الوصول إلى الحد الأقصى للفروع في الباقة الحالية.", 409);
      data = { tenant_id, name, slug, status: "active" };
    } else {
      const tenant_id = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
      const plan_id = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
      const status = typeof body.status === "string" ? body.status : "active";
      if (!tenant_id || !(await list("tenants")).some(r => r.$id === tenant_id && clean(r).status === "active")) return bad("الشركة المحددة غير موجودة أو غير نشطة.");
      const selectedPlan = (await list("plans")).find(r => r.$id === plan_id);
      if (!selectedPlan || clean(selectedPlan).is_active !== true) return bad("الباقة المحددة غير موجودة أو غير مفعلة.");
      const existingSubscriptions = await list("subscriptions");
      if (existingSubscriptions.some(r => clean(r).tenant_id === tenant_id && ["active", "trial"].includes(String(clean(r).status)))) return bad("توجد بالفعل عضوية نشطة أو تجريبية لهذه الشركة؛ حدّث العضوية الحالية بدل إنشاء أخرى.", 409);
      if (!["active", "trial", "cancelled", "expired", "pending"].includes(status)) return bad("حالة الاشتراك غير صالحة.");
      const starts_at = typeof body.starts_at === "string" && body.starts_at ? new Date(body.starts_at).toISOString() : undefined;
      const ends_at = typeof body.ends_at === "string" && body.ends_at ? new Date(body.ends_at).toISOString() : undefined;
      if (starts_at === undefined && body.starts_at || ends_at === undefined && body.ends_at) return bad("تاريخ الاشتراك غير صالح.");
      if (starts_at && ends_at && Date.parse(ends_at) <= Date.parse(starts_at)) return bad("تاريخ نهاية الاشتراك يجب أن يكون بعد تاريخ البداية.");
      data = { tenant_id, plan_id, status, ...(starts_at ? { starts_at } : {}), ...(ends_at ? { ends_at } : {}) };
    }
    const id = crypto.randomUUID();
    await appwriteRequest(`/tablesdb/${encodeURIComponent(db)}/tables/${table}/rows`, { method: "POST", body: JSON.stringify({ rowId: id, data, permissions: [] }) });
    await writePlatformAudit(actor, { action: `${table}.created`, resource_type: table, resource_id: id, tenant_id: typeof data.tenant_id === "string" ? data.tenant_id : undefined, details: table === "plans" ? { code: data.code, name: data.name } : { status: data.status } });
    return NextResponse.json({ success: true, id, data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return bad("تعذّر حفظ السجل.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!originOK(request)) return bad("طلب غير صالح.", 403);
    const actor = await verifyPlatformOwner(); if (!actor) return bad("غير مصرح.", 401);
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
      if (body.price_yearly !== undefined) { const n = Number(body.price_yearly); if (!Number.isFinite(n) || n < 0) return bad("السعر السنوي غير صالح."); data.price_yearly = n; }
      for (const key of ["description", "features", "terms"] as const) if (body[key] !== undefined) { if (typeof body[key] !== "string" || body[key].length > 5000) return bad("تفاصيل الباقة غير صالحة."); data[key] = body[key]; }
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
    await writePlatformAudit(actor, { action: `${table}.updated`, resource_type: table, resource_id: id, tenant_id: typeof data.tenant_id === "string" ? data.tenant_id : undefined, details: { changed_fields: Object.keys(body).filter(k => !["resource", "id"].includes(k)) } });
    return NextResponse.json({ success: true, id, data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return bad("تعذّر تحديث السجل.", 500);
  }
}
