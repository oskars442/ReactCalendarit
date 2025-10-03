-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('NEW', 'PLANNED', 'IN_PROGRESS', 'DONE', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."Suggestion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "name" TEXT,
    "email" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "hidePublic" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Suggestion_status_archived_idx" ON "public"."Suggestion"("status", "archived");
