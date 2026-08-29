-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cardStyle" TEXT,
ADD COLUMN     "coverImagePath" TEXT;

-- CreateTable
CREATE TABLE "teacher_facts" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_facts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "teacher_facts" ADD CONSTRAINT "teacher_facts_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
