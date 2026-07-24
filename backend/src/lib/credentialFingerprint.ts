import { sha256 } from "./hash.js"

export interface CredentialFingerprint {
  accountId: string
  apiKeyHash: string
}

export interface StoredFingerprint {
  validatedAccountId: string | null
  validatedApiKeyHash: string | null
}

/**
 * Fingerprints the credentials a Provider call was (or would be) run against,
 * so a later call can detect whether they've changed without ever storing or
 * comparing the raw apiKey again.
 */
export function computeFingerprint(
  accountId: string,
  apiKey: string
): CredentialFingerprint {
  return { accountId, apiKeyHash: sha256(apiKey) }
}

/** True when `stored` reflects the same credentials as `fingerprint`. */
export function fingerprintMatches(
  fingerprint: CredentialFingerprint,
  stored: StoredFingerprint
): boolean {
  return (
    stored.validatedAccountId === fingerprint.accountId &&
    stored.validatedApiKeyHash === fingerprint.apiKeyHash
  )
}
