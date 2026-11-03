-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prerequisites" TEXT;

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enquiryType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
