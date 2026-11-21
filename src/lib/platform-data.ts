import "server-only";
import { appwriteRequest } from "./platform-auth";

const databaseId = process.env.BADE3_CORE_DATABASE_ID ?? "bella_roses";
type Row<T> = { $id: string; data?: T } & Partial<T>;
type List<T> = { rows?: Row<T>[]; total?: number };
type Tenant = { name?: string; slug?: string; status?: string; default_currency?: string; timezone?: string };
type Branch = { tenant_id?: string; status?: string; name?: string };
type Domain = { tenant_id?: string; domain?: string; verification_status?: string; is_active?: boolean; is_primary?: boolean };
type Plan = { name?: string; code?: string; is_active?: boolean; branch_limit?: number };
type Subscription = { tenant_id?: string; plan_id?: string; status?: string; starts_at?: string; ends_at?: string };

function data<T>(row: Row<T>): T {
  if (row.data && typeof row.data === "object") return row.data;
  const value = { ...row } as Record<string, unknown>;
  for (const key of ["$id", "$sequence", "$tableId", "$databaseId", "$createdAt", "$updatedAt", "$permissions", "data"]) delete value[key];
  return value as T;
}
async function list<T>(table: string): Promise<Row<T>[]> {
  const query = encodeURIComponent(JSON.stringify({ method: "limit", values: [500] }));
  const result = await appwriteRequest<List<T>>(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows?queries[]=${query}`);
  return result.rows ?? [];
}

export async function getPlatformOverview() {
  const [tenantRows, branchRows, domainRows, planRows, subscriptionRows] = await Promise.all([
    list<Tenant>("tenants"), list<Branch>("branches"), list<Domain>("tenant_domains"),
    list<Plan>("plans"), list<Subscription>("subscriptions"),
  ]);
  const tenants = tenantRows.map(row => ({ id: row.$id, ...data(row) }));
  const branches = branchRows.map(row => ({ id: row.$id, ...data(row) }));
  const domains = domainRows.map(row => ({ id: row.$id, ...data(row) }));
  const subscriptions = subscriptionRows.map(row => ({ id: row.$id, ...data(row) }));
  const plans = new Map(planRows.map(row => [row.$id, data(row).name ?? data(row).code ?? row.$id]));
  const items = tenants.map(tenant => {
    const tenantBranches = branches.filter(branch => branch.tenant_id === tenant.id);
    const tenantDomains = domains.filter(domain => domain.tenant_id === tenant.id && domain.is_active && domain.verification_status === "verified");
    const tenantSubscriptions = subscriptions.filter(sub => sub.tenant_id === tenant.id)
      .sort((a, b) => (b.starts_at ?? b.id).localeCompare(a.starts_at ?? a.id));
    const subscription = tenantSubscriptions[0];
    return {
      id: tenant.id, name: tenant.name ?? tenant.slug ?? tenant.id, slug: tenant.slug ?? "",
      status: tenant.status ?? "unknown", branchCount: tenantBranches.length,
      domains: tenantDomains.map(domain => ({ domain: domain.domain ?? "", primary: domain.is_primary === true })),
      plan: subscription ? plans.get(subscription.plan_id ?? "") ?? subscription.plan_id ?? "—" : "—",
      subscriptionStatus: subscription?.status ?? "none",
      currency: tenant.default_currency ?? "", timezone: tenant.timezone ?? "",
    };
  });
  return {
    stats: {
      tenants: tenants.length,
      activeTenants: tenants.filter(item => item.status === "active").length,
      suspendedTenants: tenants.filter(item => item.status === "suspended").length,
      branches: branches.filter(item => item.status === "active").length,
      activeSubscriptions: subscriptions.filter(item => ["active", "trial"].includes(item.status ?? "")).length,
    },
    tenants: items,
  };
}
