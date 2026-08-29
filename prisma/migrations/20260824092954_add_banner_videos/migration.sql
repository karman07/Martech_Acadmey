-- AlterTable
ALTER TABLE "teacher_banner_images" ADD COLUMN     "videoUrl" TEXT,
ALTER COLUMN "imagePath" DROP NOT NULL;
