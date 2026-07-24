import { describe, expect, it, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { ValidateStepPage } from "../../../test/pageObjects/ValidateStepPage"
import * as sessionApi from "../../../api/session"
import type { SessionDto, SessionEnvelope, ValidationDto } from "../../../types/session"

vi.mock("../../../api/session")

const session: SessionDto = {
  id: "session-1",
  partnerId: "partner-demo-co",
  status: "IN_PROGRESS",
  currentStep: "VALIDATE",
  companyName: "Acme Co",
  accountId: "acc-invalid",
  hasApiKey: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("ValidateStep", () => {
  beforeEach(() => {
    vi.mocked(sessionApi.validateSession).mockResolvedValue({
      session,
      validation: {
        status: "INVALID",
        items: [],
        warnings: [],
        reason: null,
        attempts: 2,
        lastAttemptAt: null,
      },
    } satisfies SessionEnvelope)
  })

  it("shows a PENDING badge and a plain Validate action before any attempt", () => {
    const page = ValidateStepPage.render({ session, validation: null })

    expect(page.badge).toHaveAttribute("data-status", "PENDING")
    expect(page.text("Validate credentials")).toBeInTheDocument()
  })

  it("calls validate without forceRetry on the first attempt", async () => {
    const page = ValidateStepPage.render({ session, validation: null })

    page.clickAction()

    await waitFor(() => {
      expect(sessionApi.validateSession).toHaveBeenCalledWith({ forceRetry: false })
    })
  })

  it("shows the reason and a Retry action when INVALID", () => {
    const validation: ValidationDto = {
      status: "INVALID",
      items: [],
      warnings: [],
      reason: "Invalid API key for the given account.",
      attempts: 1,
      lastAttemptAt: "2026-01-01T00:00:00.000Z",
    }
    const page = ValidateStepPage.render({ session, validation })

    expect(page.badge).toHaveAttribute("data-status", "INVALID")
    expect(page.text("Invalid API key for the given account.")).toBeInTheDocument()
    expect(page.text("Retry validation")).toBeInTheDocument()
  })

  it("sends forceRetry:true when retrying after INVALID", async () => {
    const validation: ValidationDto = {
      status: "INVALID",
      items: [],
      warnings: [],
      reason: "Invalid API key for the given account.",
      attempts: 1,
      lastAttemptAt: "2026-01-01T00:00:00.000Z",
    }
    const page = ValidateStepPage.render({ session, validation })

    page.clickAction()

    await waitFor(() => {
      expect(sessionApi.validateSession).toHaveBeenCalledWith({ forceRetry: true })
    })
  })

  it("shows warnings for PARTIAL validations", () => {
    const validation: ValidationDto = {
      status: "PARTIAL",
      items: [
        { key: "billing-profile", passed: false, message: "Billing profile incomplete" },
      ],
      warnings: [
        "Billing profile incomplete; you can go live but we recommend following up.",
      ],
      reason: null,
      attempts: 1,
      lastAttemptAt: "2026-01-01T00:00:00.000Z",
    }
    const page = ValidateStepPage.render({ session, validation })

    expect(page.text("Billing profile incomplete")).toBeInTheDocument()
  })
})
