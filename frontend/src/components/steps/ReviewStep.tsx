import { PartyPopper, Pencil, Rocket } from "lucide-react"
import { useGoLiveMutation } from "../../hooks/useGoLiveMutation"
import { ValidationStatusBadge } from "../ValidationStatusBadge"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ReviewStepProps {
  session: SessionDto
  validation: ValidationDto | null
  onEditDetails: () => void
}

export function ReviewStep({ session, validation, onEditDetails }: ReviewStepProps) {
  const mutation = useGoLiveMutation()
  const isLive = session.status === "LIVE"

  if (isLive) {
    return (
      <div className="space-y-4 text-center">
        <PartyPopper size={32} className="mx-auto text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-900">You&apos;re live!</h2>
        <p className="text-sm text-slate-500">
          {session.companyName} is now connected and live on the platform.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <Rocket size={20} className="text-indigo-600" />
          <h2 className="text-lg font-semibold">Review & go live</h2>
        </div>
        <button
          type="button"
          onClick={onEditDetails}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Pencil size={14} />
          Edit details
        </button>
      </div>

      <dl className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Company</dt>
          <dd className="font-medium text-slate-900">{session.companyName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Account ID</dt>
          <dd className="font-mono text-slate-900">{session.accountId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Validation</dt>
          <dd>
            <ValidationStatusBadge status={validation?.status ?? "PENDING"} />
          </dd>
        </div>
      </dl>

      {validation?.warnings && validation.warnings.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {validation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {mutation.isError && (
        <p className="text-sm text-red-600">Could not go live. Please try again.</p>
      )}

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "Going live..." : "Go live"}
      </button>
    </div>
  )
}
