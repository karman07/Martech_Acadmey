-- AlterTable
ALTER TABLE "bootcamps" ADD COLUMN     "admissionRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "careerSupport" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "categorySlug" TEXT,
ADD COLUMN     "hoursPerWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "modules" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "studentsGraduated" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "bundles" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "badge" TEXT,
ADD COLUMN     "categorySlug" TEXT,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "level" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ebooks" ADD COLUMN     "categorySlug" TEXT,
ADD COLUMN     "fileSizeMB" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fullParagraphs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "longDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "previewParagraphs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "categories"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bootcamps" ADD CONSTRAINT "bootcamps_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "categories"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "categories"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
