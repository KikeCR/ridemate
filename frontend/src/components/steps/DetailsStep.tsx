import { useState, type FormEvent } from "react"
import { Building2 } from "lucide-react"
import { useSaveDetailsMutation } from "../../hooks/useSaveDetailsMutation"
import type { SessionDto } from "../../types/session"

interface DetailsStepProps {
  session: SessionDto
  /** Called after a successful save - only relevant when editing from a later step. */
  onSaved?: () => void
  /** When present, renders a "Cancel" action (i.e. we're editing from VALIDATE/REVIEW). */
  onCancel?: () => void
}

export function DetailsStep({ session, onSaved, onCancel }: DetailsStepProps) {
  const [companyName, setCompanyName] = useState(session.companyName ?? "")
  const [accountId, setAccountId] = useState(session.accountId ?? "")
  const [apiKey, setApiKey] = useState("")

  const mutation = useSaveDetailsMutation()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ companyName, accountId, apiKey }, { onSuccess: () => onSaved?.() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 text-slate-100">
        <Building2 size={20} className="text-indigo-400" />
        <h2 className="text-lg font-semibold">Company & Provider details</h2>
      </div>
      <p className="text-sm text-slate-400">
        Tell us about your company and connect your Provider account so we can validate it
        in the next step.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="companyName" className="text-sm font-medium text-slate-300">
          Company name
        </label>
        <input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Acme Co"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="accountId" className="text-sm font-medium text-slate-300">
          Provider account ID
        </label>
        <input
          id="accountId"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="acc-valid"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="apiKey" className="text-sm font-medium text-slate-300">
          Provider API key
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Enter your Provider API key"
        />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-400">Could not save details. Please try again.</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending
            ? "Saving..."
            : onCancel
              ? "Save changes"
              : "Save & continue"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
