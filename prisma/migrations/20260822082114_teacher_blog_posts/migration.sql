-- CreateTable
CREATE TABLE "teacher_blog_posts" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_blog_posts_teacherUid_slug_key" ON "teacher_blog_posts"("teacherUid", "slug");

-- AddForeignKey
ALTER TABLE "teacher_blog_posts" ADD CONSTRAINT "teacher_blog_posts_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
