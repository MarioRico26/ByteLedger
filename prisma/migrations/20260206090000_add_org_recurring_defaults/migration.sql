-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "recurringFrequency" TEXT;
ALTER TABLE "Organization" ADD COLUMN "recurringDueDays" INTEGER;
ALTER TABLE "Organization" ADD COLUMN "recurringReminderDays" TEXT;
