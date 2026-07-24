import { useState } from "react"
import { Loader2, TriangleAlert } from "lucide-react"
import { useSessionQuery } from "./hooks/useSessionQuery"
import { Layout } from "./components/Layout"
import { StepIndicator } from "./components/StepIndicator"
import { DetailsStep } from "./components/steps/DetailsStep"
import { ValidateStep } from "./components/steps/ValidateStep"
import { ReviewStep } from "./components/steps/ReviewStep"

function App() {
  const { data, isLoading, isError } = useSessionQuery()
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading your session...
        </div>
      </Layout>
    )
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center gap-2 py-12 text-red-400">
          <TriangleAlert size={20} />
          Could not reach the onboarding service.
        </div>
      </Layout>
    )
  }

  const { session, validation } = data
  // isEditingDetails is a transient UI toggle, not a step tracker: it never
  // overrides which step is canonical, and a reload always resets it to
  // false, so resumability still lands on session.currentStep exactly.
  const showDetailsForm = session.currentStep === "DETAILS" || isEditingDetails

  return (
    <Layout>
      <StepIndicator
        currentStep={session.currentStep}
        isLive={session.status === "LIVE"}
      />
      {showDetailsForm && (
        <DetailsStep
          session={session}
          onSaved={() => setIsEditingDetails(false)}
          onCancel={isEditingDetails ? () => setIsEditingDetails(false) : undefined}
        />
      )}
      {!showDetailsForm && session.currentStep === "VALIDATE" && (
        <ValidateStep
          session={session}
          validation={validation}
          onEditDetails={() => setIsEditingDetails(true)}
        />
      )}
      {!showDetailsForm && session.currentStep === "REVIEW" && (
        <ReviewStep
          session={session}
          validation={validation}
          onEditDetails={() => setIsEditingDetails(true)}
        />
      )}
    </Layout>
  )
}

export default App
