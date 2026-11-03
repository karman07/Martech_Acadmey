-- CreateTable
CREATE TABLE "page_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "htmlSource" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_templates_key_key" ON "page_templates"("key");

-- AddForeignKey
ALTER TABLE "page_templates" ADD CONSTRAINT "page_templates_createdByUid_fkey" FOREIGN KEY ("createdByUid") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
