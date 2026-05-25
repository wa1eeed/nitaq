-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CargoType" AS ENUM ('GENERAL', 'FOOD', 'CHEMICALS', 'ELECTRONICS', 'FURNITURE', 'CONSTRUCTION', 'AUTOMOTIVE', 'MEDICAL', 'HAZARDOUS', 'FRAGILE');

-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'DISPATCH', 'FINANCE');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('CLIENT', 'CARRIER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CREATED', 'BID_RECEIVED', 'BID_ACCEPTED', 'BID_REJECTED', 'ORDER_ASSIGNED', 'ORDER_CONFIRMED', 'SHIPMENT_STARTED', 'SHIPMENT_DELIVERED', 'PAYMENT_RECEIVED', 'PAYMENT_RELEASED', 'KYC_APPROVED', 'KYC_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'BIDDING', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('TECHNICAL', 'BILLING', 'ACCOUNT', 'ORDER', 'GENERAL');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TruckType" AS ENUM ('SMALL_FLATBED', 'MEDIUM_FLATBED', 'LARGE_FLATBED', 'REFRIGERATED', 'CONTAINER_20', 'CONTAINER_40', 'TANKER', 'CURTAINSIDER', 'BOX_TRUCK', 'LOWBED', 'SMALL_VAN', 'CONTAINER_TRAILER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'CLIENT_USER', 'CARRIER_ADMIN', 'CARRIER_USER', 'DRIVER');

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimatedHours" INTEGER,
    "proposedPickupDate" TIMESTAMP(3),
    "proposedDeliveryDate" TIMESTAMP(3),

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'ar',
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "logo" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "website" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'basic',
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "licenseType" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'OFF_DUTY',
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "photo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "orderId" TEXT,
    "issuerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "vatNumber" TEXT,
    "crNumber" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" TEXT NOT NULL DEFAULT 'OPEN',
    "targetCarrierId" TEXT,
    "tripType" TEXT NOT NULL DEFAULT 'INTER_CITY',
    "pickupWindow" TEXT NOT NULL DEFAULT 'ALL_DAY',
    "clientId" TEXT NOT NULL,
    "carrierId" TEXT,
    "cargoType" "CargoType" NOT NULL,
    "cargoDescription" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "pallets" INTEGER,
    "volume" DOUBLE PRECISION,
    "originCity" TEXT NOT NULL,
    "originRegion" TEXT NOT NULL,
    "originAddress" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "destinationCity" TEXT NOT NULL,
    "destinationRegion" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "requiredTruckType" "TruckType" NOT NULL,
    "requiresRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "requiresInsurance" BOOLEAN NOT NULL DEFAULT false,
    "specialInstructions" TEXT,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "bidDeadline" TIMESTAMP(3),
    "clientBudget" DOUBLE PRECISION,
    "agreedPrice" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "carrierAmount" DOUBLE PRECISION,
    "actualPickupAt" TIMESTAMP(3),
    "actualDeliveryAt" TIMESTAMP(3),
    "poNumber" TEXT,
    "bolNumber" TEXT,
    "documents" TEXT[],
    "clientRating" INTEGER,
    "carrierRating" INTEGER,
    "notes" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDriver" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTruck" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTruck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "carrierAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "transactionRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "onTime" BOOLEAN,
    "cargoCondition" BOOLEAN,
    "communication" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "openedBy" TEXT NOT NULL,
    "companyId" TEXT,
    "attachments" TEXT[],
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "city" TEXT,
    "photos" TEXT[],
    "signature" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "type" "TruckType" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "hasRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "hasGPS" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photos" TEXT[],
    "documents" TEXT[],
    "currentDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'ar',
    "companyRole" "CompanyRole" NOT NULL DEFAULT 'STAFF',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType" ASC, "resourceId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Bid_orderId_carrierId_key" ON "Bid"("orderId" ASC, "carrierId" ASC);

-- CreateIndex
CREATE INDEX "Bid_orderId_status_idx" ON "Bid"("orderId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Company_city_idx" ON "Company"("city" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Company_crNumber_key" ON "Company"("crNumber" ASC);

-- CreateIndex
CREATE INDEX "Company_type_status_idx" ON "Company"("type" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_orderId_key" ON "Dispute"("orderId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_licenseNumber_key" ON "DriverProfile"("licenseNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId" ASC);

-- CreateIndex
CREATE INDEX "LocationHistory_driverId_recordedAt_idx" ON "LocationHistory"("driverId" ASC, "recordedAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId" ASC, "isRead" ASC);

-- CreateIndex
CREATE INDEX "Order_carrierId_status_idx" ON "Order"("carrierId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Order_clientId_status_idx" ON "Order"("clientId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber" ASC);

-- CreateIndex
CREATE INDEX "Order_originCity_destinationCity_idx" ON "Order"("originCity" ASC, "destinationCity" ASC);

-- CreateIndex
CREATE INDEX "Order_pickupDate_idx" ON "Order"("pickupDate" ASC);

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OrderDriver_orderId_driverId_key" ON "OrderDriver"("orderId" ASC, "driverId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OrderTruck_orderId_truckId_key" ON "OrderTruck"("orderId" ASC, "truckId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token" ASC);

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId" ASC);

-- CreateIndex
CREATE INDEX "Review_reviewedId_idx" ON "Review"("reviewedId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key" ASC);

-- CreateIndex
CREATE INDEX "SupportTicket_companyId_idx" ON "SupportTicket"("companyId" ASC);

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status" ASC);

-- CreateIndex
CREATE INDEX "TrackingEvent_orderId_idx" ON "TrackingEvent"("orderId" ASC);

-- CreateIndex
CREATE INDEX "Transaction_companyId_createdAt_idx" ON "Transaction"("companyId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Truck_companyId_idx" ON "Truck"("companyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plateNumber_key" ON "Truck"("plateNumber" ASC);

-- CreateIndex
CREATE INDEX "Truck_type_idx" ON "Truck"("type" ASC);

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role" ASC);

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYCDocument" ADD CONSTRAINT "KYCDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_targetCarrierId_fkey" FOREIGN KEY ("targetCarrierId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDriver" ADD CONSTRAINT "OrderDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDriver" ADD CONSTRAINT "OrderDriver_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTruck" ADD CONSTRAINT "OrderTruck_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTruck" ADD CONSTRAINT "OrderTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_currentDriverId_fkey" FOREIGN KEY ("currentDriverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

