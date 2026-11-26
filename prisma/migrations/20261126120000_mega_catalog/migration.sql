-- Link products to Mega Live Mall items imported through the portal Partner Store API.
ALTER TABLE "Product" ADD COLUMN "megaItemId" TEXT,
  ADD COLUMN "megaName" TEXT,
  ADD COLUMN "megaCategory" TEXT,
  ADD COLUMN "megaUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "megaRemovedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Product_megaItemId_key" ON "Product"("megaItemId");
