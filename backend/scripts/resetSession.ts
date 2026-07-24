import { prisma } from "../src/db/prisma.js"

async function main() {
  const { count: validationCount } = await prisma.validation.deleteMany()
  const { count: sessionCount } = await prisma.onboardingSession.deleteMany()
  console.log(
    `Cleared ${sessionCount} session(s) and ${validationCount} validation(s). Next GET /api/session will start fresh.`
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
