-- AlterEnum
ALTER TYPE "LessonType" ADD VALUE 'quiz';

-- AlterTable
ALTER TABLE "bootcamps" ADD COLUMN     "coverImagePath" TEXT;

-- AlterTable
ALTER TABLE "bundles" ADD COLUMN     "coverImagePath" TEXT;

-- AlterTable
ALTER TABLE "course_lessons" ADD COLUMN     "quizId" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "coverImagePath" TEXT;

-- CreateTable
CREATE TABLE "bootcamp_courses" (
    "id" TEXT NOT NULL,
    "bootcampId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "bootcamp_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bootcamp_courses_bootcampId_courseId_key" ON "bootcamp_courses"("bootcampId", "courseId");

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bootcamp_courses" ADD CONSTRAINT "bootcamp_courses_bootcampId_fkey" FOREIGN KEY ("bootcampId") REFERENCES "bootcamps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bootcamp_courses" ADD CONSTRAINT "bootcamp_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
