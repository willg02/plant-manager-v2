-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "description" TEXT,
    "climateZone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "botanicalName" TEXT,
    "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plantType" TEXT,
    "family" TEXT,
    "hardinessZoneMin" TEXT,
    "hardinessZoneMax" TEXT,
    "sunRequirement" TEXT,
    "waterNeeds" TEXT,
    "soilPreference" TEXT,
    "matureHeight" TEXT,
    "matureWidth" TEXT,
    "growthRate" TEXT,
    "bloomTime" TEXT,
    "bloomColor" TEXT,
    "foliageColor" TEXT,
    "nativeRegion" TEXT,
    "description" TEXT,
    "careTips" TEXT,
    "companionPlants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "aiPopulated" BOOLEAN NOT NULL DEFAULT false,
    "aiPopulatedAt" TIMESTAMP(3),
    "aiModel" TEXT,
    "aiConfidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantAvailability" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "size" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadLog" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "supplierId" TEXT,
    "regionId" TEXT,
    "rowCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UploadLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourcePlantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE INDEX "Supplier_regionId_idx" ON "Supplier"("regionId");

-- CreateIndex
CREATE INDEX "Plant_commonName_idx" ON "Plant"("commonName");

-- CreateIndex
CREATE INDEX "Plant_botanicalName_idx" ON "Plant"("botanicalName");

-- CreateIndex
CREATE INDEX "Plant_plantType_idx" ON "Plant"("plantType");

-- CreateIndex
CREATE INDEX "Plant_sunRequirement_idx" ON "Plant"("sunRequirement");

-- CreateIndex
CREATE INDEX "Plant_waterNeeds_idx" ON "Plant"("waterNeeds");

-- CreateIndex
CREATE INDEX "PlantAvailability_plantId_idx" ON "PlantAvailability"("plantId");

-- CreateIndex
CREATE INDEX "PlantAvailability_supplierId_idx" ON "PlantAvailability"("supplierId");

-- CreateIndex
CREATE INDEX "PlantAvailability_regionId_idx" ON "PlantAvailability"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantAvailability_plantId_supplierId_size_key" ON "PlantAvailability"("plantId", "supplierId", "size");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantAvailability" ADD CONSTRAINT "PlantAvailability_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantAvailability" ADD CONSTRAINT "PlantAvailability_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantAvailability" ADD CONSTRAINT "PlantAvailability_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
