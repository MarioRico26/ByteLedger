/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_publicToken_key" ON "Sale"("publicToken");
