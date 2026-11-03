-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "payoutAccountName" TEXT,
ADD COLUMN     "payoutAccountNumber" TEXT,
ADD COLUMN     "payoutIfsc" TEXT,
ADD COLUMN     "payoutUpiId" TEXT;
