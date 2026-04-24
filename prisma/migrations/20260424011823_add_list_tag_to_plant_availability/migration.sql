-- AlterTable
ALTER TABLE "PlantAvailability" ADD COLUMN     "listTag" TEXT;

-- CreateIndex
CREATE INDEX "PlantAvailability_listTag_idx" ON "PlantAvailability"("listTag");
