-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'LIVE');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('DETAILS', 'VALIDATE', 'REVIEW');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALID', 'PARTIAL', 'INVALID', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "onboarding_sessions" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'DETAILS',
    "companyName" TEXT,
    "accountId" TEXT,
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB,
    "warnings" JSONB,
    "reason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "validatedAccountId" TEXT,
    "validatedApiKeyHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_sessions_partnerId_key" ON "onboarding_sessions"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "validations_sessionId_key" ON "validations"("sessionId");

-- AddForeignKey
ALTER TABLE "validations" ADD CONSTRAINT "validations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "onboarding_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
