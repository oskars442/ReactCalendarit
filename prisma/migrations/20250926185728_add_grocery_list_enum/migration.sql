-- CreateEnum
CREATE TYPE "public"."GroceryListKind" AS ENUM ('daily', 'longterm');

-- AlterTable
ALTER TABLE "public"."grocery_items" ADD COLUMN     "list" "public"."GroceryListKind" NOT NULL DEFAULT 'daily';

-- CreateIndex
CREATE INDEX "grocery_items_userId_list_completed_createdAt_idx" ON "public"."grocery_items"("userId", "list", "completed", "createdAt");
