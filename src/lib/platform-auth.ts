import "server-only";

import { cookies } from "next/headers";

const endpoint = (process.env.APPWRITE_ENDPOINT ?? "").replace(/\/+$/, "");
const projectId = process.env.APPWRITE_PROJECT_ID ?? "";
const databaseId = process.env.BADE3_CORE_DATABASE_ID ?? "bella_roses";
const apiKey = process.env.APPWRITE_API_KEY ?? "";
const sessionCookie = projectId ? `a_session_${projectId}` : "";

type AppwriteRow<T> = { $id: string; data?: T } & Partial<T>;
type AppwriteList<T> = { rows?: AppwriteRow<T>[]; total?: number };
type PlatformAdmin = { user_id?: string; role?: string; is_active?: boolean };

function rowData<T>(row: AppwriteRow<T>): T {
  if (row.data && typeof row.data === "object") return row.data;
  const value = { ...row } as Record<string, unknown>;
  for (const key of ["$id", "$sequence", "$tableId", "$databaseId", "$createdAt", "$updatedAt", "$permissions", "data"]) delete value[key];
  return value as T;
}

function assertConfig() {
  if (!endpoint || !projectId || !databaseId || !apiKey || !sessionCookie) throw new Error("PLATFORM_AUTH_NOT_CONFIGURED");
}

export async function appwriteRequest<T>(path: string, init: RequestInit = {}, session?: string): Promise<T> {
  assertConfig();
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      "X-Appwrite-Project": projectId,
      ...(session ? { "X-Appwrite-Session": session } : { "X-Appwrite-Key": apiKey }),
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`APPWRITE_REQUEST_FAILED_${response.status}`);
  return response.json() as Promise<T>;
}

export async function getPlatformSession() {
  assertConfig();
  return (await cookies()).get(sessionCookie)?.value ?? null;
}

export async function verifyPlatformOwner() {
  const session = await getPlatformSession();
  if (!session) return null;
  let user: { $id?: string; email?: string; name?: string };
  try {
    user = await appwriteRequest("/account", {}, session);
  } catch {
    return null;
  }
  if (!user.$id) return null;

  const query = encodeURIComponent(JSON.stringify({ method: "equal", attribute: "user_id", values: [user.$id] }));
  const result = await appwriteRequest<AppwriteList<PlatformAdmin>>(
    `/tablesdb/${encodeURIComponent(databaseId)}/tables/platform_admins/rows?queries[]=${query}&queries[]=${encodeURIComponent(JSON.stringify({ method: "limit", values: [5] }))}`,
  );
  const allowed = (result.rows ?? []).map(rowData).some(row => row.user_id === user.$id && row.role === "platform_owner" && row.is_active === true);
  return allowed ? { id: user.$id, email: user.email ?? "", name: user.name ?? "" } : null;
}

export function platformSessionCookieName() {
  assertConfig();
  return sessionCookie;
}

export async function writePlatformAudit(actor: { id: string; email: string }, event: { action: string; resource_type: string; resource_id?: string; tenant_id?: string; details?: Record<string, unknown> }) {
  try {
    const id = crypto.randomUUID().replace(/-/g, "");
    await appwriteRequest(`/tablesdb/${encodeURIComponent(databaseId)}/tables/platform_audit_logs/rows`, {
      method: "POST",
      body: JSON.stringify({ rowId: id, permissions: [], data: {
        actor_user_id: actor.id,
        actor_email: actor.email.slice(0, 255),
        action: event.action.slice(0, 64),
        resource_type: event.resource_type.slice(0, 64),
        ...(event.resource_id ? { resource_id: event.resource_id.slice(0, 128) } : {}),
        ...(event.tenant_id ? { tenant_id: event.tenant_id.slice(0, 36) } : {}),
        ...(event.details ? { details: JSON.stringify(event.details).slice(0, 60000) } : {}),
        created_at: new Date().toISOString(),
      } }),
    });
    return true;
  } catch {
    return false;
  }
}
