-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('not_submitted', 'pending', 'active', 'failed');

-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "teacher_payout_accounts" (
    "userUid" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "pan" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "ifsc" TEXT,
    "upiVpa" TEXT,
    "razorpayAccountId" TEXT,
    "razorpayFundAccountId" TEXT,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'not_submitted',
    "statusMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_payout_accounts_pkey" PRIMARY KEY ("userUid")
);

-- AddForeignKey
ALTER TABLE "teacher_payout_accounts" ADD CONSTRAINT "teacher_payout_accounts_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
