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
  const lastIndex = STEPS.length - 1

  return (
    <ol className="mb-12 flex" data-testid="step-indicator">
      {STEPS.map((step, index) => {
        const isCompleted = isLive || index < currentIndex
        const isCurrent = !isLive && index === currentIndex
        // Anchor the label to the circle's own box (not the li, which also
        // holds the flex-grown connector line), and pin first/last labels to
        // one edge so they extend inward instead of overflowing the card.
        const labelAlignment =
          index === 0
            ? "left-0"
            : index === lastIndex
              ? "right-0"
              : "left-1/2 -translate-x-1/2"

        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="relative shrink-0">
              <div
                data-testid={`step-circle-${step.key}`}
                data-state={
                  isCompleted ? "completed" : isCurrent ? "current" : "upcoming"
                }
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  isCompleted
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : isCurrent
                      ? "border-indigo-600 text-indigo-400"
                      : "border-slate-700 text-slate-600"
                }`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              {/* Absolutely positioned so its width never affects row height
                  or the flex sizing of neighboring circles/lines. */}
              <span
                className={`absolute top-full mt-1.5 w-max text-xs font-medium ${labelAlignment} ${
                  isCompleted || isCurrent ? "text-slate-100" : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < lastIndex && (
              <div
                className={`mx-2 h-0.5 flex-1 ${isCompleted ? "bg-indigo-600" : "bg-slate-700"}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
