import type {
  BidStatus,
  CargoType,
  CompanyStatus,
  CompanyType,
  DisputeStatus,
  EmployeeStatus,
  InvoiceStatus,
  KYCStatus,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ServiceType,
  UserRole,
} from './enums';

export interface User {
  id: string;
  email: string | null;
  phone: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  type: CompanyType;
  status: CompanyStatus;
  kycStatus: KYCStatus;
  nameAr: string;
  nameEn: string | null;
  crNumber: string | null;
  vatNumber: string | null;
  logo: string | null;
  city: string;
  region: string;
  address: string | null;
  contactPhone: string;
  contactEmail: string;
  website: string | null;
  commissionRate: number;
  creditLimit: number;
  walletBalance: number;
  subscriptionPlan: string;
  subscriptionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  clientId: string;
  providerId: string | null;
  cargoType: CargoType;
  cargoDescription: string;
  weight: number;
  pallets: number | null;
  volume: number | null;
  originCity: string;
  originRegion: string;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destinationCity: string;
  destinationRegion: string;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  requiredServiceType: ServiceType;
  requiresRefrigeration: boolean;
  requiresInsurance: boolean;
  specialInstructions: string | null;
  pickupDate: string;
  deliveryDate: string | null;
  bidDeadline: string | null;
  clientBudget: number | null;
  agreedPrice: number | null;
  commissionAmount: number | null;
  providerAmount: number | null;
  actualPickupAt: string | null;
  actualDeliveryAt: string | null;
  poNumber: string | null;
  bolNumber: string | null;
  documents: string[];
  clientRating: number | null;
  providerRating: number | null;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Company;
  provider?: Company | null;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  orderId: string;
  providerId: string;
  amount: number;
  status: BidStatus;
  estimatedDays: number;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  provider?: Company;
}

export interface Service {
  id: string;
  companyId: string;
  serviceCode: string;
  type: ServiceType;
  capacity: number;
  length: number | null;
  width: number | null;
  height: number | null;
  make: string | null;
  model: string | null;
  year: number | null;
  hasRefrigeration: boolean;
  hasGPS: boolean;
  isActive: boolean;
  photos: string[];
  documents: string[];
  currentEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
}
/** @deprecated use Service */
export type Truck = Service;

export interface Employee {
  id: string;
  userId: string;
  companyId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  status: EmployeeStatus;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationAt: string | null;
  rating: number;
  totalAssignments: number;
  photo: string | null;
  isActive: boolean;
  user?: User;
}
/** @deprecated use Employee */
export type Driver = Employee;

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  totalAmount: number;
  commissionAmount: number;
  providerAmount: number;
  paymentMethod: string | null;
  transactionRef: string | null;
  paidAt: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  orderId: string | null;
  issuerId: string;
  receiverId: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  vatNumber: string | null;
  crNumber: string | null;
  notes: string | null;
  pdfUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  description: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  photos: string[];
  signature: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string | null;
  bodyAr: string;
  bodyEn: string | null;
  isRead: boolean;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: string;
  description: string;
  openedBy: string;
  assignedTo: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}
