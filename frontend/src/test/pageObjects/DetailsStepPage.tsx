import { fireEvent, screen } from "@testing-library/react"
import { renderWithQueryClient } from "../renderWithQueryClient"
import { DetailsStep } from "../../components/steps/DetailsStep"
import type { DetailsPayload, SessionDto } from "../../types/session"

export class DetailsStepPage {
  static render(session: SessionDto) {
    renderWithQueryClient(<DetailsStep session={session} />)
    return new DetailsStepPage()
  }

  get companyNameInput() {
    return screen.getByLabelText("Company name")
  }

  get accountIdInput() {
    return screen.getByLabelText("Provider account ID")
  }

  get apiKeyInput() {
    return screen.getByLabelText("Provider API key")
  }

  get submitButton() {
    return screen.getByRole("button", { name: /save & continue|saving/i })
  }

  get errorMessage() {
    return screen.queryByText("Could not save details. Please try again.")
  }

  fillCompanyName(value: string) {
    fireEvent.change(this.companyNameInput, { target: { value } })
    return this
  }

  fillAccountId(value: string) {
    fireEvent.change(this.accountIdInput, { target: { value } })
    return this
  }

  fillApiKey(value: string) {
    fireEvent.change(this.apiKeyInput, { target: { value } })
    return this
  }

  submit() {
    fireEvent.click(this.submitButton)
    return this
  }

  fillAndSubmit(details: DetailsPayload) {
    return this.fillCompanyName(details.companyName)
      .fillAccountId(details.accountId)
      .fillApiKey(details.apiKey)
      .submit()
  }
}
