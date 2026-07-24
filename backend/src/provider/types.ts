export type ProviderValidationStatus = "valid" | "partial" | "invalid"

export interface ProviderValidationItem {
  key: string
  passed: boolean
  message?: string
}

export interface ProviderResult {
  status: ProviderValidationStatus
  items: ProviderValidationItem[]
  warnings?: string[]
  reason?: string
}

/**
 * Thrown for transient/unreachable failures (the acc-unavailable path).
 * Never thrown for bad credentials - that's a resolved "invalid" result.
 */
export class ProviderUnavailableError extends Error {
  constructor(message = "Provider unavailable") {
    super(message)
    this.name = "ProviderUnavailableError"
  }
}

export interface Provider {
  validate(accountId: string, apiKey: string): Promise<ProviderResult>
}
