# BADE3 Platform Architecture

## Ownership model

BADE3 is the SaaS vendor and owns the platform control plane. Each customer is a tenant. Bella Roses is the first tenant and must not be treated as the platform owner.

## Domains

- `bade3.com` redirects to `www.bade3.com`.
- `www.bade3.com` is the platform entry point.
- `bella-roses.bade3.com` is a tenant application domain.

## Logical layers

1. **Control plane** — platform owner authentication, tenant directory, plans, subscriptions, verified domains, branch counts, platform operations.
2. **Tenant plane** — tenant-specific users, branches, staff permissions, products, categories, tables, orders and operational data.
3. **Infrastructure** — Appwrite Auth/TablesDB/Storage, Next.js services, Vercel hosting, GitHub source control.

## Current stack

- Next.js 15 App Router
- React + TypeScript
- Appwrite Auth and TablesDB
- Vercel
- GitHub

Supabase is not part of this architecture.

## Data model

Existing Appwrite database: `bella_roses` (current shared platform database).

Control-plane tables already present:
- `platform_admins`
- `tenants`
- `plans`
- `subscriptions`
- `branches`
- `tenant_domains`
- `tenant_members`
- `branch_staff_access`

Tenant data must be isolated by `tenant_id`; branch-scoped operations must additionally enforce `branch_id` and active branch access.

## Integration contract

The Bella Roses application remains in its own repository. This repository owns the BADE3 platform experience and control plane. Shared contracts should be versioned and documented rather than coupling platform ownership to a tenant application.
