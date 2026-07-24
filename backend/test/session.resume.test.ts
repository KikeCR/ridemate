import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

describe("GET /api/session (resume-or-create)", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    ;({ app } = buildTestApp())
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it("creates a fresh session on first call", async () => {
    const res = await request(app.server).get("/api/session")
    expect(res.status).toBe(200)
    expect(res.body.session.status).toBe("IN_PROGRESS")
    expect(res.body.session.currentStep).toBe("DETAILS")
    expect(res.body.session.companyName).toBeNull()
    expect(res.body.session.hasApiKey).toBe(false)
    expect(res.body.validation).toBeNull()
  })

  it("resumes the same session on a second call instead of duplicating it", async () => {
    const first = await request(app.server).get("/api/session")
    const second = await request(app.server).get("/api/session")

    expect(second.status).toBe(200)
    expect(second.body.session.id).toBe(first.body.session.id)
  })

  it("reflects prior input after resuming", async () => {
    await request(app.server).get("/api/session")
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-valid", apiKey: "secret" })

    const resumed = await request(app.server).get("/api/session")
    expect(resumed.body.session.companyName).toBe("Acme Co")
    expect(resumed.body.session.accountId).toBe("acc-valid")
    expect(resumed.body.session.currentStep).toBe("VALIDATE")
    expect(resumed.body.session.hasApiKey).toBe(true)
  })
})
