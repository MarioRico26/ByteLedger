-- Add default tax rate setting
ALTER TABLE "Organization" ADD COLUMN "defaultTaxRate" DECIMAL DEFAULT 0;
