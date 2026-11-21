import { NextResponse } from "next/server";
import { appwriteRequest, platformSessionCookieName } from "@/lib/platform-auth";

export const runtime = "nodejs";

type Session = { secret?: string; expire?: string };
type User = { $id?: string; email?: string; name?: string };
type Row<T> = { $id: string; data?: T } & Partial<T>;
type List<T> = { rows?: Row<T>[] };
type Admin = { user_id?: string; role?: string; is_active?: boolean };
function data<T>(row: Row<T>): T {
  if (row.data && typeof row.data === "object") return row.data;
  const result = { ...row } as Record<string, unknown>;
  for (const key of ["$id", "$sequence", "$tableId", "$databaseId", "$createdAt", "$updatedAt", "$permissions", "data"]) delete result[key];
  return result as T;
}

export async function POST(request: Request) {
  const endpoint = (process.env.APPWRITE_ENDPOINT ?? "").replace(/\/+$/, "");
  const projectId = process.env.APPWRITE_PROJECT_ID ?? "";
  const apiKey = process.env.APPWRITE_API_KEY ?? "";
  const databaseId = process.env.BADE3_CORE_DATABASE_ID ?? "bella_roses";
  if (!endpoint || !projectId || !apiKey) return NextResponse.json({ error: "إعدادات المصادقة غير مكتملة على الخادم." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "طلب غير صالح." }, { status: 403 });

  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 256) return NextResponse.json({ error: "أدخل البريد الإلكتروني وكلمة المرور." }, { status: 400 });

  let session: Session;
  try {
    const response = await fetch(`${endpoint}/account/sessions/email`, {
      method: "POST",
      headers: { "X-Appwrite-Project": projectId, "X-Appwrite-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "بيانات الدخول غير صحيحة أو الحساب غير متاح." }, { status: 401 });
    session = await response.json() as Session;
  } catch {
    return NextResponse.json({ error: "تعذّر الاتصال بخدمة تسجيل الدخول." }, { status: 502 });
  }
  if (!session.secret) return NextResponse.json({ error: "لم يتم استلام جلسة صالحة من Appwrite." }, { status: 502 });

  try {
    const user = await appwriteRequest<User>("/account", {}, session.secret);
    if (!user.$id) throw new Error("INVALID_USER");
    const query = encodeURIComponent(JSON.stringify({ method: "equal", attribute: "user_id", values: [user.$id] }));
    const admins = await appwriteRequest<List<Admin>>(`/tablesdb/${encodeURIComponent(databaseId)}/tables/platform_admins/rows?queries[]=${query}&queries[]=${encodeURIComponent(JSON.stringify({ method: "limit", values: [5] }))}`);
    const authorized = (admins.rows ?? []).map(data).some(row => row.user_id === user.$id && row.role === "platform_owner" && row.is_active === true);
    if (!authorized) {
      await fetch(`${endpoint}/account/sessions/current`, { method: "DELETE", headers: { "X-Appwrite-Project": projectId, "X-Appwrite-Session": session.secret }, cache: "no-store" }).catch(() => undefined);
      return NextResponse.json({ error: "هذا الحساب غير مخوّل بإدارة منصة BADE3." }, { status: 403 });
    }
    const response = NextResponse.json({ success: true, user: { email: user.email ?? "", name: user.name ?? "" } });
    response.cookies.set(platformSessionCookieName(), session.secret, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
      ...(session.expire ? { expires: new Date(session.expire) } : {}),
    });
    return response;
  } catch {
    await fetch(`${endpoint}/account/sessions/current`, { method: "DELETE", headers: { "X-Appwrite-Project": projectId, "X-Appwrite-Session": session.secret }, cache: "no-store" }).catch(() => undefined);
    return NextResponse.json({ error: "تعذّر التحقق من صلاحية مالك المنصة." }, { status: 503 });
  }
}
