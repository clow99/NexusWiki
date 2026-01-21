-- CreateEnum
CREATE TYPE "SpaceVisibility" AS ENUM ('MEMBERS_ONLY', 'PUBLIC');

-- AlterTable
ALTER TABLE "Space"
ADD COLUMN "visibility" "SpaceVisibility" NOT NULL DEFAULT 'MEMBERS_ONLY',
ADD COLUMN "defaultRoleId" TEXT;

-- CreateTable
CREATE TABLE "SpaceRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceRoleAssignment" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceRole_spaceId_name_key" ON "SpaceRole"("spaceId", "name");

-- CreateIndex
CREATE INDEX "SpaceRole_organizationId_idx" ON "SpaceRole"("organizationId");

-- CreateIndex
CREATE INDEX "SpaceRole_spaceId_idx" ON "SpaceRole"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceRoleAssignment_spaceId_userId_key" ON "SpaceRoleAssignment"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "SpaceRoleAssignment_spaceId_idx" ON "SpaceRoleAssignment"("spaceId");

-- CreateIndex
CREATE INDEX "SpaceRoleAssignment_userId_idx" ON "SpaceRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "SpaceRoleAssignment_roleId_idx" ON "SpaceRoleAssignment"("roleId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_defaultRoleId_fkey" FOREIGN KEY ("defaultRoleId") REFERENCES "SpaceRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRole" ADD CONSTRAINT "SpaceRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRole" ADD CONSTRAINT "SpaceRole_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRoleAssignment" ADD CONSTRAINT "SpaceRoleAssignment_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRoleAssignment" ADD CONSTRAINT "SpaceRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRoleAssignment" ADD CONSTRAINT "SpaceRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SpaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
