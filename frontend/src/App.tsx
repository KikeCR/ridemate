import { Loader2, TriangleAlert } from "lucide-react"
import { useSessionQuery } from "./hooks/useSessionQuery"
import { Layout } from "./components/Layout"
import { StepIndicator } from "./components/StepIndicator"
import { DetailsStep } from "./components/steps/DetailsStep"
import { ValidateStep } from "./components/steps/ValidateStep"
import { ReviewStep } from "./components/steps/ReviewStep"

function App() {
  const { data, isLoading, isError } = useSessionQuery()

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Loading your session...
        </div>
      </Layout>
    )
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <TriangleAlert size={20} />
          Could not reach the onboarding service.
        </div>
      </Layout>
    )
  }

  const { session, validation } = data

  return (
    <Layout>
      <StepIndicator
        currentStep={session.currentStep}
        isLive={session.status === "LIVE"}
      />
      {session.currentStep === "DETAILS" && <DetailsStep session={session} />}
      {session.currentStep === "VALIDATE" && (
        <ValidateStep session={session} validation={validation} />
      )}
      {session.currentStep === "REVIEW" && (
        <ReviewStep session={session} validation={validation} />
      )}
    </Layout>
  )
}

export default App
