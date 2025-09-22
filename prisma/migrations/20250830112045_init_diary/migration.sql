-- CreateTable
CREATE TABLE "public"."work_diary_entries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT,
    "label" TEXT,
    "typeColor" CHAR(7),
    "title" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "priority" INTEGER,
    "recurrence" TEXT,
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_diary_user_start" ON "public"."work_diary_entries"("userId", "startAt");

-- CreateIndex
CREATE INDEX "idx_diary_user_status" ON "public"."work_diary_entries"("userId", "status");

-- CreateIndex
CREATE INDEX "idx_diary_user_allday" ON "public"."work_diary_entries"("userId", "allDay");
