-- CreateTable
CREATE TABLE "OrganizationTheme" (
    "organizationId" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "logoKey" TEXT,
    "logoContentType" TEXT,
    "logoUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationTheme_pkey" PRIMARY KEY ("organizationId")
);

-- AddForeignKey
ALTER TABLE "OrganizationTheme" ADD CONSTRAINT "OrganizationTheme_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
