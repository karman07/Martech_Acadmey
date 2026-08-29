-- CreateTable
CREATE TABLE "teacher_posts" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_comments" (
    "id" TEXT NOT NULL,
    "teacherUid" TEXT NOT NULL,
    "authorUid" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "teacher_posts" ADD CONSTRAINT "teacher_posts_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_comments" ADD CONSTRAINT "teacher_comments_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_comments" ADD CONSTRAINT "teacher_comments_authorUid_fkey" FOREIGN KEY ("authorUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
