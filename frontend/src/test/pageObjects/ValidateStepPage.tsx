import { fireEvent, screen } from "@testing-library/react"
import { vi } from "vitest"
import { renderWithQueryClient } from "../renderWithQueryClient"
import { ValidateStep } from "../../components/steps/ValidateStep"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ValidateStepProps {
  session: SessionDto
  validation: ValidationDto | null
  onEditDetails?: () => void
}

export class ValidateStepPage {
  readonly onEditDetails: ReturnType<typeof vi.fn>

  private constructor(onEditDetails: ReturnType<typeof vi.fn>) {
    this.onEditDetails = onEditDetails
  }

  static render(props: ValidateStepProps) {
    const onEditDetails = vi.fn(props.onEditDetails)
    renderWithQueryClient(
      <ValidateStep
        session={props.session}
        validation={props.validation}
        onEditDetails={onEditDetails}
      />
    )
    return new ValidateStepPage(onEditDetails)
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

  retryItemButton() {
    return screen.getByRole("button", { name: /^retry$/i })
  }

  clickAction() {
    fireEvent.click(this.actionButton)
    return this
  }

  clickEditDetails() {
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }))
    return this
  }

  clickRetryItem() {
    fireEvent.click(this.retryItemButton())
    return this
  }
}
