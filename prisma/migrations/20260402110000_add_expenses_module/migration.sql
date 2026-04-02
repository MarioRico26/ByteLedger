ALTER TABLE "Membership"
ADD COLUMN "canAccessExpenses" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PAID', 'SCHEDULED');

CREATE TYPE "ExpensePaymentMethod" AS ENUM ('ACH', 'CARD', 'CASH', 'CHECK', 'WIRE', 'OTHER');

CREATE TABLE "ExpenseCategory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT DEFAULT '#2563eb',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "vendor" TEXT,
  "description" TEXT,
  "reference" TEXT,
  "notes" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3),
  "status" "ExpenseStatus" NOT NULL DEFAULT 'PAID',
  "paymentMethod" "ExpensePaymentMethod" NOT NULL DEFAULT 'OTHER',
  "createdByUserId" TEXT,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseCategory_organizationId_name_key"
ON "ExpenseCategory"("organizationId", "name");

CREATE INDEX "ExpenseCategory_organizationId_idx"
ON "ExpenseCategory"("organizationId");

CREATE INDEX "Expense_organizationId_idx"
ON "Expense"("organizationId");

CREATE INDEX "Expense_categoryId_idx"
ON "Expense"("categoryId");

CREATE INDEX "Expense_expenseDate_idx"
ON "Expense"("expenseDate");

CREATE INDEX "Expense_status_idx"
ON "Expense"("status");

ALTER TABLE "ExpenseCategory"
ADD CONSTRAINT "ExpenseCategory_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
