import { describe, expect, it } from "vitest"
import {
  computeFingerprint,
  fingerprintMatches,
} from "../src/lib/credentialFingerprint.js"

describe("computeFingerprint", () => {
  it("never stores the raw apiKey", () => {
    const fingerprint = computeFingerprint("acc-valid", "super-secret-key")
    expect(fingerprint.apiKeyHash).not.toContain("super-secret-key")
  })

  it("is deterministic for the same inputs", () => {
    const a = computeFingerprint("acc-valid", "secret")
    const b = computeFingerprint("acc-valid", "secret")
    expect(a).toEqual(b)
  })

  it("produces a different hash for a different apiKey", () => {
    const a = computeFingerprint("acc-valid", "secret-1")
    const b = computeFingerprint("acc-valid", "secret-2")
    expect(a.apiKeyHash).not.toBe(b.apiKeyHash)
  })
})

describe("fingerprintMatches", () => {
  it("matches when accountId and apiKeyHash are unchanged", () => {
    const fingerprint = computeFingerprint("acc-valid", "secret")
    expect(
      fingerprintMatches(fingerprint, {
        validatedAccountId: "acc-valid",
        validatedApiKeyHash: fingerprint.apiKeyHash,
      })
    ).toBe(true)
  })

  it("does not match when the accountId changed", () => {
    const fingerprint = computeFingerprint("acc-partial", "secret")
    expect(
      fingerprintMatches(fingerprint, {
        validatedAccountId: "acc-valid",
        validatedApiKeyHash: fingerprint.apiKeyHash,
      })
    ).toBe(false)
  })

  it("does not match when the apiKey changed", () => {
    const fingerprint = computeFingerprint("acc-valid", "new-secret")
    expect(
      fingerprintMatches(fingerprint, {
        validatedAccountId: "acc-valid",
        validatedApiKeyHash: computeFingerprint("acc-valid", "old-secret").apiKeyHash,
      })
    ).toBe(false)
  })

  it("does not match when nothing has been stored yet", () => {
    const fingerprint = computeFingerprint("acc-valid", "secret")
    expect(
      fingerprintMatches(fingerprint, {
        validatedAccountId: null,
        validatedApiKeyHash: null,
      })
    ).toBe(false)
  })
})
