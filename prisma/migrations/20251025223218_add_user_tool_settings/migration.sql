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
CREATE UNIQUE INDEX "UserToolSettings_userId_key" ON "public"."UserToolSettings"("userId");

-- CreateIndex
CREATE INDEX "UserToolSettings_userId_idx" ON "public"."UserToolSettings"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserToolSettings" ADD CONSTRAINT "UserToolSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

