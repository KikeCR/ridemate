import { afterAll, beforeEach } from "vitest"
import { prisma } from "../src/db/prisma.js"

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "validations", "onboarding_sessions" RESTART IDENTITY CASCADE'
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})
