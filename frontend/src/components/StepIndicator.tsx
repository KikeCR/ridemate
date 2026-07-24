import { Check } from "lucide-react"
import type { OnboardingStep } from "../types/session"

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: "DETAILS", label: "Details" },
  { key: "VALIDATE", label: "Validate" },
  { key: "REVIEW", label: "Review & go live" },
]

interface StepIndicatorProps {
  currentStep: OnboardingStep
  isLive: boolean
}

export function StepIndicator({ currentStep, isLive }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep)

  return (
    <ol className="mb-8 flex items-center" data-testid="step-indicator">
      {STEPS.map((step, index) => {
        const isCompleted = isLive || index < currentIndex
        const isCurrent = !isLive && index === currentIndex

        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                data-testid={`step-circle-${step.key}`}
                data-state={
                  isCompleted ? "completed" : isCurrent ? "current" : "upcoming"
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  isCompleted
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : isCurrent
                      ? "border-indigo-600 text-indigo-600"
                      : "border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  isCompleted ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
