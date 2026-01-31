-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "workAddress" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "serviceAddress" TEXT;
