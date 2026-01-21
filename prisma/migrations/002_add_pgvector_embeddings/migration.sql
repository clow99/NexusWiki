-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "PageEmbedding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageEmbedding_pageId_key" ON "PageEmbedding"("pageId");

-- CreateIndex
CREATE INDEX "PageEmbedding_organizationId_idx" ON "PageEmbedding"("organizationId");

-- AddForeignKey
ALTER TABLE "PageEmbedding" ADD CONSTRAINT "PageEmbedding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEmbedding" ADD CONSTRAINT "PageEmbedding_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
