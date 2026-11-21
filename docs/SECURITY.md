# Security Baseline

## Platform owner

- Read the Appwrite session cookie on the server only.
- Validate the session with Appwrite `/account`.
- Match the authenticated Appwrite user ID against `platform_admins.user_id`.
- Require `role = platform_owner` and `is_active = true`.
- On any Appwrite/network/schema error, deny access. Do not silently convert storage failures into an empty allowlist.

## Tenant boundaries

- Never trust a tenant ID, branch ID, role, or user ID supplied by the browser as proof of authorization.
- Resolve tenant context from a verified host/domain mapping.
- Check active tenant membership and branch access on every protected operation.
- Reject inactive tenants, inactive branches, revoked membership and cross-tenant resource IDs.

## Secrets

- Appwrite API keys are server-only environment variables.
- Never prefix privileged secrets with `NEXT_PUBLIC_`.
- Do not commit `.env` files or credentials.
- Use no-store responses for authenticated platform data.

## Operational requirements

- Audit privileged mutations.
- Prefer read-only access for the first platform dashboard release.
- Add rate limiting to authentication endpoints.
- Keep authorization tests for positive, inactive, revoked and cross-tenant cases.
