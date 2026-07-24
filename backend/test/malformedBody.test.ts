import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildTestApp } from "./helpers/buildTestApp.js"

const MALFORMED_JSON = '{"companyName": "Acme"' // missing closing brace

describe("malformed/empty JSON bodies against mutation routes", () => {
  let app: FastifyInstance

  beforeEach(async () => {
    ;({ app } = buildTestApp())
    await app.ready()
    await request(app.server).get("/api/session")
  })

  afterEach(async () => {
    await app.close()
  })

  it("PATCH /api/session/details 400s on malformed JSON instead of 500ing", async () => {
    const res = await request(app.server)
      .patch("/api/session/details")
      .set("Content-Type", "application/json")
      .send(MALFORMED_JSON)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("MalformedRequest")
  })

  it("PATCH /api/session/details 400s on an empty body", async () => {
    const res = await request(app.server)
      .patch("/api/session/details")
      .set("Content-Type", "application/json")
      .send("")

    expect(res.status).toBe(400)
  })

  it("POST /api/session/validate 400s on malformed JSON instead of 500ing", async () => {
    const res = await request(app.server)
      .post("/api/session/validate")
      .set("Content-Type", "application/json")
      .send(MALFORMED_JSON)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("MalformedRequest")
  })

  it("POST /api/session/validate 400s on an empty body sent with a JSON content-type", async () => {
    const res = await request(app.server)
      .post("/api/session/validate")
      .set("Content-Type", "application/json")
      .send("")

    // Fastify's JSON parser rejects a zero-length body as unparsable JSON
    // (it does not default it to `{}`), so this hits the same malformed-
    // request path as truncated JSON - not a business-rule rejection.
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("MalformedRequest")
  })

  it("POST /api/session/validate with a proper empty JSON object applies schema defaults", async () => {
    const res = await request(app.server)
      .post("/api/session/validate")
      .set("Content-Type", "application/json")
      .send({})

    // Distinct from the zero-length-body case above: `{}` parses fine, so
    // this reaches business logic and 400s only because no credentials
    // have been saved yet for this session.
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("BadRequest")
  })

  it("POST /api/session/go-live 400s on malformed JSON instead of 500ing", async () => {
    const res = await request(app.server)
      .post("/api/session/go-live")
      .set("Content-Type", "application/json")
      .send(MALFORMED_JSON)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("MalformedRequest")
  })

  it("POST .../items/:itemId/retry 400s on malformed JSON instead of 500ing", async () => {
    const res = await request(app.server)
      .post("/api/session/validate/items/some-item/retry")
      .set("Content-Type", "application/json")
      .send(MALFORMED_JSON)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("MalformedRequest")
  })

  it("leaves the session row untouched after a malformed request", async () => {
    const before = await request(app.server).get("/api/session")

    await request(app.server)
      .patch("/api/session/details")
      .set("Content-Type", "application/json")
      .send(MALFORMED_JSON)

    const after = await request(app.server).get("/api/session")
    expect(after.body.session.id).toBe(before.body.session.id)
    expect(after.body.session.companyName).toBeNull()
  })
})
