-- Rename logistics terminology to services terminology
-- Nitaq Platform v0.9.16 → v1.0

-- ─── Step 1: Rename enum types ────────────────────────────────────

ALTER TYPE "TruckType" RENAME TO "ServiceType";
ALTER TYPE "DriverStatus" RENAME TO "EmployeeStatus";

-- ─── Step 2: Rename enum values ───────────────────────────────────

ALTER TYPE "EmployeeStatus" RENAME VALUE 'ON_TRIP' TO 'ON_ASSIGNMENT';

ALTER TYPE "NotificationType" RENAME VALUE 'SHIPMENT_STARTED' TO 'SERVICE_STARTED';
ALTER TYPE "NotificationType" RENAME VALUE 'SHIPMENT_DELIVERED' TO 'SERVICE_COMPLETED';

ALTER TYPE "CompanyType" RENAME VALUE 'CARRIER' TO 'PROVIDER';

ALTER TYPE "UserRole" RENAME VALUE 'CARRIER_ADMIN' TO 'PROVIDER_ADMIN';
ALTER TYPE "UserRole" RENAME VALUE 'CARRIER_USER' TO 'PROVIDER_USER';
ALTER TYPE "UserRole" RENAME VALUE 'DRIVER' TO 'EMPLOYEE';

-- ─── Step 3: Rename tables ─────────────────────────────────────────

ALTER TABLE "Truck" RENAME TO "Service";
ALTER TABLE "DriverProfile" RENAME TO "EmployeeProfile";
ALTER TABLE "OrderTruck" RENAME TO "OrderService";
ALTER TABLE "OrderDriver" RENAME TO "OrderEmployee";

-- ─── Step 4: Rename columns ────────────────────────────────────────

-- Service (formerly Truck)
ALTER TABLE "Service" RENAME COLUMN "currentDriverId" TO "currentEmployeeId";

-- EmployeeProfile (formerly DriverProfile)
ALTER TABLE "EmployeeProfile" RENAME COLUMN "totalTrips" TO "totalAssignments";

-- Order
ALTER TABLE "Order" RENAME COLUMN "targetCarrierId" TO "targetProviderId";
ALTER TABLE "Order" RENAME COLUMN "carrierId" TO "providerId";
ALTER TABLE "Order" RENAME COLUMN "requiredTruckType" TO "requiredServiceType";
ALTER TABLE "Order" RENAME COLUMN "carrierAmount" TO "providerAmount";
ALTER TABLE "Order" RENAME COLUMN "carrierRating" TO "providerRating";

-- Bid
ALTER TABLE "Bid" RENAME COLUMN "carrierId" TO "providerId";

-- Payment
ALTER TABLE "Payment" RENAME COLUMN "carrierAmount" TO "providerAmount";

-- OrderService (formerly OrderTruck)
ALTER TABLE "OrderService" RENAME COLUMN "truckId" TO "serviceId";

-- OrderEmployee (formerly OrderDriver)
ALTER TABLE "OrderEmployee" RENAME COLUMN "driverId" TO "employeeId";

-- LocationHistory
ALTER TABLE "LocationHistory" RENAME COLUMN "driverId" TO "employeeId";

-- ─── Step 5: Rename indexes ────────────────────────────────────────

ALTER INDEX IF EXISTS "DriverProfile_userId_key" RENAME TO "EmployeeProfile_userId_key";
ALTER INDEX IF EXISTS "DriverProfile_licenseNumber_key" RENAME TO "EmployeeProfile_licenseNumber_key";
ALTER INDEX IF EXISTS "DriverProfile_companyId_idx" RENAME TO "EmployeeProfile_companyId_idx";

ALTER INDEX IF EXISTS "Truck_companyId_idx" RENAME TO "Service_companyId_idx";
ALTER INDEX IF EXISTS "Truck_type_idx" RENAME TO "Service_type_idx";
ALTER INDEX IF EXISTS "Truck_plateNumber_key" RENAME TO "Service_plateNumber_key";

ALTER INDEX IF EXISTS "OrderTruck_orderId_truckId_key" RENAME TO "OrderService_orderId_serviceId_key";
ALTER INDEX IF EXISTS "OrderDriver_orderId_driverId_key" RENAME TO "OrderEmployee_orderId_employeeId_key";

ALTER INDEX IF EXISTS "Order_carrierId_status_idx" RENAME TO "Order_providerId_status_idx";
ALTER INDEX IF EXISTS "Bid_orderId_carrierId_key" RENAME TO "Bid_orderId_providerId_key";

ALTER INDEX IF EXISTS "LocationHistory_driverId_recordedAt_idx" RENAME TO "LocationHistory_employeeId_recordedAt_idx";

-- ─── Step 6: Rename foreign key constraints ────────────────────────

-- PostgreSQL doesn't have ALTER CONSTRAINT RENAME, so we drop and recreate
-- the ones that reference renamed tables/columns.

-- Service.currentEmployeeId → EmployeeProfile
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Truck_currentDriverId_fkey";
ALTER TABLE "Service" ADD CONSTRAINT "Service_currentEmployeeId_fkey"
  FOREIGN KEY ("currentEmployeeId") REFERENCES "EmployeeProfile"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Service.companyId
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Truck_companyId_fkey";
ALTER TABLE "Service" ADD CONSTRAINT "Service_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- EmployeeProfile.userId
ALTER TABLE "EmployeeProfile" DROP CONSTRAINT IF EXISTS "DriverProfile_userId_fkey";
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- EmployeeProfile.companyId
ALTER TABLE "EmployeeProfile" DROP CONSTRAINT IF EXISTS "DriverProfile_companyId_fkey";
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- OrderService
ALTER TABLE "OrderService" DROP CONSTRAINT IF EXISTS "OrderTruck_orderId_fkey";
ALTER TABLE "OrderService" ADD CONSTRAINT "OrderService_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "OrderService" DROP CONSTRAINT IF EXISTS "OrderTruck_truckId_fkey";
ALTER TABLE "OrderService" ADD CONSTRAINT "OrderService_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- OrderEmployee
ALTER TABLE "OrderEmployee" DROP CONSTRAINT IF EXISTS "OrderDriver_orderId_fkey";
ALTER TABLE "OrderEmployee" ADD CONSTRAINT "OrderEmployee_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "OrderEmployee" DROP CONSTRAINT IF EXISTS "OrderDriver_driverId_fkey";
ALTER TABLE "OrderEmployee" ADD CONSTRAINT "OrderEmployee_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- LocationHistory.employeeId
ALTER TABLE "LocationHistory" DROP CONSTRAINT IF EXISTS "LocationHistory_driverId_fkey";
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Order foreign keys
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_targetCarrierId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_targetProviderId_fkey"
  FOREIGN KEY ("targetProviderId") REFERENCES "Company"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_carrierId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "Company"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Bid.providerId
ALTER TABLE "Bid" DROP CONSTRAINT IF EXISTS "Bid_carrierId_fkey";
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "Company"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
