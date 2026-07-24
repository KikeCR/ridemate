# Partner Onboarding Wizard

A resumable, 3-step B2B partner onboarding wizard: connect a Provider account,
validate the credentials against a mock Provider, and go live. Built as a
take-home assessment.

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
isolation — no workspace/Prisma-client resolution quirks, no ambiguity about
which lockfile governs what. `cd` into each and run its commands directly.

## Prerequisites

- Node.js 20+
- A local PostgreSQL instance (any of: Postgres.app, Homebrew `postgresql`,
  or a throwaway Docker container — see below)

## 1. Database setup

Two databases are needed: one for normal use, one for tests. Using Docker for
a disposable local Postgres is the fastest path:

```bash
docker run -d --name ridemate-postgres \
  -e POSTGRES_USER=ridemate -e POSTGRES_PASSWORD=ridemate -e POSTGRES_DB=ridemate_dev \
  -p 5432:5432 postgres:16-alpine

docker exec ridemate-postgres psql -U ridemate -d ridemate_dev -c "CREATE DATABASE ridemate_test;"
```

(No Docker involved in the app itself — this is purely a convenient way to get
a local Postgres; a Homebrew/Postgres.app install with the same DB names works
identically. "No production infra" per the assessment scope refers to the
*app*, not to how you happen to stand up a local dev database.)

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

Run the backend tests (separate terminal, dev server doesn't need to be running):

```bash
cd backend
npm test
```

## 3. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL, defaults to http://localhost:3000
npm install
npm run dev              # http://localhost:5173
```

Run the frontend tests:

```bash
cd frontend
npm test
```

Open http://localhost:5173 with the backend running and walk the wizard.

## Code style & testing conventions

- **Prettier, `semi: false`.** A single `.prettierrc.json` at the repo root
  applies to both `backend/` and `frontend/` (Prettier resolves config by
  walking up from each file, so one root config is enough — no per-project
  duplication). Run `npm run format` / `npm run format:check` in either
  folder.
- **Frontend component tests use the Page Object pattern.** Each tested
  component has a corresponding class in `frontend/src/test/pageObjects/`
  (e.g. `DetailsStepPage`, `ValidateStepPage`) that owns rendering the
  component plus its queries/actions (`page.fillAndSubmit(...)`,
  `page.clickAction()`, `page.badge`), so the `*.test.tsx` files read as a
  sequence of intent (`render → act → assert`) instead of raw
  `screen.getByRole`/`fireEvent` calls repeated in every test. New frontend
  tests should follow the same shape: add/extend a page object rather than
  querying the DOM directly in the test body.

## Mock Provider — magic account IDs

`POST /provider/validate` (and the in-process `Provider.validate()` call the
session flow actually uses) branches on `accountId`:

| accountId | Response | Meaning |
|---|---|---|
| `acc-valid` | 200 `{ status: "valid", items: [...] }` | Credentials good |
| `acc-partial` | 200 `{ status: "partial", items: [...], warnings: [...] }` | Some checks failed; partner can still go live |
| `acc-invalid` | 200 `{ status: "invalid", reason: "..." }` | Bad credentials; re-enter and retry |
| `acc-unavailable` | 503 (in-process: throws) | Simulated provider outage; safe to retry |
| anything else | 200 `{ status: "invalid", reason: "Unrecognized account." }` | Fails closed rather than vouching for an unknown account |

`apiKey` can be anything for all of the above — only `accountId` selects the
path.

## API summary

All three session endpoints return `{ session, validation }`. `apiKey` is
never echoed back (only a derived `hasApiKey: boolean`).

- `GET /api/session` — resume-or-create for the single hardcoded partner. This
  is the entire resume mechanism; the frontend calls it once on mount.
- `PATCH /api/session/details` — `{ companyName, accountId, apiKey }`, always
  advances `currentStep` to `VALIDATE`. 409 once the session is `LIVE`.
- `POST /api/session/validate` — `{ forceRetry?: boolean }`. Idempotent: calls
  the Provider only if there's no prior validation, the credentials changed,
  the prior result was `UNAVAILABLE` (transient, always retried), or
  `forceRetry` is set. Always responds `200`; the outcome (including
  `INVALID`/`UNAVAILABLE`) lives in the body.
- `POST /api/session/go-live` — finalizes inside a Prisma transaction after
  re-checking `validation.status ∈ (VALID, PARTIAL)`. If already `LIVE`,
  returns `200` with current state (idempotent double-submit) instead of
  erroring.

## Design decisions & trade-offs

- **Idempotent `/validate` via a credential fingerprint.** The `Validation`
  row stores `validatedAccountId` + `sha256(apiKey)` from its last real
  Provider call. A new `/validate` call only actually hits the Provider if
  those no longer match the session's current credentials, the prior result
  was `UNAVAILABLE`, or the client explicitly asks for `forceRetry`. This
  keeps "don't re-call the Provider needlessly" correct across credential
  edits without needing a separate "dirty" flag.
- **`/validate` always returns HTTP 200.** The business outcome (including
  `INVALID`/`UNAVAILABLE`) is data in the response body, not a transport-layer
  error — the frontend never has to branch on status codes to render a
  validation state. This deliberately differs from `POST /provider/validate`,
  which does return `503` for the unavailable case, since that route exists
  specifically to mirror the mock Provider's own literal contract.
- **In-process `Provider` interface vs. the `/provider/validate` HTTP route.**
  The session flow (`sessionService`) calls `Provider.validate()` directly,
  in-process — no self-referential HTTP hop, and it stays trivial to reason
  about alongside a Prisma transaction. The `POST /provider/validate` Fastify
  route is registered separately and shares the same `Provider` singleton,
  purely so the literal HTTP contract from the spec is independently
  reachable/testable. Swapping to a real Provider later means implementing the
  `Provider` interface and changing one line in `buildApp()`.
- **`go-live` re-checks validation status *inside* the transaction**, not just
  before it opens. This is what makes "transactional consistency if go-live
  fails midway" a meaningful thing to test — see
  `backend/test/session.golive.test.ts`, which wraps Prisma so the session
  update happens and then an error is thrown before commit, then asserts (via
  a fresh read) that the session is still `IN_PROGRESS`.
- **Single partner is a hardcoded constant** (`PARTNER_ID` in
  `backend/src/lib/partner.ts`), with `OnboardingSession.partnerId` unique at
  the DB level. `GET`, `PATCH`, and both `POST`s all resolve "the" session via
  find-or-create against that constant — no endpoint requires `GET` to have
  been called first, since a curl/Postman client hitting `PATCH` directly is
  a legitimate use of a single-partner API.
- **Unrecognized `accountId` fails closed as `invalid`,** not `valid` — a
  provider shouldn't vouch for an account it has no record of, and this keeps
  the mock's behavior deterministic against exactly the four documented magic
  values.
- **`apiKey` never appears in any API response**, even though it's stored in
  plaintext (see "Deferred" below). Only a derived `hasApiKey: boolean` is
  returned, so the frontend can render "already entered" state without ever
  receiving the secret back.
- **`PATCH /details` stays editable any time before `LIVE`,** including from
  `VALIDATE`/`REVIEW`, and always resets `currentStep` back to `VALIDATE` (a
  credential change should always require re-validating). The wizard UI itself
  doesn't expose a "go back and edit" affordance from later steps — the spec's
  flow is linear (Details → Validate → Review) — but the API supports it, which
  is what the `session.details.test.ts` re-edit test exercises directly.
- **Test isolation via `TRUNCATE` between tests**, not per-test transactions
  — with only two tables and no need for nested-transaction gymnastics, a
  `beforeEach` truncate against a dedicated `ridemate_test` database is simpler
  and just as fast. `vitest.config.ts` sets `fileParallelism: false` so
  concurrent test files can't race on the same truncated tables.
- **Tailwind v4** via `@tailwindcss/vite` (single `@import "tailwindcss"`, no
  `tailwind.config.js` needed) — less setup for the same result, appropriate
  given the "simple, clean, modern" styling bar rather than a deep design
  system.

## Explicitly deferred (per assessment scope)

- **Auth/login** — single hardcoded partner, no session/auth layer.
- **API key encryption at rest** — `apiKey` is stored as plaintext in
  `OnboardingSession`. In a real system this would be encrypted with a KMS-held
  key (or tokenized at the Provider boundary so the app never persists the raw
  secret at all). Deferred because it adds key-management infrastructure with
  no bearing on the resumable-wizard behavior being assessed.
- **Real async Provider (webhooks/polling)** — the mock Provider is
  synchronous; a real integration would likely need to kick off an async job
  and poll/webhook back, which would change `Validation` from a
  request/response shape to a job-status shape. Deferred since the spec calls
  for a synchronous mock.
- **Multi-partner support** — `partnerId` is a hardcoded constant, not derived
  from auth or a request param.
- **Production infra** — no Docker multi-stage build, no orchestration, no CI.
  Local run only, as specified.
- **Visual polish beyond function** — no responsive breakpoints, dark mode, or
  animation, per scope; one accent color, one fixed layout.

## What I'd do with another day

- Add a "back to edit details" affordance in the frontend for `VALIDATE`/
  `REVIEW` (the backend already supports it), rather than leaving it
  API-only.
- Expand the `items` shape returned by the Provider into something a real
  integration would actually need (pagination, per-item retry), since right
  now it's a flat list sized for the mock's four scenarios.
- Add a few more edge-case backend tests: concurrent double-`GET` on a cold
  session (race on the `upsert`), and a malformed/empty JSON body against each
  mutation route.
- Wire up `pino-pretty` for readable dev logs instead of the raw JSON Fastify
  emits by default.
- Consider moving the credential fingerprint (`validatedApiKeyHash`) comparison
  into a small dedicated module with its own unit tests, independent of the
  full `sessionService` integration tests, since it's the trickiest piece of
  logic in the idempotency behavior.

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
