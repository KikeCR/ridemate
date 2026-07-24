import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

describe("POST /api/session/validate/items/:itemId/retry", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await request(app.server).get("/api/session")
  })

  afterEach(async () => {
    await app.close()
  })

  it("400s if no validation has been run yet", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-partial", apiKey: "secret" })

    const res = await request(app.server).post(
      "/api/session/validate/items/billing-profile/retry"
    )
    expect(res.status).toBe(400)
  })

  it("404s for an unknown item id", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-partial", apiKey: "secret" })
    await request(app.server).post("/api/session/validate").send({})

    const res = await request(app.server).post(
      "/api/session/validate/items/does-not-exist/retry"
    )
    expect(res.status).toBe(404)
  })

  it("refreshes only the targeted item and bumps attempts, leaving overall status untouched", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-partial", apiKey: "secret" })
    const first = await request(app.server).post("/api/session/validate").send({})
    expect(first.body.validation.attempts).toBe(1)
    expect(first.body.validation.items).toHaveLength(3)

    const res = await request(app.server).post(
      "/api/session/validate/items/billing-profile/retry"
    )

    expect(res.status).toBe(200)
    expect(res.body.validation.status).toBe("PARTIAL")
    expect(res.body.validation.attempts).toBe(2)
    expect(res.body.validation.items).toHaveLength(3)

    const untouched = res.body.validation.items.find(
      (item: { id: string }) => item.id === "account-lookup"
    )
    expect(untouched.passed).toBe(true)

    const retried = res.body.validation.items.find(
      (item: { id: string }) => item.id === "billing-profile"
    )
    expect(retried.id).toBe("billing-profile")
  })

  it("does not corrupt state when the provider is unavailable during a retry", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-partial", apiKey: "secret" })
    await request(app.server).post("/api/session/validate").send({})

    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-unavailable", apiKey: "secret" })

    const res = await request(app.server).post(
      "/api/session/validate/items/billing-profile/retry"
    )

    expect(res.status).toBe(200)
    expect(res.body.validation.items).toHaveLength(3)
    expect(res.body.validation.attempts).toBe(2)
  })
})
