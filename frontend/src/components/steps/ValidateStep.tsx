import { Pencil, RotateCw, ShieldCheck } from "lucide-react"
import { useValidateMutation } from "../../hooks/useValidateMutation"
import { useRetryItemMutation } from "../../hooks/useRetryItemMutation"
import { ValidationStatusBadge } from "../ValidationStatusBadge"
import type { SessionDto, ValidationDto } from "../../types/session"

interface ValidateStepProps {
  session: SessionDto
  validation: ValidationDto | null
  onEditDetails: () => void
}

export function ValidateStep({ session, validation, onEditDetails }: ValidateStepProps) {
  const mutation = useValidateMutation()
  const retryItemMutation = useRetryItemMutation()
  const status = validation?.status ?? "PENDING"
  const hasRun = validation !== null

  function handleValidate() {
    mutation.mutate({ forceRetry: hasRun })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <ShieldCheck size={20} className="text-indigo-400" />
          <h2 className="text-lg font-semibold">Validate your Provider connection</h2>
        </div>
        <button
          type="button"
          onClick={onEditDetails}
          className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          <Pencil size={14} />
          Edit details
        </button>
      </div>
      <p className="text-sm text-slate-400">
        We&apos;ll check the credentials for account{" "}
        <span className="font-mono text-slate-300">{session.accountId}</span> against the
        Provider.
      </p>

      <ValidationStatusBadge status={status} />

      {validation?.reason && (
        <p className="rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
          {validation.reason}
        </p>
      )}

      {validation && validation.items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {validation.items.map((item) => {
            const isRetryingThisItem =
              retryItemMutation.isPending && retryItemMutation.variables === item.id
            return (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={item.passed ? "text-emerald-400" : "text-red-400"}>
                    {item.passed ? "✓" : "✗"}
                  </span>
                  <span className="text-slate-300">{item.message ?? item.label}</span>
                </div>
                {item.retryable && (
                  <button
                    type="button"
                    onClick={() => retryItemMutation.mutate(item.id)}
                    disabled={isRetryingThisItem}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-60"
                  >
                    <RotateCw
                      size={12}
                      className={isRetryingThisItem ? "animate-spin" : ""}
                    />
                    {isRetryingThisItem ? "Retrying..." : "Retry"}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {mutation.isError && (
        <p className="text-sm text-red-400">
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
