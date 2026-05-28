-- Fix: make optional Order columns actually nullable in the DB.
-- The Prisma schema marks all these as optional (?) but the DB may have them
-- as NOT NULL if migrations didn't run in the correct order.
-- DROP NOT NULL is a no-op when the column is already nullable — safe to run
-- on any DB state.

ALTER TABLE "Order" ALTER COLUMN "weight"               DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "pallets"              DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "volume"               DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "originLat"            DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "originLng"            DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "destinationLat"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "destinationLng"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "targetProviderId"     DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "providerId"           DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "specialInstructions"  DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryDate"         DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "bidDeadline"          DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "clientBudget"         DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "agreedPrice"          DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "commissionAmount"     DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "providerAmount"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "actualPickupAt"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "actualDeliveryAt"     DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "poNumber"             DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "bolNumber"            DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "clientRating"         DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "providerRating"       DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "notes"                DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "cancelReason"         DROP NOT NULL;
