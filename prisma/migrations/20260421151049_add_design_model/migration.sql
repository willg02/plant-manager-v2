-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled design',
    "bedPolygon" JSONB,
    "bedImageUrl" TEXT,
    "sunOrientation" TEXT,
    "shortlistPlantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "messages" JSONB NOT NULL DEFAULT '[]',
    "layout" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Design_userId_updatedAt_idx" ON "Design"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Design_regionId_idx" ON "Design"("regionId");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
