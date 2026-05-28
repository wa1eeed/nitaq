-- Update CargoType and ServiceType enum values from logistics terminology
-- to service-oriented terminology (Nitaq v1.0 platform model).
-- Existing rows (if any) are mapped to 'OTHER' via USING clause.

-- ─── CargoType ────────────────────────────────────────────────────

CREATE TYPE "CargoType_new" AS ENUM (
  'CONSULTING', 'DESIGN', 'INSTALLATION', 'MAINTENANCE', 'TECHNICAL_SUPPORT',
  'TRAINING', 'IT_SERVICES', 'LOGISTICS', 'PROJECT_MANAGEMENT', 'OTHER'
);

ALTER TABLE "Order"
  ALTER COLUMN "cargoType" TYPE "CargoType_new"
  USING 'OTHER'::"CargoType_new";

DROP TYPE "CargoType";
ALTER TYPE "CargoType_new" RENAME TO "CargoType";

-- ─── ServiceType ─────────────────────────────────────────────────

CREATE TYPE "ServiceType_new" AS ENUM (
  'CONSULTING', 'DESIGN', 'INSTALLATION', 'MAINTENANCE', 'TECHNICAL_SUPPORT',
  'TRAINING', 'IT_SERVICES', 'LOGISTICS', 'PROJECT_MANAGEMENT', 'OTHER'
);

ALTER TABLE "Order"
  ALTER COLUMN "requiredServiceType" TYPE "ServiceType_new"
  USING 'OTHER'::"ServiceType_new";

ALTER TABLE "Service"
  ALTER COLUMN "type" TYPE "ServiceType_new"
  USING 'OTHER'::"ServiceType_new";

DROP TYPE "ServiceType";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
