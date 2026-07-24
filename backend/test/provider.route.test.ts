import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

describe("POST /provider/validate (mock provider HTTP contract)", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    ;({ app } = buildTestApp())
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it("200s with status valid for acc-valid", async () => {
    const res = await request(app.server)
      .post("/provider/validate")
      .send({ accountId: "acc-valid", apiKey: "k" })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("valid")
  })

  it("200s with status partial and warnings for acc-partial", async () => {
    const res = await request(app.server)
      .post("/provider/validate")
      .send({ accountId: "acc-partial", apiKey: "k" })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("partial")
    expect(res.body.warnings.length).toBeGreaterThan(0)
  })

  it("200s with status invalid and a reason for acc-invalid", async () => {
    const res = await request(app.server)
      .post("/provider/validate")
      .send({ accountId: "acc-invalid", apiKey: "k" })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("invalid")
    expect(res.body.reason).toBeTruthy()
  })

  it("503s for acc-unavailable", async () => {
    const res = await request(app.server)
      .post("/provider/validate")
      .send({ accountId: "acc-unavailable", apiKey: "k" })
    expect(res.status).toBe(503)
  })

  it("200s with status invalid for an unrecognized accountId", async () => {
    const res = await request(app.server)
      .post("/provider/validate")
      .send({ accountId: "acc-something-else", apiKey: "k" })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("invalid")
  })
})
