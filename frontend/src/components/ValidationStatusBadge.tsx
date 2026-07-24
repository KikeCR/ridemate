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
    className: "bg-slate-800 text-slate-300 border-slate-700",
  },
  VALID: {
    label: "Valid",
    icon: CheckCircle2,
    className: "bg-emerald-950 text-emerald-400 border-emerald-800",
  },
  PARTIAL: {
    label: "Valid with warnings",
    icon: AlertTriangle,
    className: "bg-amber-950 text-amber-400 border-amber-800",
  },
  INVALID: {
    label: "Invalid credentials",
    icon: XCircle,
    className: "bg-red-950 text-red-400 border-red-800",
  },
  UNAVAILABLE: {
    label: "Provider unavailable",
    icon: RefreshCw,
    className: "bg-sky-950 text-sky-400 border-sky-800",
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
