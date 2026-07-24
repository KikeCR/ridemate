import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

describe("PATCH /api/session/details", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await request(app.server).get("/api/session")
  })

  afterEach(async () => {
    await app.close()
  })

  it("saves details and advances to VALIDATE", async () => {
    const res = await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-valid", apiKey: "secret" })

    expect(res.status).toBe(200)
    expect(res.body.session.companyName).toBe("Acme Co")
    expect(res.body.session.accountId).toBe("acc-valid")
    expect(res.body.session.currentStep).toBe("VALIDATE")
  })

  it("400s on a missing field", async () => {
    const res = await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-valid" })

    expect(res.status).toBe(400)
  })

  it("remains editable and resets to VALIDATE even after reaching REVIEW", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-valid", apiKey: "secret" })
    await request(app.server).post("/api/session/validate").send({})

    const editAgain = await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co Renamed", accountId: "acc-valid", apiKey: "secret" })

    expect(editAgain.status).toBe(200)
    expect(editAgain.body.session.currentStep).toBe("VALIDATE")
    expect(editAgain.body.session.companyName).toBe("Acme Co Renamed")
  })

  it("409s once the session is LIVE", async () => {
    await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "Acme Co", accountId: "acc-valid", apiKey: "secret" })
    await request(app.server).post("/api/session/validate").send({})
    await request(app.server).post("/api/session/go-live").send({})

    const res = await request(app.server)
      .patch("/api/session/details")
      .send({ companyName: "New Name", accountId: "acc-valid", apiKey: "secret" })

    expect(res.status).toBe(409)
  })
})
