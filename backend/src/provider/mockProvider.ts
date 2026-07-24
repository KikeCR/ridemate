import type {
  Provider,
  ProviderResult,
  ProviderValidateOptions,
  ProviderValidationItem,
} from "./types.js"
import { ProviderUnavailableError } from "./types.js"

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DEFAULT_PAGE_SIZE = 20
const SIMULATED_LATENCY_MS = 50

/** Mock account IDs the demo Provider recognizes - drives the switch below. */
const MOCK_ACCOUNT_IDS = {
  VALID: "acc-valid",
  PARTIAL: "acc-partial",
  INVALID: "acc-invalid",
  UNAVAILABLE: "acc-unavailable",
} as const

/**
 * Slices a full item list into the requested page. The mock's item lists are
 * small enough to always fit on page 1 at the default page size - callers
 * that want to see pagination in action (e.g. the /provider/validate route)
 * can pass a smaller pageSize explicitly.
 */
function paginate(
  items: ProviderValidationItem[],
  options?: ProviderValidateOptions
): Pick<ProviderResult, "items" | "pagination"> {
  const pageSize =
    options?.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = options?.page && options.page > 0 ? Math.min(options.page, totalPages) : 1
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    pagination: { page, pageSize, totalItems, totalPages },
  }
}

export class MockProvider implements Provider {
  async validate(
    accountId: string,
    _apiKey: string,
    options?: ProviderValidateOptions
  ): Promise<ProviderResult> {
    await delay(SIMULATED_LATENCY_MS)

    switch (accountId) {
      case MOCK_ACCOUNT_IDS.VALID: {
        const allItems: ProviderValidationItem[] = [
          {
            id: "account-lookup",
            label: "Account lookup",
            passed: true,
            retryable: false,
          },
          { id: "credentials", label: "Credentials", passed: true, retryable: false },
        ]
        return { status: "valid", ...paginate(allItems, options) }
      }
      case MOCK_ACCOUNT_IDS.PARTIAL: {
        const allItems: ProviderValidationItem[] = [
          {
            id: "account-lookup",
            label: "Account lookup",
            passed: true,
            retryable: false,
          },
          {
            id: "billing-profile",
            label: "Billing profile",
            passed: false,
            retryable: true,
            message: "Billing profile incomplete",
          },
          {
            id: "fleet-sync",
            label: "Fleet sync",
            passed: false,
            retryable: true,
            message: "Fleet sync is still pending on the provider side",
          },
        ]
        return {
          status: "partial",
          ...paginate(allItems, options),
          warnings: [
            "Billing profile incomplete; you can go live but we recommend following up.",
            "Fleet sync is still pending on the provider side.",
          ],
        }
      }
      case MOCK_ACCOUNT_IDS.INVALID: {
        const allItems: ProviderValidationItem[] = [
          {
            id: "credentials",
            label: "Credentials",
            passed: false,
            retryable: true,
            message: "Credentials rejected",
          },
        ]
        return {
          status: "invalid",
          ...paginate(allItems, options),
          reason: "Invalid API key for the given account.",
        }
      }
      case MOCK_ACCOUNT_IDS.UNAVAILABLE:
        throw new ProviderUnavailableError("Simulated provider timeout")
      default:
        // A provider shouldn't vouch for an account it has no record of -
        // fail closed rather than defaulting to valid for arbitrary input.
        return {
          status: "invalid",
          ...paginate([], options),
          reason: "Unrecognized account.",
        }
    }
  }
}
