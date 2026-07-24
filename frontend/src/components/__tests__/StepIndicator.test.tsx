import { describe, expect, it } from "vitest"
import { StepIndicatorPage } from "../../test/pageObjects/StepIndicatorPage"

describe("StepIndicator", () => {
  it("renders all three step labels", () => {
    const page = StepIndicatorPage.render({ currentStep: "DETAILS", isLive: false })

    expect(page.label("Details")).toBeInTheDocument()
    expect(page.label("Validate")).toBeInTheDocument()
    expect(page.label("Review & go live")).toBeInTheDocument()
  })

  it("marks the current step and leaves later steps upcoming", () => {
    const page = StepIndicatorPage.render({ currentStep: "VALIDATE", isLive: false })

    expect(page.stepState("DETAILS")).toBe("completed")
    expect(page.stepState("VALIDATE")).toBe("current")
    expect(page.stepState("REVIEW")).toBe("upcoming")
  })

  it("marks every step completed once the session is live", () => {
    const page = StepIndicatorPage.render({ currentStep: "REVIEW", isLive: true })

    expect(page.stepState("DETAILS")).toBe("completed")
    expect(page.stepState("VALIDATE")).toBe("completed")
    expect(page.stepState("REVIEW")).toBe("completed")
  })
})
