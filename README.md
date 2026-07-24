# RideMate: Partner Onboarding Wizard

A resumable, 3-step B2B partner onboarding wizard: connect a Provider account,
validate the credentials against a mock Provider, and go live. Built as a
take-home assessment. "RideMate" is a placeholder product name applied purely
for presentable, consistent branding across the wizard (header, browser tab,
favicon); it isn't functionally significant to the assessment.

- **Backend**: Node.js + TypeScript, Fastify, Prisma, PostgreSQL
- **Frontend**: React + TypeScript, Vite, TanStack Query, Tailwind CSS, lucide-react
- **Mock Provider**: in-process, swappable `Provider` interface (not a separate server)
- **Tests**: Vitest everywhere; backend uses Supertest against the Fastify instance

## Repo layout

```
backend/   Fastify API + Prisma schema/migrations + Vitest/Supertest suite
frontend/  Vite + React wizard UI + Vitest/RTL suite
```

Two fully independent npm projects (own `package.json`/lockfile each), not an
npm/pnpm workspace. There's no shared package between them worth hoisting for,
and independent folders mean each side installs, runs, and tests in total
isolation, with no workspace/Prisma-client resolution quirks and no ambiguity
about which lockfile governs what. `cd` into each and run its commands directly.

## Prerequisites

- Node.js 20+
- A local PostgreSQL instance (any of: Postgres.app, Homebrew `postgresql`,
  or a throwaway Docker container; see below)

## 1. Database setup

Two databases are needed: one for normal use, one for tests. Using Docker for
a disposable local Postgres is the fastest path:

```bash
docker run -d --name ridemate-postgres \
  -e POSTGRES_USER=ridemate -e POSTGRES_PASSWORD=ridemate -e POSTGRES_DB=ridemate_dev \
  -p 5432:5432 postgres:16-alpine

docker exec ridemate-postgres psql -U ridemate -d ridemate_dev -c "CREATE DATABASE ridemate_test;"
```

(No Docker involved in the app itself; this is purely a convenient way to get
a local Postgres, and a Homebrew/Postgres.app install with the same DB names
works identically. "No production infra" per the assessment scope refers to
the *app*, not to how you happen to stand up a local dev database.)

## 2. Backend

```bash
cd backend
cp .env.example .env             # DATABASE_URL, PORT
cp .env.test.example .env.test   # DATABASE_URL_TEST (used for the test DB)
npm install
npx prisma migrate dev --name init         # creates schema in the dev DB
npm run prisma:migrate:test                # applies the same migration(s) to the test DB
npm run dev                                # http://localhost:3000
```

Tests: see the "Tests" section below.

`npm run dev` logs with `pino-pretty` (colorized, readable) at `LOG_LEVEL`
(optional env var, defaults to `info`). Tests and `npm run build`/`start` use
plain JSON logging (or none, in tests) since `pino-pretty` is dev-only tooling.

Since there's a single hardcoded partner, there's only ever one session row
in the dev database, and once you've walked it to `LIVE` (or into any other
state) that's what every reload shows until it's cleared. To try a different
scenario from a clean slate without touching Postgres by hand:

```bash
cd backend
npm run reset
```

This deletes the current session and its validation from the dev database
(via Prisma, using `DATABASE_URL` from `.env`, same as everything else). The
next `GET /api/session` (i.e. reloading the frontend) creates a brand new one
at `DETAILS`. It only ever touches the dev DB, never the test DB, since the
automated test suite already truncates its own tables between tests.

## 3. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL, defaults to http://localhost:3000
npm install
npm run dev              # http://localhost:5173
```

Tests: see the "Tests" section below.

Open http://localhost:5173 with the backend running and walk the wizard.

## Tests

Both projects use Vitest. Neither suite requires `npm run dev` to be running.

```bash
cd backend && npm test    # Vitest + Supertest against the real Fastify app
cd frontend && npm test   # Vitest + React Testing Library
```

- **Backend** hits the actual Postgres test database (`ridemate_test`) through
  the real Fastify app via Supertest, not mocks; tables are truncated between
  tests (`test/setup.ts`). Requires the test DB to be migrated first (see
  "1. Database setup" and "2. Backend" above). Covers: resume-or-create,
  idempotent double-validate and double-go-live, all 4 Provider paths, the
  go-live credential-fingerprint check, per-item retry, malformed/empty JSON
  bodies, and a concurrent double-`GET` race on a cold session.
- **Frontend** uses React Testing Library via the Page Object pattern (see
  "Code style & testing conventions" below); covers step transitions and
  validation-state rendering, mocking the API layer rather than hitting a
  real backend.

## Code style & testing conventions

- **Prettier, `semi: false`.** A single `.prettierrc.json` at the repo root
  applies to both `backend/` and `frontend/` (Prettier resolves config by
  walking up from each file, so one root config is enough, no per-project
  duplication needed). Run `npm run format` / `npm run format:check` in either
  folder.
- **Frontend component tests use the Page Object pattern.** Each tested
  component has a corresponding class in `frontend/src/test/pageObjects/`
  (e.g. `DetailsStepPage`, `ValidateStepPage`) that owns rendering the
  component plus its queries/actions (`page.fillAndSubmit(...)`,
  `page.clickAction()`, `page.badge`), so the `*.test.tsx` files read as a
  sequence of intent (`render, act, assert`) instead of raw
  `screen.getByRole`/`fireEvent` calls repeated in every test. New frontend
  tests should follow the same shape: add/extend a page object rather than
  querying the DOM directly in the test body.

## Mock Provider: magic account IDs

`POST /provider/validate` (and the in-process `Provider.validate()` call the
session flow actually uses) branches on `accountId`:

| accountId | Response | Meaning |
|---|---|---|
| `acc-valid` | 200 `{ status: "valid", items: [...] }` | Credentials good |
| `acc-partial` | 200 `{ status: "partial", items: [...], warnings: [...] }` | Some checks failed; partner can still go live |
| `acc-invalid` | 200 `{ status: "invalid", reason: "..." }` | Bad credentials; re-enter and retry |
| `acc-unavailable` | 503 (in-process: throws) | Simulated provider outage; safe to retry |
| anything else | 200 `{ status: "invalid", reason: "Unrecognized account." }` | Fails closed rather than vouching for an unknown account |

`apiKey` can be anything for all of the above; only `accountId` selects the
path. Each item in `items` now has the shape a real integration would need:
`{ id, label, passed, retryable, message? }` (`retryable` is only ever true
for a failed item). The result also carries a `pagination` block (`page`,
`pageSize`, `totalItems`, `totalPages`); the mock's item lists are small
enough to always fit on page 1 by default, but `/provider/validate` accepts
optional `page`/`pageSize` in its body to see pagination in action (see
`MockProvider`'s `paginate` helper and `provider.mock.test.ts`).

## API summary

All three session endpoints return `{ session, validation }`. `apiKey` is
never echoed back (only a derived `hasApiKey: boolean`).

- `GET /api/session`: resume-or-create for the single hardcoded partner. This
  is the entire resume mechanism; the frontend calls it once on mount.
- `PATCH /api/session/details`: `{ companyName, accountId, apiKey }`, always
  advances `currentStep` to `VALIDATE`. 409 once the session is `LIVE`.
- `POST /api/session/validate`: `{ forceRetry?: boolean }`. Idempotent: calls
  the Provider only if there's no prior validation, the credentials changed,
  the prior result was `UNAVAILABLE` (transient, always retried), or
  `forceRetry` is set. Always responds `200`; the outcome (including
  `INVALID`/`UNAVAILABLE`) lives in the body.
- `POST /api/session/go-live`: finalizes inside a Prisma transaction after
  re-checking `validation.status ∈ (VALID, PARTIAL)` *and* that the stored
  Validation's credential fingerprint still matches the session's current
  `accountId`/`apiKey`. That second check matters: editing details to
  different, unvalidated credentials after a successful validation, then
  calling go-live directly without re-validating, would otherwise go live on
  credentials that were never actually checked (the frontend's own flow
  always routes back through `VALIDATE` after an edit, but the API itself
  has to enforce this independently of the UI). If already `LIVE`, returns
  `200` with current state (idempotent double-submit) instead of erroring.
- `POST /api/session/validate/items/:itemId/retry`: re-checks a single failed
  item without re-running the full validation. Requires an existing
  Validation (400 if none) and a known `itemId` (404 otherwise). Bumps
  `attempts`/`lastAttemptAt` and splices the refreshed item back into the
  stored list; the overall `validation.status` is left untouched (it still
  reflects the last full `/validate` call, so use `forceRetry` on `/validate`
  itself to refresh that). If the Provider is unavailable mid-retry, the item
  is left as-is (no corruption) but the attempt is still recorded.

## Explicitly deferred (per assessment scope)

- **Auth/login**: single hardcoded partner, no session/auth layer.
- **API key encryption at rest**: `apiKey` is stored as plaintext in
  `OnboardingSession`. In a real system this would be encrypted with a
  KMS-held key (or tokenized at the Provider boundary so the app never
  persists the raw secret at all). Deferred because it adds key-management
  infrastructure with no bearing on the resumable-wizard behavior being
  assessed.
- **Real async Provider (webhooks/polling)**: the mock Provider is
  synchronous; a real integration would likely need to kick off an async job
  and poll/webhook back, which would change `Validation` from a
  request/response shape to a job-status shape. Deferred since the spec calls
  for a synchronous mock.
- **Multi-partner support**: `partnerId` is a hardcoded constant, not derived
  from auth or a request param.
- **Production infra**: no Docker multi-stage build, no orchestration, no CI.
  Local run only, as specified.
- **Visual polish beyond function**: no responsive breakpoints, dark mode, or
  animation, per scope; one accent color, one fixed layout.

## Known limitations

- **Frontend/backend types can drift silently.** `frontend/src/types/session.ts`
  is hand-written to match what the backend actually returns (see
  `backend/src/services/sessionService.ts`'s `SessionEnvelope`); nothing
  enforces that they stay in sync. If the backend response shape changes,
  nothing catches it at compile time, only a runtime failure or a test
  breaking would surface it, and only if a test happens to touch the changed
  field. Two independent npm projects (a deliberate choice; see "Repo
  layout") rules out simply importing shared `.ts` types across them without
  either a workspace/shared package or a build step, both of which are more
  machinery than this project's size justifies on their own.

  The lightest-weight improvement, if this were taken further, would be a
  small **runtime validation layer at the frontend's API boundary**:
  zod schemas in `frontend/src/api/` mirroring the existing TS interfaces,
  parsing every `fetch` response before it's handed to React Query. That
  doesn't give compile-time safety, but it turns "the shape drifted" from a
  silent bug into an immediate, loud runtime error at the one place all
  responses already pass through, with no new build step and no shared
  package. It's a few schema definitions, not a rewrite. A heavier version of
  the same idea (better suited to a bigger project, not proposed here) would
  be generating an OpenAPI spec from the backend's existing Zod schemas and
  running `openapi-typescript` against it to generate the frontend's types
  directly, trading a small codegen step for actual compile-time guarantees
  instead of a runtime check.

## Running everything at a glance

```bash
# terminal 1
cd backend && npm install && npm run dev

# terminal 2
cd frontend && npm install && npm run dev

# terminal 3 (tests, either/both)
cd backend && npm test
cd frontend && npm test
```
