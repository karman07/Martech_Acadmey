/*
  Warnings:

  - You are about to drop the column `fileMediaId` on the `ebooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ebooks" DROP COLUMN "fileMediaId",
ADD COLUMN     "coverImagePath" TEXT,
ADD COLUMN     "libraryEbookId" TEXT;

-- AddForeignKey
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_libraryEbookId_fkey" FOREIGN KEY ("libraryEbookId") REFERENCES "library_ebooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
