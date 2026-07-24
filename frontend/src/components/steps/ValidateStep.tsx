import { ShieldCheck } from "lucide-react"
import { useValidateMutation } from "../../hooks/useValidateMutation"
import { ValidationStatusBadge } from "../ValidationStatusBadge"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ValidateStepProps {
  session: SessionDto
  validation: ValidationDto | null
}

export function ValidateStep({ session, validation }: ValidateStepProps) {
  const mutation = useValidateMutation()
  const status = validation?.status ?? "PENDING"
  const hasRun = validation !== null

  function handleValidate() {
    mutation.mutate({ forceRetry: hasRun })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-slate-900">
        <ShieldCheck size={20} className="text-indigo-600" />
        <h2 className="text-lg font-semibold">Validate your Provider connection</h2>
      </div>
      <p className="text-sm text-slate-500">
        We&apos;ll check the credentials for account{" "}
        <span className="font-mono text-slate-700">{session.accountId}</span> against the
        Provider.
      </p>

      <ValidationStatusBadge status={status} />

      {validation?.reason && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {validation.reason}
        </p>
      )}

      {validation && validation.items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {validation.items.map((item) => (
            <li key={item.key} className="flex items-center gap-2">
              <span className={item.passed ? "text-emerald-600" : "text-red-600"}>
                {item.passed ? "✓" : "✗"}
              </span>
              <span className="text-slate-700">{item.message ?? item.key}</span>
            </li>
          ))}
        </ul>
      )}

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Something went wrong while validating. Please try again.
        </p>
      )}

      <button
        type="button"
        onClick={handleValidate}
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending
          ? "Validating..."
          : hasRun
            ? "Retry validation"
            : "Validate credentials"}
      </button>
    </div>
  )
}
