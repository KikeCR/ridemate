export type ProviderValidationStatus = "valid" | "partial" | "invalid"

export interface ProviderValidationItem {
  /** Stable identifier a caller can reference later (e.g. to retry just this item). */
  id: string
  /** Human-readable name, e.g. "Account lookup". */
  label: string
  passed: boolean
  /** Whether this item can be individually retried. Always false once passed. */
  retryable: boolean
  /** Present only when the item failed. */
  message?: string
}

export interface ProviderPagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ProviderResult {
  status: ProviderValidationStatus
  items: ProviderValidationItem[]
  pagination: ProviderPagination
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

export interface ProviderValidateOptions {
  page?: number
  pageSize?: number
}

export interface Provider {
  validate(
    accountId: string,
    apiKey: string,
    options?: ProviderValidateOptions
  ): Promise<ProviderResult>
}
