import { describe, expect, it, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { ReviewStepPage } from "../../../test/pageObjects/ReviewStepPage"
import * as sessionApi from "../../../api/session"
import type { SessionDto, SessionEnvelope, ValidationDto } from "../../../types/session"

vi.mock("../../../api/session")

const baseSession: SessionDto = {
  id: "session-1",
  partnerId: "partner-demo-co",
  status: "IN_PROGRESS",
  currentStep: "REVIEW",
  companyName: "Acme Co",
  accountId: "acc-valid",
  hasApiKey: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const validValidation: ValidationDto = {
  status: "VALID",
  items: [{ id: "credentials", label: "Credentials", passed: true, retryable: false }],
  warnings: [],
  reason: null,
  attempts: 1,
  lastAttemptAt: "2026-01-01T00:00:00.000Z",
}

describe("ReviewStep", () => {
  beforeEach(() => {
    vi.mocked(sessionApi.goLive).mockResolvedValue({
      session: { ...baseSession, status: "LIVE" },
      validation: validValidation,
    } satisfies SessionEnvelope)
  })

  it("shows the go-live action while IN_PROGRESS with a VALID validation", () => {
    const page = ReviewStepPage.render({
      session: baseSession,
      validation: validValidation,
    })

    expect(page.goLiveButton).toBeInTheDocument()
    expect(page.text("Acme Co")).toBeInTheDocument()
  })

  it("calls the go-live mutation when clicked", async () => {
    const page = ReviewStepPage.render({
      session: baseSession,
      validation: validValidation,
    })

    page.clickGoLive()

    await waitFor(() => {
      expect(sessionApi.goLive).toHaveBeenCalled()
    })
  })

  it("shows the live confirmation and hides the go-live button once LIVE", () => {
    const page = ReviewStepPage.render({
      session: { ...baseSession, status: "LIVE" },
      validation: validValidation,
    })

    expect(page.liveMessage).toBeInTheDocument()
    expect(page.goLiveButton).not.toBeInTheDocument()
  })

  it("hides the Edit details link once LIVE", () => {
    const page = ReviewStepPage.render({
      session: { ...baseSession, status: "LIVE" },
      validation: validValidation,
    })

    expect(page.editDetailsButton).not.toBeInTheDocument()
  })

  it("calls onEditDetails when the Edit details link is clicked", () => {
    const page = ReviewStepPage.render({
      session: baseSession,
      validation: validValidation,
    })

    page.clickEditDetails()

    expect(page.onEditDetails).toHaveBeenCalledTimes(1)
  })
})
