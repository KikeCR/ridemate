import type {
  OnboardingSession,
  OnboardingStep,
  Prisma,
  PrismaClient,
  Validation,
  ValidationStatus,
} from "@prisma/client"
import { computeFingerprint, fingerprintMatches } from "../lib/credentialFingerprint.js"
import { PARTNER_ID } from "../lib/partner.js"
import { BadRequestError, InvalidStateError, NotFoundError } from "../lib/errors.js"
import type {
  Provider,
  ProviderValidationItem,
  ProviderValidationStatus,
} from "../provider/types.js"
import { ProviderUnavailableError } from "../provider/types.js"
import type { DetailsBody } from "../schemas/details.js"
import type { ValidateBody } from "../schemas/validate.js"

const PROVIDER_STATUS_MAP: Record<ProviderValidationStatus, ValidationStatus> = {
  valid: "VALID",
  partial: "PARTIAL",
  invalid: "INVALID",
}

const LIVE_ELIGIBLE_STATUSES: ValidationStatus[] = ["VALID", "PARTIAL"]

export interface SessionEnvelope {
  session: {
    id: string
    partnerId: string
    status: string
    currentStep: string
    companyName: string | null
    accountId: string | null
    hasApiKey: boolean
    createdAt: string
    updatedAt: string
  }
  validation: {
    status: string
    items: unknown
    warnings: unknown
    reason: string | null
    attempts: number
    lastAttemptAt: string | null
  } | null
}

function serialize(
  session: OnboardingSession,
  validation: Validation | null
): SessionEnvelope {
  return {
    session: {
      id: session.id,
      partnerId: session.partnerId,
      status: session.status,
      currentStep: session.currentStep,
      companyName: session.companyName,
      accountId: session.accountId,
      hasApiKey: Boolean(session.apiKey),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    },
    validation: validation
      ? {
          status: validation.status,
          items: validation.items,
          warnings: validation.warnings,
          reason: validation.reason,
          attempts: validation.attempts,
          lastAttemptAt: validation.lastAttemptAt
            ? validation.lastAttemptAt.toISOString()
            : null,
        }
      : null,
  }
}

export class SessionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provider: Provider
  ) {}

  async getOrCreateSession(): Promise<SessionEnvelope> {
    const session = await this.getOrCreateSessionRow()
    const validation = await this.prisma.validation.findUnique({
      where: { sessionId: session.id },
    })
    return serialize(session, validation)
  }

  async saveDetails(body: DetailsBody): Promise<SessionEnvelope> {
    const session = await this.getOrCreateSessionRow()
    if (session.status === "LIVE") {
      throw new InvalidStateError("Cannot edit details after go-live.")
    }

    const updated = await this.prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        companyName: body.companyName,
        accountId: body.accountId,
        apiKey: body.apiKey,
        currentStep: "VALIDATE",
      },
    })
    const validation = await this.prisma.validation.findUnique({
      where: { sessionId: updated.id },
    })
    return serialize(updated, validation)
  }

  async validateSession(body: ValidateBody): Promise<SessionEnvelope> {
    const session = await this.getOrCreateSessionRow()
    if (!session.accountId || !session.apiKey) {
      throw new BadRequestError("Save company details and credentials before validating.")
    }

    const existing = await this.prisma.validation.findUnique({
      where: { sessionId: session.id },
    })
    const fingerprint = computeFingerprint(session.accountId, session.apiKey)

    const shouldCallProvider =
      !existing ||
      !fingerprintMatches(fingerprint, existing) ||
      existing.status === "UNAVAILABLE" ||
      body.forceRetry === true

    if (!shouldCallProvider && existing) {
      return serialize(session, existing)
    }

    const attempts = (existing?.attempts ?? 0) + 1
    const lastAttemptAt = new Date()
    let nextStep: OnboardingStep = session.currentStep

    let status: ValidationStatus
    let items: ProviderValidationItem[] = []
    let warnings: string[] = []
    let reason: string | null = null

    try {
      const result = await this.provider.validate(session.accountId, session.apiKey)
      status = PROVIDER_STATUS_MAP[result.status]
      items = result.items
      warnings = result.warnings ?? []
      reason = result.reason ?? null
      if (result.status === "valid" || result.status === "partial") {
        nextStep = "REVIEW"
      }
    } catch (err) {
      if (!(err instanceof ProviderUnavailableError)) {
        throw err
      }
      status = "UNAVAILABLE"
      reason = err.message
    }

    const validationData = {
      status,
      items: items as unknown as Prisma.InputJsonValue,
      warnings: warnings as unknown as Prisma.InputJsonValue,
      reason,
      attempts,
      lastAttemptAt,
      validatedAccountId: fingerprint.accountId,
      validatedApiKeyHash: fingerprint.apiKeyHash,
    }

    const [updatedSession, updatedValidation] = await this.prisma.$transaction([
      this.prisma.onboardingSession.update({
        where: { id: session.id },
        data: { currentStep: nextStep },
      }),
      this.prisma.validation.upsert({
        where: { sessionId: session.id },
        create: { sessionId: session.id, ...validationData },
        update: validationData,
      }),
    ])

    return serialize(updatedSession, updatedValidation)
  }

  /**
   * Re-checks a single failed item without re-running the full validation.
   * The mock provider has no true single-item lookup, so this re-calls
   * validate() and only splices the matching item back into the stored
   * list - the overall validation.status stays whatever the last full
   * validate() call produced; use forceRetry on /validate to refresh that.
   */
  async retryItem(itemId: string): Promise<SessionEnvelope> {
    const session = await this.getOrCreateSessionRow()
    if (!session.accountId || !session.apiKey) {
      throw new BadRequestError("Save company details and credentials before validating.")
    }

    const existing = await this.prisma.validation.findUnique({
      where: { sessionId: session.id },
    })
    if (!existing) {
      throw new BadRequestError("Run a validation before retrying an individual item.")
    }

    const existingItems =
      (existing.items as unknown as ProviderValidationItem[] | null) ?? []
    if (!existingItems.some((item) => item.id === itemId)) {
      throw new NotFoundError(`No validation item found with id "${itemId}".`)
    }

    let updatedItems = existingItems
    try {
      const result = await this.provider.validate(session.accountId, session.apiKey)
      const refreshedItem = result.items.find((item) => item.id === itemId)
      if (refreshedItem) {
        updatedItems = existingItems.map((item) =>
          item.id === itemId ? refreshedItem : item
        )
      }
    } catch (err) {
      if (!(err instanceof ProviderUnavailableError)) {
        throw err
      }
      // Transient failure: keep the item's last known result, but still
      // record that a retry was attempted below.
    }

    const updatedValidation = await this.prisma.validation.update({
      where: { sessionId: session.id },
      data: {
        items: updatedItems as unknown as Prisma.InputJsonValue,
        attempts: existing.attempts + 1,
        lastAttemptAt: new Date(),
      },
    })

    return serialize(session, updatedValidation)
  }

  async goLive(): Promise<SessionEnvelope> {
    const session = await this.getOrCreateSessionRow()

    if (session.status === "LIVE") {
      const validation = await this.prisma.validation.findUnique({
        where: { sessionId: session.id },
      })
      return serialize(session, validation)
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const validation = await tx.validation.findUnique({
        where: { sessionId: session.id },
      })
      if (!validation || !LIVE_ELIGIBLE_STATUSES.includes(validation.status)) {
        throw new InvalidStateError(
          "Validation must be VALID or PARTIAL before going live.",
          { validationStatus: validation?.status ?? null }
        )
      }

      const updatedSession = await tx.onboardingSession.update({
        where: { id: session.id },
        data: { status: "LIVE" },
      })

      return { session: updatedSession, validation }
    })

    return serialize(result.session, result.validation)
  }

  private async getOrCreateSessionRow(): Promise<OnboardingSession> {
    const existing = await this.prisma.onboardingSession.findUnique({
      where: { partnerId: PARTNER_ID },
    })
    if (existing) {
      return existing
    }
    return this.prisma.onboardingSession.upsert({
      where: { partnerId: PARTNER_ID },
      create: { partnerId: PARTNER_ID },
      update: {},
    })
  }
}
