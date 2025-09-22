-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "preferredColor" SET DATA TYPE CHAR(7);

-- AlterTable
ALTER TABLE "public"."work_diary_entries" ALTER COLUMN "typeColor" SET DATA TYPE CHAR(7);

-- CreateTable
CREATE TABLE "public"."grocery_items" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grocery_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grocery_items_userId_completed_idx" ON "public"."grocery_items"("userId", "completed");

-- AddForeignKey
ALTER TABLE "public"."grocery_items" ADD CONSTRAINT "grocery_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
