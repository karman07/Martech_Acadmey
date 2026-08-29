/*
  Warnings:

  - You are about to drop the column `coverImagePath` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "coverImagePath";

-- CreateTable
CREATE TABLE "teacher_banner_images" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_banner_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_messages" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "teacher_banner_images" ADD CONSTRAINT "teacher_banner_images_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_messages" ADD CONSTRAINT "teacher_messages_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
