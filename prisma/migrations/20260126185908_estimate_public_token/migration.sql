/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Estimate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_publicToken_key" ON "Estimate"("publicToken");
