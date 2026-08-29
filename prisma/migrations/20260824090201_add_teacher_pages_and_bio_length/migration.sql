-- CreateTable
CREATE TABLE "teacher_pages" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "navLabel" TEXT,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_pages_teacherUid_slug_key" ON "teacher_pages"("teacherUid", "slug");

-- AddForeignKey
ALTER TABLE "teacher_pages" ADD CONSTRAINT "teacher_pages_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
