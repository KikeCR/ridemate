import { describe, expect, it, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { AppPage } from "../test/pageObjects/AppPage"
import * as sessionApi from "../api/session"
import type { SessionEnvelope } from "../types/session"

vi.mock("../api/session")

const sessionAtValidate: SessionEnvelope = {
  session: {
    id: "session-1",
    partnerId: "partner-demo-co",
    status: "IN_PROGRESS",
    currentStep: "VALIDATE",
    companyName: "Acme Co",
    accountId: "acc-valid",
    hasApiKey: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  validation: null,
}

describe("App - edit details affordance", () => {
  beforeEach(() => {
    vi.mocked(sessionApi.fetchSession).mockResolvedValue(sessionAtValidate)
  })

  it("shows the Validate step by default for a session at VALIDATE", async () => {
    const page = await AppPage.render()
    expect(page.text("Validate your Provider connection")).toBeInTheDocument()
  })

  it("switches to the Details form when Edit details is clicked, without changing the server step", async () => {
    const page = await AppPage.render()

    page.clickButton("Edit details")

    await waitFor(() => {
      expect(page.queryLabel("Company name")).toBeInTheDocument()
    })
    // Still IN_PROGRESS/VALIDATE server-side - only the local view changed.
    expect(sessionApi.fetchSession).toHaveBeenCalled()
  })

  it("returns to the Validate step when Cancel is clicked without saving", async () => {
    const page = await AppPage.render()

    page.clickButton("Edit details")
    await waitFor(() => {
      expect(page.queryLabel("Company name")).toBeInTheDocument()
    })

    page.clickButton("Cancel")

    await waitFor(() => {
      expect(page.text("Validate your Provider connection")).toBeInTheDocument()
    })
    expect(sessionApi.saveDetails).not.toHaveBeenCalled()
  })
})
