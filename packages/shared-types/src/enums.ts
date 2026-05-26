export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CLIENT_ADMIN: 'CLIENT_ADMIN',
  CLIENT_USER: 'CLIENT_USER',
  CARRIER_ADMIN: 'CARRIER_ADMIN',
  CARRIER_USER: 'CARRIER_USER',
  DRIVER: 'DRIVER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CompanyType = {
  CLIENT: 'CLIENT',
  CARRIER: 'CARRIER',
} as const;
export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

export const CompanyStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

export const KYCStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  BIDDING: 'BIDDING',
  ASSIGNED: 'ASSIGNED',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ServiceType = {
  SMALL_FLATBED: 'SMALL_FLATBED',
  MEDIUM_FLATBED: 'MEDIUM_FLATBED',
  LARGE_FLATBED: 'LARGE_FLATBED',
  REFRIGERATED: 'REFRIGERATED',
  CONTAINER_20: 'CONTAINER_20',
  CONTAINER_40: 'CONTAINER_40',
  TANKER: 'TANKER',
  CURTAINSIDER: 'CURTAINSIDER',
  BOX_TRUCK: 'BOX_TRUCK',
  LOWBED: 'LOWBED',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];
/** @deprecated use ServiceType */
export const TruckType = ServiceType;
/** @deprecated use ServiceType */
export type TruckType = ServiceType;

export const CargoType = {
  GENERAL: 'GENERAL',
  FOOD: 'FOOD',
  CHEMICALS: 'CHEMICALS',
  ELECTRONICS: 'ELECTRONICS',
  FURNITURE: 'FURNITURE',
  CONSTRUCTION: 'CONSTRUCTION',
  AUTOMOTIVE: 'AUTOMOTIVE',
  MEDICAL: 'MEDICAL',
  HAZARDOUS: 'HAZARDOUS',
  FRAGILE: 'FRAGILE',
} as const;
export type CargoType = (typeof CargoType)[keyof typeof CargoType];

export const BidStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  EXPIRED: 'EXPIRED',
} as const;
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const NotificationType = {
  ORDER_CREATED: 'ORDER_CREATED',
  BID_RECEIVED: 'BID_RECEIVED',
  BID_ACCEPTED: 'BID_ACCEPTED',
  BID_REJECTED: 'BID_REJECTED',
  ORDER_ASSIGNED: 'ORDER_ASSIGNED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
  KYC_APPROVED: 'KYC_APPROVED',
  KYC_REJECTED: 'KYC_REJECTED',
  DISPUTE_OPENED: 'DISPUTE_OPENED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const EmployeeStatus = {
  AVAILABLE: 'AVAILABLE',
  ON_ASSIGNMENT: 'ON_ASSIGNMENT',
  OFF_DUTY: 'OFF_DUTY',
} as const;
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];
/** @deprecated use EmployeeStatus */
export const DriverStatus = EmployeeStatus;
/** @deprecated use EmployeeStatus */
export type DriverStatus = EmployeeStatus;
