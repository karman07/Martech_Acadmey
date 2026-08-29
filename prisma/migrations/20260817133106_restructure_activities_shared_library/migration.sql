/*
  Warnings:

  - You are about to drop the column `courseId` on the `activities` table. All the data in the column will be lost.
  - Added the required column `teacherUid` to the `activities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_courseId_fkey";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "courseId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teacherUid" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "course_activities" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,

    CONSTRAINT "course_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_activities_courseId_activityId_key" ON "course_activities"("courseId", "activityId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_activities" ADD CONSTRAINT "course_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_activities" ADD CONSTRAINT "course_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
