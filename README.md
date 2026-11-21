# BADE3 Platform

The parent SaaS platform operated by **BADE3**. Customer products such as **Bella Roses** are tenants of this platform; they are not platform owners.

## Product boundaries

- Platform owner: BADE3
- First tenant: Bella Roses (`bella-roses`)
- Tenant app: `bella-roses.bade3.com`
- Platform website: `www.bade3.com`

## Architecture

- Next.js App Router, React, TypeScript
- Appwrite Auth and TablesDB as the platform identity and data layer
- Vercel for hosting
- GitHub Actions for CI

## Security principles

1. Resolve platform-owner identity from an Appwrite session, never from client-supplied user IDs.
2. Authorize platform access against the server-side `platform_admins` allowlist.
3. Keep platform-owner authorization separate from tenant membership and branch staff roles.
4. Scope tenant data access on the server and fail closed when storage/auth checks fail.
5. Never expose Appwrite API keys to the browser.

## Status

Repository foundation and implementation plan. See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and [deployment](docs/DEPLOYMENT.md).
