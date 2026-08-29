-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('open', 'done');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'sales';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "commissionPercent" DECIMAL(5,2),
ADD COLUMN     "salesRepUid" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "commissionPercent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "salesRepUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "interest" TEXT,
    "notes" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_payouts" (
    "id" TEXT NOT NULL,
    "salesRepUid" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_payouts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_salesRepUid_fkey" FOREIGN KEY ("salesRepUid") REFERENCES "users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_salesRepUid_fkey" FOREIGN KEY ("salesRepUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_payouts" ADD CONSTRAINT "sales_payouts_salesRepUid_fkey" FOREIGN KEY ("salesRepUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
