-- Idempotent migration: ensures CargoType and ServiceType enums
-- have service-oriented values regardless of prior migration state.
-- Safe to run multiple times.

-- ── Cleanup: drop temp types left by any previous failed migration run ─────────
DROP TYPE IF EXISTS "CargoType_new" CASCADE;
DROP TYPE IF EXISTS "ServiceType_new" CASCADE;

-- ── CargoType: replace if still contains old logistics values ─────────────────
DO $$
DECLARE has_old boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CargoType'
      AND e.enumlabel IN ('GENERAL','FOOD','CHEMICALS','ELECTRONICS','FURNITURE',
                           'CONSTRUCTION','AUTOMOTIVE','MEDICAL','HAZARDOUS','FRAGILE')
  ) INTO has_old;

  IF has_old THEN
    CREATE TYPE "CargoType_new" AS ENUM (
      'CONSULTING','DESIGN','INSTALLATION','MAINTENANCE','TECHNICAL_SUPPORT',
      'TRAINING','IT_SERVICES','LOGISTICS','PROJECT_MANAGEMENT','OTHER'
    );
    ALTER TABLE "Order"
      ALTER COLUMN "cargoType" TYPE "CargoType_new"
      USING 'OTHER'::"CargoType_new";
    DROP TYPE "CargoType";
    ALTER TYPE "CargoType_new" RENAME TO "CargoType";
  END IF;
END $$;

-- ── ServiceType: replace if still contains old truck-type values ───────────────
DO $$
DECLARE has_old boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ServiceType'
      AND e.enumlabel IN ('SMALL_FLATBED','MEDIUM_FLATBED','LARGE_FLATBED',
                           'REFRIGERATED','CONTAINER_20','CONTAINER_40',
                           'TANKER','CURTAINSIDER','BOX_TRUCK','LOWBED',
                           'SMALL_VAN','CONTAINER_TRAILER')
  ) INTO has_old;

  IF has_old THEN
    CREATE TYPE "ServiceType_new" AS ENUM (
      'CONSULTING','DESIGN','INSTALLATION','MAINTENANCE','TECHNICAL_SUPPORT',
      'TRAINING','IT_SERVICES','LOGISTICS','PROJECT_MANAGEMENT','OTHER'
    );
    -- Order.requiredServiceType
    ALTER TABLE "Order"
      ALTER COLUMN "requiredServiceType" TYPE "ServiceType_new"
      USING 'OTHER'::"ServiceType_new";
    -- Service.type
    ALTER TABLE "Service"
      ALTER COLUMN "type" TYPE "ServiceType_new"
      USING 'OTHER'::"ServiceType_new";
    DROP TYPE "ServiceType";
    ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
  END IF;
END $$;
