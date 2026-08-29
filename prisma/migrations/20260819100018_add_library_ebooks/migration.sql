-- CreateEnum
CREATE TYPE "LibraryEbookFileType" AS ENUM ('pdf', 'docx');

-- CreateTable
CREATE TABLE "library_ebooks" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileType" "LibraryEbookFileType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_library_ebooks" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "libraryEbookId" TEXT NOT NULL,

    CONSTRAINT "course_library_ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_library_ebooks_courseId_libraryEbookId_key" ON "course_library_ebooks"("courseId", "libraryEbookId");

-- AddForeignKey
ALTER TABLE "library_ebooks" ADD CONSTRAINT "library_ebooks_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_library_ebooks" ADD CONSTRAINT "course_library_ebooks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_library_ebooks" ADD CONSTRAINT "course_library_ebooks_libraryEbookId_fkey" FOREIGN KEY ("libraryEbookId") REFERENCES "library_ebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
