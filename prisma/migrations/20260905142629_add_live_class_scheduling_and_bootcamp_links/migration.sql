-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "zoomAccountId" TEXT,
ADD COLUMN     "zoomClientId" TEXT,
ADD COLUMN     "zoomClientSecret" TEXT;

-- AlterTable
ALTER TABLE "live_classes" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "status" "LiveClassStatus" NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "zoomMeetingId" TEXT,
ADD COLUMN     "zoomStartUrl" TEXT;

-- CreateTable
CREATE TABLE "bootcamp_live_classes" (
    "id" TEXT NOT NULL,
    "bootcampId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,

    CONSTRAINT "bootcamp_live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bootcamp_live_classes_bootcampId_liveClassId_key" ON "bootcamp_live_classes"("bootcampId", "liveClassId");

-- AddForeignKey
ALTER TABLE "bootcamp_live_classes" ADD CONSTRAINT "bootcamp_live_classes_bootcampId_fkey" FOREIGN KEY ("bootcampId") REFERENCES "bootcamps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bootcamp_live_classes" ADD CONSTRAINT "bootcamp_live_classes_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
