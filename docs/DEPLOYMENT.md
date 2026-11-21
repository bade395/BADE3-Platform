# Deployment

## Target

- Vercel project: BADE3 platform project (to be linked to this repository).
- Production domain: `www.bade3.com`.
- Apex: `bade3.com` redirects to `www.bade3.com`.

## Required environment variables

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server only)
- `BADE3_CORE_DATABASE_ID`

Do not commit values. Configure them in Vercel project settings.

## Release gate

1. Install dependencies and run lint/typecheck/tests.
2. Verify platform-owner login with a real Appwrite session.
3. Verify unauthorized users receive 401/redirect and cannot access platform APIs.
4. Verify tenant directory, plan and subscription joins against live Appwrite data.
5. Deploy a preview and smoke-test before production promotion.
6. Confirm custom-domain routing and redirect behavior without changing DNS unless explicitly required.
