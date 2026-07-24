import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import type { PrismaClient } from "@prisma/client"
import { buildTestApp } from "./helpers/buildTestApp.js"
import { prisma } from "../src/db/prisma.js"

async function progressToValidated(app: FastifyInstance, accountId: string) {
  await request(app.server).get("/api/session")
  await request(app.server)
    .patch("/api/session/details")
    .send({ companyName: "Acme Co", accountId, apiKey: "secret" })
  return request(app.server).post("/api/session/validate").send({})
}

/**
 * Wraps the real Prisma client so that inside the go-live transaction, the
 * session status update is actually written (to prove it happens) and then
 * an error is thrown to force a rollback - proving the write never commits.
 */
function withFailingGoLiveTransaction(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "$transaction") {
        // sessionService uses both the callback form (goLive) and the
        // array form (validateSession) - only the callback form needs
        // wrapping here, so the array form must pass straight through.
        return (arg: unknown, options?: unknown) => {
          if (typeof arg !== "function") {
            return Reflect.apply(
              target.$transaction as (...a: unknown[]) => unknown,
              target,
              [arg, options]
            )
          }
          const fn = arg as (tx: unknown) => Promise<unknown>
          return target.$transaction((tx) => {
            const wrappedTx = new Proxy(tx as object, {
              get(txTarget, txProp) {
                if (txProp === "onboardingSession") {
                  const sessionDelegate = Reflect.get(txTarget, txProp) as Record<
                    string,
                    unknown
                  >
                  return new Proxy(sessionDelegate, {
                    get(sessionTarget, sessionProp) {
                      if (sessionProp === "update") {
                        return async (...args: unknown[]) => {
                          const updateFn = sessionTarget.update as (
                            ...a: unknown[]
                          ) => Promise<unknown>
                          await updateFn.apply(sessionTarget, args)
                          throw new Error("Simulated failure after write, before commit")
                        }
                      }
                      return Reflect.get(sessionTarget, sessionProp)
                    },
                  })
                }
                return Reflect.get(txTarget, txProp)
              },
            })
            return fn(wrappedTx)
          })
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as PrismaClient
}

describe("POST /api/session/go-live", () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app.close()
  })

  it("409s when there is no validation yet", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await request(app.server).get("/api/session")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(409)
  })

  it("409s when validation is INVALID", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-invalid")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(409)
    expect(res.body.validationStatus).toBe("INVALID")
  })

  it("409s when validation is UNAVAILABLE", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-unavailable")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(409)
  })

  it("409s when the accountId was edited after validating and never re-validated", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-valid")

    // Edit to different, unvalidated credentials without calling /validate again.
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-invalid", apiKey: "secret" })

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(409)

    const fresh = await request(app.server).get("/api/session")
    expect(fresh.body.session.status).toBe("IN_PROGRESS")
  })

  it("409s when only the apiKey was edited after validating and never re-validated", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-valid")

    // Same accountId, different apiKey - still a credential change the
    // stored Validation was never run against.
    await request(app.server).patch("/api/session/details").send({
      companyName: "Acme Co",
      accountId: "acc-valid",
      apiKey: "a-different-secret",
    })

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(409)

    const fresh = await request(app.server).get("/api/session")
    expect(fresh.body.session.status).toBe("IN_PROGRESS")
  })

  it("succeeds once the changed credentials are re-validated", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-valid")

    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-partial", apiKey: "secret" })

    const blocked = await request(app.server).post("/api/session/go-live").send({})
    expect(blocked.status).toBe(409)

    await request(app.server).post("/api/session/validate").send({})
    const res = await request(app.server).post("/api/session/go-live").send({})

    expect(res.status).toBe(200)
    expect(res.body.session.status).toBe("LIVE")
  })

  it("succeeds when validation is VALID", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-valid")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(200)
    expect(res.body.session.status).toBe("LIVE")
  })

  it("succeeds when validation is PARTIAL", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-partial")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(200)
    expect(res.body.session.status).toBe("LIVE")
  })

  it("is idempotent on double go-live: second call returns 200 with current state", async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await progressToValidated(app, "acc-valid")

    const first = await request(app.server).post("/api/session/go-live").send({})
    const second = await request(app.server).post("/api/session/go-live").send({})

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(second.body.session.status).toBe("LIVE")
    expect(second.body.session.id).toBe(first.body.session.id)
  })

  it("rolls back cleanly if the transaction fails after writing but before commit", async () => {
    const failingPrisma = withFailingGoLiveTransaction(prisma)
    ;({ app } = buildTestApp(undefined, failingPrisma))
    await app.ready()
    await progressToValidated(app, "acc-valid")

    const res = await request(app.server).post("/api/session/go-live").send({})
    expect(res.status).toBe(500)

    const fresh = await request(app.server).get("/api/session")
    expect(fresh.body.session.status).toBe("IN_PROGRESS")
  })
})
