import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import type { ValidationStatus } from "../types/session"

interface StatusConfig {
  label: string
  icon: LucideIcon
  className: string
}

const STATUS_CONFIG: Record<ValidationStatus, StatusConfig> = {
  PENDING: {
    label: "Not yet validated",
    icon: Clock,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  VALID: {
    label: "Valid",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PARTIAL: {
    label: "Valid with warnings",
    icon: AlertTriangle,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INVALID: {
    label: "Invalid credentials",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  UNAVAILABLE: {
    label: "Provider unavailable",
    icon: RefreshCw,
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
}

interface ValidationStatusBadgeProps {
  status: ValidationStatus
}

export function ValidationStatusBadge({ status }: ValidationStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      data-testid="validation-status-badge"
      data-status={status}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}
    >
      <Icon size={16} />
      {config.label}
    </span>
  )
}
