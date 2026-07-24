import { describe, expect, it, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { DetailsStepPage } from "../../../test/pageObjects/DetailsStepPage"
import * as sessionApi from "../../../api/session"
import type { SessionDto, SessionEnvelope } from "../../../types/session"

vi.mock("../../../api/session")

const baseSession: SessionDto = {
  id: "session-1",
  partnerId: "partner-demo-co",
  status: "IN_PROGRESS",
  currentStep: "DETAILS",
  companyName: null,
  accountId: null,
  hasApiKey: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("DetailsStep", () => {
  beforeEach(() => {
    vi.mocked(sessionApi.saveDetails).mockResolvedValue({
      session: { ...baseSession, currentStep: "VALIDATE" },
      validation: null,
    } satisfies SessionEnvelope)
  })

  it("submits the form with the entered values", async () => {
    const page = DetailsStepPage.render(baseSession)

    page.fillAndSubmit({
      companyName: "Acme Co",
      accountId: "acc-valid",
      apiKey: "secret-key",
    })

    await waitFor(() => {
      expect(sessionApi.saveDetails).toHaveBeenCalledWith({
        companyName: "Acme Co",
        accountId: "acc-valid",
        apiKey: "secret-key",
      })
    })
  })
})
