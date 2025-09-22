-- CreateTable
CREATE TABLE "public"."DayLog" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "moneyEarned" INTEGER,
    "moneySpent" INTEGER,
    "hoursWorked" DOUBLE PRECISION,
    "sportMinutes" INTEGER,
    "noteEarned" TEXT,
    "noteSpent" TEXT,
    "dayColor" VARCHAR(7),
    "userId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DayLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayLog_userId_date_key" ON "public"."DayLog"("userId", "date");
