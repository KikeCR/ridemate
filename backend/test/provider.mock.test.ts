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

  it("gives each item a stable id/label and marks only failed items retryable", async () => {
    const result = await provider.validate("acc-partial", "any-key")
    for (const item of result.items) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.retryable).toBe(!item.passed)
    }
  })

  it("fits every item on page 1 at the default page size", async () => {
    const result = await provider.validate("acc-partial", "any-key")
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.totalPages).toBe(1)
    expect(result.items.length).toBe(result.pagination.totalItems)
  })

  it("paginates when a smaller pageSize is requested", async () => {
    const page1 = await provider.validate("acc-partial", "any-key", { pageSize: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.pagination).toEqual({
      page: 1,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    })

    const page2 = await provider.validate("acc-partial", "any-key", {
      page: 2,
      pageSize: 2,
    })
    expect(page2.items).toHaveLength(1)
    expect(page2.pagination.page).toBe(2)

    const combinedIds = [...page1.items, ...page2.items].map((item) => item.id)
    expect(new Set(combinedIds).size).toBe(3)
  })

  it("clamps an out-of-range page to the last available page", async () => {
    const result = await provider.validate("acc-partial", "any-key", {
      page: 99,
      pageSize: 2,
    })
    expect(result.pagination.page).toBe(2)
  })
})
