import { describe, expect, it } from "vitest"
import { ValidationStatusBadgePage } from "../../test/pageObjects/ValidationStatusBadgePage"
import type { ValidationStatus } from "../../types/session"

const CASES: { status: ValidationStatus; label: string }[] = [
  { status: "PENDING", label: "Not yet validated" },
  { status: "VALID", label: "Valid" },
  { status: "PARTIAL", label: "Valid with warnings" },
  { status: "INVALID", label: "Invalid credentials" },
  { status: "UNAVAILABLE", label: "Provider unavailable" },
]

describe("ValidationStatusBadge", () => {
  it.each(CASES)("renders the correct label for $status", ({ status, label }) => {
    const page = ValidationStatusBadgePage.render(status)

    expect(page.badge).toHaveAttribute("data-status", status)
    expect(page.badge).toHaveTextContent(label)
  })
})
