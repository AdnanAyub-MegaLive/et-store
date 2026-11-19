-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "icon" SET DEFAULT 'frame';

-- Keep the current display order
UPDATE "Category" SET "position" = CASE "slug"
  WHEN 'ride' THEN 1 WHEN 'frame' THEN 2 WHEN 'dress-up' THEN 3 WHEN 'profile-bg' THEN 4
  WHEN 'seats' THEN 5 WHEN 'entrance' THEN 6 WHEN 'badge' THEN 7 WHEN 'chat-box' THEN 8
  WHEN 'room-bg' THEN 9 WHEN 'room-frames' THEN 10 WHEN 'card' THEN 11 ELSE 99 END;
