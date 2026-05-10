# KeepUp Desktop

React 18 + TypeScript + Vite web admin for the KeepUp sports communication platform. Used by district admins, athletic directors, and coaches to manage schools, sports, rosters, and branding.

## Requirements

- Node 18+
- npm (do not use yarn or pnpm — the lockfile is npm)

## Local setup

```bash
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_API_URL=http://localhost:3000
VITE_DEMO_MODE=true
```

Start the dev server:

```bash
npm run dev   # runs on localhost:5173
```

With `VITE_DEMO_MODE=true`, the login screen shows role-selector cards instead of a real username/password form. Pick any role to explore that user's view.

## Building

```bash
npm run build -- --mode dev        # targets dev environment
npm run build -- --mode staging    # targets staging
npm run build -- --mode production # targets prod
```

Each mode loads the corresponding `.env.{mode}` file. In CI, `VITE_API_URL` and `VITE_DEMO_MODE` are injected as GitHub Actions environment secrets — the `.env.*` files are gitignored and never committed.

## Deployment

Pushing to `dev`, `staging`, or `main` triggers GitHub Actions, which builds the Vite bundle and syncs it to the matching S3 bucket (`hajos-keepup-frontend-{env}`), then invalidates the CloudFront cache.

---

## Design decisions — do not change without understanding the consequences

### .env files are gitignored — never commit them
`.env*` is in `.gitignore`. All environment values go into `.env.local` for local dev, or into GitHub Actions environment secrets for CI. If you need to add a new env var, add it to `.env.example` (with an empty value) and document it here.

### District subdomain routing
The frontend determines the active district by parsing the hostname:
- `{slug}.keepup.hajos.app` → slug is the district
- `localhost` / bare `keepup.hajos.app` → no district (district admin / demo view)
- Local dev override: add `?district=demo` to the URL to simulate a district subdomain

The slug is sent on every API request as the `X-District-Subdomain` header via `src/api/client.ts`. Do not move this logic into individual API calls — it runs once at module load time in `client.ts`.

### TypeScript strict mode — no unused variables
The CI build runs `tsc --noEmit` and will fail on unused imports or destructured variables. If you remove a feature, remove its import too. The `noUnusedLocals` and `noUnusedParameters` flags are on.

### S3 image uploads use presigned URLs — never proxy through Rails
When a user uploads a school icon, sport banner, etc., the frontend calls `POST /uploads/presign` to get a presigned S3 URL, then PUTs the file directly to S3. Rails never receives the file bytes. Do not add a file upload endpoint that accepts `multipart/form-data` — it would force large payloads through the ECS container.

### BrandingContext is in-memory only
`BrandingContext` stores uploaded image URLs in React state for the duration of the session. It is not persisted to the backend yet. Do not assume these values survive a page refresh.

### VITE_DEMO_MODE controls the login UI, not authorization
`VITE_DEMO_MODE=true` shows the role-picker login screen. Authorization is still enforced server-side by Pundit policies. Demo mode on the frontend is purely a UX affordance for demos — it does not bypass any backend checks.

### API client adds auth and district headers to every request
`src/api/client.ts` is the single place where the `Authorization` and `X-District-Subdomain` headers are set. If you need to make a fetch call that should not include auth (e.g., the S3 presigned PUT), do it with `fetch` directly, not through the `api` wrapper. The S3 PUT in `src/api/uploads.ts` already does this correctly.
