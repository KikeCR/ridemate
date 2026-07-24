import { fireEvent, screen } from "@testing-library/react"
import { vi } from "vitest"
import { renderWithQueryClient } from "../renderWithQueryClient"
import { ReviewStep } from "../../components/steps/ReviewStep"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ReviewStepProps {
  session: SessionDto
  validation: ValidationDto | null
  onEditDetails?: () => void
}

export class ReviewStepPage {
  readonly onEditDetails: ReturnType<typeof vi.fn>

  private constructor(onEditDetails: ReturnType<typeof vi.fn>) {
    this.onEditDetails = onEditDetails
  }

  static render(props: ReviewStepProps) {
    const onEditDetails = vi.fn(props.onEditDetails)
    renderWithQueryClient(
      <ReviewStep
        session={props.session}
        validation={props.validation}
        onEditDetails={onEditDetails}
      />
    )
    return new ReviewStepPage(onEditDetails)
  }

  get goLiveButton() {
    return screen.queryByRole("button", { name: "Go live" })
  }

  get liveMessage() {
    return screen.queryByText("You're live!")
  }

  get editDetailsButton() {
    return screen.queryByRole("button", { name: "Edit details" })
  }

  text(value: string) {
    return screen.getByText(value)
  }

  clickGoLive() {
    fireEvent.click(screen.getByRole("button", { name: "Go live" }))
    return this
  }

  clickEditDetails() {
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }))
    return this
  }
}
