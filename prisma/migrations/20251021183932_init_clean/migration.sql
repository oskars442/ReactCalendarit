/*
  Warnings:

  - You are about to alter the column `amount` on the `BabyLog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropIndex
DROP INDEX "public"."BabyLog_userId_occurredAt_idx";

-- AlterTable
ALTER TABLE "public"."BabyLog" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "public"."Baby" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserToolSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "calendar" BOOLEAN NOT NULL DEFAULT true,
    "diary" BOOLEAN NOT NULL DEFAULT true,
    "tasks" BOOLEAN NOT NULL DEFAULT true,
    "workouts" BOOLEAN NOT NULL DEFAULT true,
    "shopping" BOOLEAN NOT NULL DEFAULT true,
    "weather" BOOLEAN NOT NULL DEFAULT true,
    "baby" BOOLEAN NOT NULL DEFAULT true,
    "stats" BOOLEAN NOT NULL DEFAULT false,
    "projects" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserToolSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Baby_userId_idx" ON "public"."Baby"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToolSettings_userId_key" ON "public"."UserToolSettings"("userId");

-- CreateIndex
CREATE INDEX "UserToolSettings_userId_idx" ON "public"."UserToolSettings"("userId");

-- CreateIndex
CREATE INDEX "BabyLog_userId_idx" ON "public"."BabyLog"("userId");

-- CreateIndex
CREATE INDEX "BabyLog_babyId_idx" ON "public"."BabyLog"("babyId");

-- AddForeignKey
ALTER TABLE "public"."Baby" ADD CONSTRAINT "Baby_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BabyLog" ADD CONSTRAINT "BabyLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "public"."Baby"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserToolSettings" ADD CONSTRAINT "UserToolSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
