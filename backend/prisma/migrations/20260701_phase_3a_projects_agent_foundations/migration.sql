-- CreateEnum
CREATE TYPE "ProjectTrackingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('PENDING', 'CONNECTED', 'PAUSED', 'REVOKED');

-- AlterEnum
ALTER TYPE "GitProvider" ADD VALUE IF NOT EXISTS 'LOCAL';

-- AlterTable
ALTER TABLE "repos"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "localAlias" TEXT,
  ADD COLUMN "trackingStatus" "ProjectTrackingStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "ignoredPatterns" JSONB,
  ADD COLUMN "includeFilePathsInReports" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "excludedFromReports" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "agent_link_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "deviceLabel" TEXT,
  "osFamily" TEXT,
  "agentVersion" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agent_link_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_installations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceLabel" TEXT NOT NULL,
  "osFamily" TEXT,
  "agentVersion" TEXT,
  "status" "AgentStatus" NOT NULL DEFAULT 'PENDING',
  "tokenHash" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "agent_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_link_requests_codeHash_key" ON "agent_link_requests"("codeHash");

-- CreateIndex
CREATE INDEX "agent_link_requests_userId_idx" ON "agent_link_requests"("userId");

-- CreateIndex
CREATE INDEX "agent_link_requests_expiresAt_idx" ON "agent_link_requests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_installations_tokenHash_key" ON "agent_installations"("tokenHash");

-- CreateIndex
CREATE INDEX "agent_installations_userId_idx" ON "agent_installations"("userId");

-- CreateIndex
CREATE INDEX "agent_installations_status_idx" ON "agent_installations"("status");

-- AddForeignKey
ALTER TABLE "agent_link_requests" ADD CONSTRAINT "agent_link_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_installations" ADD CONSTRAINT "agent_installations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
