ALTER TABLE "work_diary_entries"
  ADD CONSTRAINT chk_end_after_start
  CHECK ("endAt" IS NULL OR "endAt" > "startAt");