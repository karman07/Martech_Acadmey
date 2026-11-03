/*
  Warnings:

  - You are about to drop the column `razorpayFundAccountId` on the `teacher_payout_accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "teacher_payout_accounts" DROP COLUMN "razorpayFundAccountId",
ADD COLUMN     "razorpayProductId" TEXT;
