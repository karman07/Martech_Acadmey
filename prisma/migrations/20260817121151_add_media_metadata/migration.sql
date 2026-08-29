-- CreateEnum
CREATE TYPE "MediaSourceType" AS ENUM ('upload', 'url');

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "description" TEXT,
ADD COLUMN     "sourceType" "MediaSourceType" NOT NULL DEFAULT 'upload',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "url" TEXT,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "sizeBytes" DROP NOT NULL,
ALTER COLUMN "storagePath" DROP NOT NULL;
