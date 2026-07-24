import { render, screen } from "@testing-library/react"
import { ValidationStatusBadge } from "../../components/ValidationStatusBadge"
import type { ValidationStatus } from "../../types/session"

export class ValidationStatusBadgePage {
  static render(status: ValidationStatus) {
    render(<ValidationStatusBadge status={status} />)
    return new ValidationStatusBadgePage()
  }

  get badge() {
    return screen.getByTestId("validation-status-badge")
  }
}
