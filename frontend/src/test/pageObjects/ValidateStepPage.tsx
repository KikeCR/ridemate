import { fireEvent, screen } from "@testing-library/react"
import { renderWithQueryClient } from "../renderWithQueryClient"
import { ValidateStep } from "../../components/steps/ValidateStep"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ValidateStepProps {
  session: SessionDto
  validation: ValidationDto | null
}

export class ValidateStepPage {
  static render(props: ValidateStepProps) {
    renderWithQueryClient(
      <ValidateStep session={props.session} validation={props.validation} />
    )
    return new ValidateStepPage()
  }

  get badge() {
    return screen.getByTestId("validation-status-badge")
  }

  get actionButton() {
    return screen.getByRole("button", {
      name: /validate credentials|retry validation|validating/i,
    })
  }

  get errorMessage() {
    return screen.queryByText("Something went wrong while validating. Please try again.")
  }

  text(value: string) {
    return screen.getByText(value)
  }

  queryText(value: string) {
    return screen.queryByText(value)
  }

  clickAction() {
    fireEvent.click(this.actionButton)
    return this
  }
}
