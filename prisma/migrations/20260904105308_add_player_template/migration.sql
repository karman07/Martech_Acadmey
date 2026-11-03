-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "playerTemplate" TEXT NOT NULL DEFAULT 'classic';

-- Backfill: lesson player inherits each course's existing page layout choice
-- until a teacher explicitly picks a different one for the player.
UPDATE "courses" SET "playerTemplate" = "courseTemplate";
