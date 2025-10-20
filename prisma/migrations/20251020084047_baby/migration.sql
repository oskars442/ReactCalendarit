-- CreateTable
CREATE TABLE "public"."BabyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "babyId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "foodType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BabyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BabyLog_userId_occurredAt_idx" ON "public"."BabyLog"("userId", "occurredAt");
