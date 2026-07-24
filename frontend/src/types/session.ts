export type SessionStatus = "IN_PROGRESS" | "LIVE"
export type OnboardingStep = "DETAILS" | "VALIDATE" | "REVIEW"
export type ValidationStatus = "PENDING" | "VALID" | "PARTIAL" | "INVALID" | "UNAVAILABLE"

export interface SessionDto {
  id: string
  partnerId: string
  status: SessionStatus
  currentStep: OnboardingStep
  companyName: string | null
  accountId: string | null
  hasApiKey: boolean
  createdAt: string
  updatedAt: string
}

export interface ValidationItemDto {
  key: string
  passed: boolean
  message?: string
}

export interface ValidationDto {
  status: ValidationStatus
  items: ValidationItemDto[]
  warnings: string[]
  reason: string | null
  attempts: number
  lastAttemptAt: string | null
}

export interface SessionEnvelope {
  session: SessionDto
  validation: ValidationDto | null
}

export interface DetailsPayload {
  companyName: string
  accountId: string
  apiKey: string
}

export interface ValidatePayload {
  forceRetry?: boolean
}
