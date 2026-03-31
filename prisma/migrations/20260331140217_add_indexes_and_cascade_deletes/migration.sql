-- DropForeignKey
ALTER TABLE "PlantAvailability" DROP CONSTRAINT "PlantAvailability_regionId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_regionId_fkey";

-- CreateIndex
CREATE INDEX "Plant_aiPopulated_idx" ON "Plant"("aiPopulated");

-- CreateIndex
CREATE INDEX "PlantAvailability_inStock_idx" ON "PlantAvailability"("inStock");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantAvailability" ADD CONSTRAINT "PlantAvailability_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
