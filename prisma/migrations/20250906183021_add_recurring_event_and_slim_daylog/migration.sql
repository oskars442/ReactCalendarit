/*
  Warnings:

  - You are about to drop the column `hoursWorked` on the `DayLog` table. All the data in the column will be lost.
  - You are about to drop the column `moneyEarned` on the `DayLog` table. All the data in the column will be lost.
  - You are about to drop the column `moneySpent` on the `DayLog` table. All the data in the column will be lost.
  - You are about to drop the column `noteEarned` on the `DayLog` table. All the data in the column will be lost.
  - You are about to drop the column `noteSpent` on the `DayLog` table. All the data in the column will be lost.
  - You are about to drop the column `sportMinutes` on the `DayLog` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Recurrence" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "public"."DayLog" DROP COLUMN "hoursWorked",
DROP COLUMN "moneyEarned",
DROP COLUMN "moneySpent",
DROP COLUMN "noteEarned",
DROP COLUMN "noteSpent",
DROP COLUMN "sportMinutes";

-- CreateTable
CREATE TABLE "public"."RecurringEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "baseDate" DATE NOT NULL,
    "recurrence" "public"."Recurrence" NOT NULL,
    "notes" TEXT,
    "skips" DATE[],
    "overrides" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RecurringEvent_pkey" PRIMARY KEY ("id")
);
