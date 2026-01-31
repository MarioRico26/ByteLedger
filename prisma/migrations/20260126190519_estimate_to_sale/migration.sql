/*
  Warnings:

  - A unique constraint covering the columns `[saleId]` on the table `Estimate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "saleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_saleId_key" ON "Estimate"("saleId");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
