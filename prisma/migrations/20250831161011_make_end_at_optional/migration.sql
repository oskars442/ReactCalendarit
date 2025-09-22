/*
  Warnings:

  - The `status` column on the `work_diary_entries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `type` to the `work_diary_entries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DiaryType" AS ENUM ('task', 'job', 'meeting', 'other');

-- CreateEnum
CREATE TYPE "public"."DiaryStatus" AS ENUM ('planned', 'in_progress', 'done', 'cancelled');

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "preferredColor" SET DATA TYPE VARCHAR(7),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."work_diary_entries" DROP COLUMN "type",
ADD COLUMN     "type" "public"."DiaryType" NOT NULL,
ALTER COLUMN "typeColor" SET DATA TYPE VARCHAR(7),
ALTER COLUMN "endAt" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."DiaryStatus" NOT NULL DEFAULT 'planned',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_diary_user_status" ON "public"."work_diary_entries"("userId", "status");
