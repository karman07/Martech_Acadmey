/*
  Warnings:

  - You are about to drop the column `zoomAccountId` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `zoomClientId` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `zoomClientSecret` on the `app_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_settings" DROP COLUMN "zoomAccountId",
DROP COLUMN "zoomClientId",
DROP COLUMN "zoomClientSecret";

-- CreateTable
CREATE TABLE "teacher_zoom_accounts" (
    "teacherUid" TEXT NOT NULL,
    "zoomUserId" TEXT NOT NULL,
    "zoomEmail" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_zoom_accounts_pkey" PRIMARY KEY ("teacherUid")
);

-- AddForeignKey
ALTER TABLE "teacher_zoom_accounts" ADD CONSTRAINT "teacher_zoom_accounts_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
