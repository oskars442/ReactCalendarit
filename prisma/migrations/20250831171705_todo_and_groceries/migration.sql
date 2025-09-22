-- CreateEnum
CREATE TYPE "public"."TodoPriority" AS ENUM ('low', 'med', 'high');

-- CreateTable
CREATE TABLE "public"."todo_items" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priority" "public"."TodoPriority" NOT NULL DEFAULT 'med',
    "due" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "todo_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_items_userId_done_priority_idx" ON "public"."todo_items"("userId", "done", "priority");

-- AddForeignKey
ALTER TABLE "public"."todo_items" ADD CONSTRAINT "todo_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
