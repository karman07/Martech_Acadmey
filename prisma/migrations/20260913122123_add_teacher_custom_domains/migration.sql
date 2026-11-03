-- CreateTable
CREATE TABLE "teacher_custom_domains" (
    "teacherUid" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssuedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_custom_domains_pkey" PRIMARY KEY ("teacherUid")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_custom_domains_domain_key" ON "teacher_custom_domains"("domain");

-- AddForeignKey
ALTER TABLE "teacher_custom_domains" ADD CONSTRAINT "teacher_custom_domains_teacherUid_fkey" FOREIGN KEY ("teacherUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
