-- AlterEnum
ALTER TYPE "KycStatus" ADD VALUE 'info_requested';

-- AlterTable
ALTER TABLE "kyc_submissions" ADD COLUMN     "infoRequestNote" TEXT;
