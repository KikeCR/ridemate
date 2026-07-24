import { vi } from "vitest"
import type { PrismaClient } from "@prisma/client"
import { buildApp } from "../../src/app.js"
import { prisma as defaultPrisma } from "../../src/db/prisma.js"
import { MockProvider } from "../../src/provider/mockProvider.js"
import type { Provider } from "../../src/provider/types.js"

export function buildTestApp(
  provider: Provider = new MockProvider(),
  prisma: PrismaClient = defaultPrisma
) {
  const validateSpy = vi.spyOn(provider, "validate")
  const app = buildApp({ prisma, provider })
  return { app, provider, validateSpy }
}
