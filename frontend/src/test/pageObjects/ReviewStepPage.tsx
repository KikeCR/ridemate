import { fireEvent, screen } from "@testing-library/react"
import { renderWithQueryClient } from "../renderWithQueryClient"
import { ReviewStep } from "../../components/steps/ReviewStep"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ReviewStepProps {
  session: SessionDto
  validation: ValidationDto | null
}

export class ReviewStepPage {
  static render(props: ReviewStepProps) {
    renderWithQueryClient(
      <ReviewStep session={props.session} validation={props.validation} />
    )
    return new ReviewStepPage()
  }

  get goLiveButton() {
    return screen.queryByRole("button", { name: "Go live" })
  }

  get liveMessage() {
    return screen.queryByText("You're live!")
  }

  text(value: string) {
    return screen.getByText(value)
  }

  clickGoLive() {
    fireEvent.click(screen.getByRole("button", { name: "Go live" }))
    return this
  }
}
