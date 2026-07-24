import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

async function saveDetails(app: FastifyInstance, accountId: string, apiKey = "secret") {
  return request(app.server)
    .patch("/api/session/details")
    .send({ companyName: "Acme Co", accountId, apiKey })
}

describe("POST /api/session/validate", () => {
  let app: FastifyInstance
  let validateSpy: ReturnType<typeof buildTestApp>["validateSpy"]

  beforeEach(async () => {
    ;({ app, validateSpy } = buildTestApp())
    await app.ready()
    await request(app.server).get("/api/session")
  })

  afterEach(async () => {
    await app.close()
  })

  it("400s if credentials haven't been saved yet", async () => {
    const res = await request(app.server).post("/api/session/validate").send({})
    expect(res.status).toBe(400)
  })

  it("acc-valid: marks VALID and advances to REVIEW", async () => {
    await saveDetails(app, "acc-valid")
    const res = await request(app.server).post("/api/session/validate").send({})

    expect(res.status).toBe(200)
    expect(res.body.validation.status).toBe("VALID")
    expect(res.body.validation.items.length).toBeGreaterThan(0)
    expect(res.body.session.currentStep).toBe("REVIEW")
  })

  it("acc-partial: marks PARTIAL with warnings and advances to REVIEW", async () => {
    await saveDetails(app, "acc-partial")
    const res = await request(app.server).post("/api/session/validate").send({})

    expect(res.status).toBe(200)
    expect(res.body.validation.status).toBe("PARTIAL")
    expect(res.body.validation.warnings.length).toBeGreaterThan(0)
    expect(res.body.session.currentStep).toBe("REVIEW")
  })

  it("acc-invalid: marks INVALID with a reason and stays at VALIDATE", async () => {
    await saveDetails(app, "acc-invalid")
    const res = await request(app.server).post("/api/session/validate").send({})

    expect(res.status).toBe(200)
    expect(res.body.validation.status).toBe("INVALID")
    expect(res.body.validation.reason).toBeTruthy()
    expect(res.body.session.currentStep).toBe("VALIDATE")
  })

  it("acc-unavailable: marks UNAVAILABLE, stays at VALIDATE, tracks attempts", async () => {
    await saveDetails(app, "acc-unavailable")
    const res = await request(app.server).post("/api/session/validate").send({})

    expect(res.status).toBe(200)
    expect(res.body.validation.status).toBe("UNAVAILABLE")
    expect(res.body.session.currentStep).toBe("VALIDATE")
    expect(res.body.validation.attempts).toBe(1)
  })

  it("is idempotent: double-validate with unchanged credentials only calls the provider once", async () => {
    await saveDetails(app, "acc-valid")
    await request(app.server).post("/api/session/validate").send({})
    const second = await request(app.server).post("/api/session/validate").send({})

    expect(validateSpy).toHaveBeenCalledTimes(1)
    expect(second.body.validation.status).toBe("VALID")
    expect(second.body.validation.attempts).toBe(1)
  })

  it("re-validates when credentials change", async () => {
    await saveDetails(app, "acc-valid")
    await request(app.server).post("/api/session/validate").send({})

    await saveDetails(app, "acc-partial")
    const res = await request(app.server).post("/api/session/validate").send({})

    expect(validateSpy).toHaveBeenCalledTimes(2)
    expect(res.body.validation.status).toBe("PARTIAL")
  })

  it("re-validates on explicit forceRetry even with unchanged credentials", async () => {
    await saveDetails(app, "acc-valid")
    await request(app.server).post("/api/session/validate").send({})
    await request(app.server).post("/api/session/validate").send({ forceRetry: true })

    expect(validateSpy).toHaveBeenCalledTimes(2)
  })

  it("auto-retries an UNAVAILABLE result on the next call without forceRetry", async () => {
    await saveDetails(app, "acc-unavailable")
    await request(app.server).post("/api/session/validate").send({})
    const second = await request(app.server).post("/api/session/validate").send({})

    expect(validateSpy).toHaveBeenCalledTimes(2)
    expect(second.body.validation.attempts).toBe(2)
  })
})
