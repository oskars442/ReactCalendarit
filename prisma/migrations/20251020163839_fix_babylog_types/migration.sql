BEGIN;

-- 0) Drošībai: noņemam iespējamos FK (ja ir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BabyLog_userId_fkey') THEN
    ALTER TABLE "public"."BabyLog" DROP CONSTRAINT "BabyLog_userId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BabyLog_babyId_fkey') THEN
    ALTER TABLE "public"."BabyLog" DROP CONSTRAINT "BabyLog_babyId_fkey";
  END IF;
END $$;

-- 1) Ja Baby.userId ir TEXT, pārkonvertējam arī tur uz INTEGER (droši, ja nav - izlaidīs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Baby'
      AND column_name  = 'userId'
      AND data_type    = 'text'
  ) THEN
    ALTER TABLE "public"."Baby"
      ALTER COLUMN "userId" TYPE integer USING NULLIF("userId",'')::integer;
  END IF;
END $$;

-- 2) BabyLog: pievienojam jaunu kolonnu (NULL), lai mierīgi backfill'ot
ALTER TABLE "public"."BabyLog"
  ADD COLUMN "userId_int" integer;

-- 3) Aizpildām no vecās tekstuālās kolonnas (kur ir skaitlis kā teksts)
UPDATE "public"."BabyLog"
   SET "userId_int" = NULLIF("userId",'')::integer
 WHERE "userId" ~ '^\d+$' OR "userId" = '';

-- 4) Validācijas pārbaude — ja paliek NULL, metam kļūdu, lai nejauši nepazušanas
DO $$
DECLARE v_missing int;
BEGIN
  SELECT COUNT(*) INTO v_missing FROM "public"."BabyLog" WHERE "userId_int" IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Nevar migrēt: % rindām "BabyLog.userId" nav korekts skaitlis vai ir NULL. Izlabo tās pirms migrācijas.', v_missing;
  END IF;
END $$;

-- 5) 'amount' -> integer (noapaļojot). Ja tev jāsaglabā kā 'Float', izlaid šo soli.
ALTER TABLE "public"."BabyLog"
  ALTER COLUMN "amount" TYPE integer USING ROUND("amount")::integer;

-- 6) Kad viss ir aizpildīts, metam veco kolonnu un pārdēvējam jauno
ALTER TABLE "public"."BabyLog" DROP COLUMN "userId";
ALTER TABLE "public"."BabyLog" RENAME COLUMN "userId_int" TO "userId";

-- 7) Uzliekam NOT NULL + FK uz users.id (Int)
ALTER TABLE "public"."BabyLog"
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "public"."BabyLog"
  ADD CONSTRAINT "BabyLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) Atjaunojam FK pret Baby (ja nepieciešams)
ALTER TABLE "public"."BabyLog"
  ADD CONSTRAINT "BabyLog_babyId_fkey"
  FOREIGN KEY ("babyId") REFERENCES "public"."Baby"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 9) Indeksi (ja vajag)
CREATE INDEX IF NOT EXISTS "BabyLog_userId_idx" ON "public"."BabyLog"("userId");
CREATE INDEX IF NOT EXISTS "BabyLog_babyId_idx" ON "public"."BabyLog"("babyId");

COMMIT;