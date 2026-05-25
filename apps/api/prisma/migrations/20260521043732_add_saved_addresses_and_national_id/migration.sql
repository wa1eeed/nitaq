-- CreateEnum
CREATE TYPE "AddressKind" AS ENUM ('PICKUP', 'DESTINATION', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nationalId" TEXT;

-- CreateTable
CREATE TABLE "SavedAddress" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "kind" "AddressKind" NOT NULL DEFAULT 'BOTH',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedAddress_companyId_idx" ON "SavedAddress"("companyId");

-- AddForeignKey
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
