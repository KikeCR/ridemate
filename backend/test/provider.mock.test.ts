import { describe, expect, it } from "vitest"
import { MockProvider } from "../src/provider/mockProvider.js"
import { ProviderUnavailableError } from "../src/provider/types.js"

describe("MockProvider", () => {
  const provider = new MockProvider()

  it("returns valid for acc-valid", async () => {
    const result = await provider.validate("acc-valid", "any-key")
    expect(result.status).toBe("valid")
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items.every((i) => i.passed)).toBe(true)
  })

  it("returns partial with warnings for acc-partial", async () => {
    const result = await provider.validate("acc-partial", "any-key")
    expect(result.status).toBe("partial")
    expect(result.warnings?.length).toBeGreaterThan(0)
    expect(result.items.some((i) => !i.passed)).toBe(true)
  })

  it("returns invalid with a reason for acc-invalid", async () => {
    const result = await provider.validate("acc-invalid", "any-key")
    expect(result.status).toBe("invalid")
    expect(result.reason).toBeTruthy()
  })

  it("throws ProviderUnavailableError for acc-unavailable", async () => {
    await expect(provider.validate("acc-unavailable", "any-key")).rejects.toBeInstanceOf(
      ProviderUnavailableError
    )
  })

  it("treats unrecognized accountIds as invalid, not valid", async () => {
    const result = await provider.validate("acc-does-not-exist", "any-key")
    expect(result.status).toBe("invalid")
    expect(result.reason).toBeTruthy()
  })
})
