import { render, screen } from "@testing-library/react"
import { StepIndicator } from "../../components/StepIndicator"
import type { OnboardingStep } from "../../types/session"

interface StepIndicatorProps {
  currentStep: OnboardingStep
  isLive: boolean
}

export class StepIndicatorPage {
  static render(props: StepIndicatorProps) {
    render(<StepIndicator currentStep={props.currentStep} isLive={props.isLive} />)
    return new StepIndicatorPage()
  }

  label(text: string) {
    return screen.getByText(text)
  }

  stepState(step: OnboardingStep) {
    return screen.getByTestId(`step-circle-${step}`).getAttribute("data-state")
  }
}
