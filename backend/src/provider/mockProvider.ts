import type { Provider, ProviderResult } from "./types.js"
import { ProviderUnavailableError } from "./types.js"

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockProvider implements Provider {
  async validate(accountId: string, _apiKey: string): Promise<ProviderResult> {
    await delay(50)

    switch (accountId) {
      case "acc-valid":
        return {
          status: "valid",
          items: [
            { key: "account-lookup", passed: true },
            { key: "credentials", passed: true },
          ],
        }
      case "acc-partial":
        return {
          status: "partial",
          items: [
            { key: "account-lookup", passed: true },
            {
              key: "billing-profile",
              passed: false,
              message: "Billing profile incomplete",
            },
          ],
          warnings: [
            "Billing profile incomplete; you can go live but we recommend following up.",
          ],
        }
      case "acc-invalid":
        return {
          status: "invalid",
          items: [{ key: "credentials", passed: false, message: "Credentials rejected" }],
          reason: "Invalid API key for the given account.",
        }
      case "acc-unavailable":
        throw new ProviderUnavailableError("Simulated provider timeout")
      default:
        // A provider shouldn't vouch for an account it has no record of -
        // fail closed rather than defaulting to valid for arbitrary input.
        return {
          status: "invalid",
          items: [],
          reason: "Unrecognized account.",
        }
    }
  }
}
