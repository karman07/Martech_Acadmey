/*
  Warnings:

  - You are about to drop the column `courseId` on the `live_classes` table. All the data in the column will be lost.
  - Added the required column `teacherUid` to the `live_classes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "live_classes" DROP CONSTRAINT "live_classes_courseId_fkey";

-- AlterTable
ALTER TABLE "live_classes" DROP COLUMN "courseId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teacherUid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "course_live_classes" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,

    CONSTRAINT "course_live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_live_classes_courseId_liveClassId_key" ON "course_live_classes"("courseId", "liveClassId");

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_live_classes" ADD CONSTRAINT "course_live_classes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_live_classes" ADD CONSTRAINT "course_live_classes_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
