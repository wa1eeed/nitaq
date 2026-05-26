/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Naqla — realistic mock data for the UI-first prototype.
 * Mirrors the production domain (companies, KYC, orders, bids, fleet, payments,
 * disputes) with believable Saudi names and figures.
 */

// ─── Types ────────────────────────────────────────────────────────────

export type CompanyKind = 'CLIENT' | 'CARRIER';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
/**
 * Account type for an entity registered as a CARRIER (or CLIENT).
 * - COMPANY:    شركة نقل مرخّصة (سجل تجاري + ضريبة)
 * - INDIVIDUAL: ناقل فرد يمتلك شاحنة/شاحنات على هويته (لا سجل تجاري)
 *
 * For Saudi compliance:
 * - Individual carriers must hold a valid driver's license (with appropriate
 *   class for heavy vehicles), vehicle Istimara, and personal liability
 *   insurance. VAT registration is optional for individuals below the
 *   mandatory threshold (375,000 SAR annual turnover).
 */
export type AccountType = 'COMPANY' | 'INDIVIDUAL';

export interface Company {
  id: string;
  kind: CompanyKind;
  /** Defaults to 'COMPANY' for legacy entries. Individuals use 'INDIVIDUAL'. */
  accountType?: AccountType;
  nameAr: string;
  nameEn: string;
  /** Commercial registration — empty string for individuals */
  crNumber: string;
  /** VAT — empty string when not registered (individuals below threshold) */
  vatNumber: string;
  /** Individual-only: National ID (10 digits) replacing CR */
  nationalId?: string;
  city: string;
  region: string;
  joinedAt: string;
  kycStatus: KycStatus;
  contactEmail: string;
  contactPhone: string;
  /** for CARRIERs */
  rating?: number;        // 0..5
  completedTrips?: number;
  fleetSize?: number;
  responseTimeMins?: number;
  insurance?: boolean;
  /** for CLIENTs */
  monthlyVolume?: number; // SAR/month
}

export type TruckType =
  | 'SMALL_VAN' | 'BOX_TRUCK' | 'MEDIUM_FLATBED' | 'LARGE_FLATBED'
  | 'REFRIGERATED' | 'TANKER' | 'LOWBED' | 'CONTAINER_TRAILER';

export type CargoType =
  | 'GENERAL' | 'FRAGILE' | 'PERISHABLE' | 'HAZARDOUS'
  | 'OVERSIZED' | 'CONSTRUCTION' | 'AUTOMOTIVE' | 'LIVESTOCK';

export type OrderStatus =
  | 'DRAFT' | 'PUBLISHED' | 'BIDDING' | 'ASSIGNED'
  | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export type OrderMode = 'OPEN' | 'DIRECT';

/**
 * Pickup time window — the client picks a band; the carrier confirms an exact
 * time within it when accepting the bid. Mirrors the UI options in the New
 * Order wizard step 2.
 */
export type PickupWindow = 'MORNING' | 'EVENING' | 'ALL_DAY';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  mode: OrderMode;
  /** if mode === DIRECT, the targeted carrier id. */
  targetCarrierId?: string;
  clientId: string;
  carrierId?: string;
  cargoType: CargoType;
  cargoDescription: string;
  weightKg: number;
  truckType: TruckType;
  originCity: string;
  originAddress: string;
  destinationCity: string;
  destinationAddress: string;
  pickupDate: string;
  /** Time band requested by the client. Defaults to ALL_DAY when not set. */
  pickupWindow?: PickupWindow;
  deliveryDate?: string;
  /**
   * Internal budget hint — visible to admin and client only.
   * NEVER exposed to carriers in opportunities/bidding UI to avoid
   * anchoring bid prices. Optional in the new-order form.
   */
  clientBudget?: number;
  agreedPrice: number | null;
  /** @deprecated use providerAmount */
  carrierAmount?: number | null;
  /** Net amount received by the provider (carrier) after platform commission. */
  providerAmount?: number | null;
  /** Id of the provider (carrier) company assigned to this order. */
  providerId?: string | null;
  commission?: number | null;
  requiresInsurance: boolean;
  requiresRefrigeration: boolean;
  specialInstructions?: string;
  createdAt: string;
  bidCount: number;
}

export interface Bid {
  id: string;
  orderId: string;
  carrierId: string;
  price: number;
  estimatedDays: number;
  /**
   * Hours-component of the carrier's estimated duration (added to estimatedDays
   * for finer-grained ETA on intra-day trips, e.g. "1 يوم و 6 ساعات"). Optional.
   */
  estimatedHours?: number;
  /**
   * Carrier's confirmation of the pickup. Either echoes the client-requested
   * date (most common) or proposes a different one. When `proposedPickupDate`
   * differs from `Order.pickupDate`, the bid is essentially a counter-offer
   * on timing — the client UI flags it visibly.
   */
  proposedPickupDate?: string;
  /**
   * Computed estimated delivery date = proposedPickupDate (or order.pickupDate)
   * + estimatedDays + estimatedHours. Pre-computed by the bidder for the
   * comparison table so the client sees concrete dates, not just "~3 days".
   */
  estimatedDeliveryDate?: string;
  /**
   * Carrier's explicit proposed delivery date — replaces the older
   * estimatedDays/Hours duration fields (v0.8.x). When set, the order
   * detail page prefers this over any computed estimate.
   */
  proposedDeliveryDate?: string;
  truckType: TruckType;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  createdAt: string;
}

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
export interface Driver {
  id: string;
  carrierId: string;
  fullName: string;
  nationalId: string;
  licenseClass: string;
  licenseExpiry: string;
  phone: string;
  status: DriverStatus;
  assignedTruckId?: string;
  totalTrips: number;
}

export type TruckStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'OFF_DUTY';
export interface Truck {
  id: string;
  carrierId: string;
  plateNumber: string;
  truckType: TruckType;
  capacityKg: number;
  modelYear: number;
  status: TruckStatus;
  lastInspection: string;
  assignedDriverId?: string;
}

export type EscrowState = 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  carrierId: string;
  amount: number;
  commission: number;
  vat: number;
  state: EscrowState;
  paidAt: string;
  releasedAt?: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: 'CLIENT' | 'CARRIER';
  raisedById: string;
  status: DisputeStatus;
  reason: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  clientId: string;
  amount: number;
  vat: number;
  total: number;
  status: 'ISSUED' | 'PAID' | 'OVERDUE';
  issuedAt: string;
  dueAt: string;
}

export type TimelineEventKind =
  | 'CREATED' | 'PUBLISHED' | 'BID_RECEIVED' | 'BID_ACCEPTED'
  | 'CONFIRMED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'
  | 'PAYMENT_RELEASED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface TimelineEvent {
  kind: TimelineEventKind;
  at: string;
  by?: string;
  note?: string;
}

// ─── Companies ────────────────────────────────────────────────────────

export const COMPANIES: Company[] = [
  // ── Clients ──
  { id: 'CL-1001', kind: 'CLIENT', nameAr: 'شركة الجزيرة للطاقة',         nameEn: 'Jazira Energy Co.',         crNumber: '1010098765', vatNumber: '300012345600003', city: 'الرياض',    region: 'الرياض',       joinedAt: '2024-03-12T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'procurement@jazira-energy.sa',   contactPhone: '+966550112233', monthlyVolume: 1850000 },
  { id: 'CL-1002', kind: 'CLIENT', nameAr: 'شركة المنارة للتقنية',        nameEn: 'Manara Tech Co.',           crNumber: '1010012345', vatNumber: '300011223300003', city: 'جدة',       region: 'مكة المكرمة',  joinedAt: '2024-06-08T09:00:00Z', kycStatus: 'PENDING_VERIFICATION', contactEmail: 'logistics@manara-tech.sa',       contactPhone: '+966551234567', monthlyVolume:  420000 },
  { id: 'CL-1003', kind: 'CLIENT', nameAr: 'شركة الفهد للمقاولات',        nameEn: 'Al-Fahd Contracting',       crNumber: '1010055443', vatNumber: '300015544300003', city: 'الدمام',    region: 'الشرقية',      joinedAt: '2023-11-22T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'ops@al-fahd.sa',                 contactPhone: '+966552233445', monthlyVolume:  980000 },
  { id: 'CL-1004', kind: 'CLIENT', nameAr: 'شركة الشروق للنقل والتجارة',  nameEn: 'Shorouk Trading',           crNumber: '1010078901', vatNumber: '300017890100003', city: 'الرياض',    region: 'الرياض',       joinedAt: '2025-01-15T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'supply@shorouk-co.sa',           contactPhone: '+966554455667', monthlyVolume:  310000 },
  { id: 'CL-1005', kind: 'CLIENT', nameAr: 'مؤسسة الواحة للمواد الغذائية', nameEn: 'Oasis Foodstuff Est.',      crNumber: '1010033221', vatNumber: '300013322100003', city: 'مكة المكرمة',region: 'مكة المكرمة',  joinedAt: '2024-09-30T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'cs@oasis-food.sa',               contactPhone: '+966556677889', monthlyVolume:  640000 },
  { id: 'CL-1006', kind: 'CLIENT', nameAr: 'شركة الخليج للبتروكيماويات',  nameEn: 'Gulf Petrochemicals',       crNumber: '1010099887', vatNumber: '300019988700003', city: 'الجبيل',    region: 'الشرقية',      joinedAt: '2024-02-04T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'transport@gulf-petro.sa',        contactPhone: '+966557788990', monthlyVolume: 2750000 },

  // ── Carriers ──
  { id: 'CR-2001', kind: 'CARRIER', nameAr: 'شركة المسار السريع للنقل',  nameEn: 'Fast Route Logistics',      crNumber: '2050012345', vatNumber: '300012340500003', city: 'الرياض', region: 'الرياض',      joinedAt: '2023-08-10T09:00:00Z', kycStatus: 'APPROVED', contactEmail: 'fleet@fastroute.sa', contactPhone: '+966553344556', rating: 4.7, completedTrips: 1240, fleetSize: 32, responseTimeMins: 12, insurance: true },
  { id: 'CR-2002', kind: 'CARRIER', nameAr: 'مؤسسة درب الأمان',          nameEn: 'Safe Path Est.',            crNumber: '2050044556', vatNumber: '300014455600003', city: 'جدة',    region: 'مكة المكرمة', joinedAt: '2024-01-22T09:00:00Z', kycStatus: 'APPROVED', contactEmail: 'ops@darb-aman.sa',   contactPhone: '+966554455778', rating: 4.5, completedTrips:  860, fleetSize: 18, responseTimeMins: 22, insurance: true },
  { id: 'CR-2003', kind: 'CARRIER', nameAr: 'شركة الناقل الأمين',         nameEn: 'Trusted Carrier Co.',       crNumber: '2050066778', vatNumber: '300016677800003', city: 'الدمام', region: 'الشرقية',     joinedAt: '2022-04-18T09:00:00Z', kycStatus: 'APPROVED', contactEmail: 'dispatch@trusted-c.sa', contactPhone: '+966555566889', rating: 4.9, completedTrips: 2180, fleetSize: 54, responseTimeMins:  8, insurance: true },
  { id: 'CR-2004', kind: 'CARRIER', nameAr: 'مؤسسة بريق النقل',           nameEn: 'Bariq Transport',           crNumber: '2050088990', vatNumber: '300018899000003', city: 'الرياض', region: 'الرياض',      joinedAt: '2024-10-04T09:00:00Z', kycStatus: 'PENDING_VERIFICATION', contactEmail: 'info@bariq.sa', contactPhone: '+966556677001', rating: 4.2, completedTrips:  240, fleetSize:  9, responseTimeMins: 35, insurance: false },
  { id: 'CR-2005', kind: 'CARRIER', nameAr: 'شركة النقل المتطور',         nameEn: 'Advanced Transport Co.',    crNumber: '2050010112', vatNumber: '300010101200003', city: 'الخبر',  region: 'الشرقية',     joinedAt: '2023-12-01T09:00:00Z', kycStatus: 'APPROVED', contactEmail: 'fleet@advanced-t.sa',   contactPhone: '+966557788113', rating: 4.6, completedTrips:  720, fleetSize: 26, responseTimeMins: 14, insurance: true },
  { id: 'CR-2006', kind: 'CARRIER', accountType: 'COMPANY', nameAr: 'مؤسسة قافلة الجزيرة',        nameEn: 'Jazira Caravan Est.',       crNumber: '2050022113', vatNumber: '300012211300003', city: 'بريدة',  region: 'القصيم',      joinedAt: '2024-07-29T09:00:00Z', kycStatus: 'APPROVED', contactEmail: 'ops@jazira-c.sa', contactPhone: '+966558899224', rating: 4.3, completedTrips:  410, fleetSize: 14, responseTimeMins: 28, insurance: true },

  // ── Individual carriers (ناقلون أفراد — أصحاب شاحنات بدون سجل تجاري) ──
  { id: 'CR-3001', kind: 'CARRIER', accountType: 'INDIVIDUAL', nameAr: 'سعد بن مرزوق العتيبي',  nameEn: 'Saad Al-Otaibi',     crNumber: '', vatNumber: '',              nationalId: '1078451234', city: 'الرياض', region: 'الرياض',       joinedAt: '2025-03-08T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'saad.alotaibi@gmail.com',  contactPhone: '+966551234500', rating: 4.6, completedTrips:  148, fleetSize: 2, responseTimeMins: 18, insurance: true },
  { id: 'CR-3002', kind: 'CARRIER', accountType: 'INDIVIDUAL', nameAr: 'فهد بن ناصر الشهري',     nameEn: 'Fahad Al-Shehri',    crNumber: '', vatNumber: '',              nationalId: '1089762345', city: 'جدة',    region: 'مكة المكرمة',  joinedAt: '2025-01-19T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'fahad.shehri@outlook.com', contactPhone: '+966552233100', rating: 4.4, completedTrips:   62, fleetSize: 1, responseTimeMins: 25, insurance: true },
  { id: 'CR-3003', kind: 'CARRIER', accountType: 'INDIVIDUAL', nameAr: 'عبدالله بن خالد الزهراني', nameEn: 'Abdullah Al-Zahrani', crNumber: '', vatNumber: '300055667700003', nationalId: '1056781234', city: 'الدمام', region: 'الشرقية',      joinedAt: '2024-11-02T09:00:00Z', kycStatus: 'APPROVED',             contactEmail: 'a.zahrani@gmail.com',      contactPhone: '+966554455200', rating: 4.8, completedTrips:  220, fleetSize: 3, responseTimeMins: 11, insurance: true },
  { id: 'CR-3004', kind: 'CARRIER', accountType: 'INDIVIDUAL', nameAr: 'ناصر بن فهد الحربي',     nameEn: 'Nasser Al-Harbi',    crNumber: '', vatNumber: '',              nationalId: '1067891234', city: 'الرياض', region: 'الرياض',       joinedAt: '2025-04-15T09:00:00Z', kycStatus: 'PENDING_VERIFICATION', contactEmail: 'n.alharbi@gmail.com',      contactPhone: '+966556677300', rating: 4.1, completedTrips:   18, fleetSize: 1, responseTimeMins: 42, insurance: true },
];

// ─── Orders ───────────────────────────────────────────────────────────

// Note: `id` matches `orderNumber` slugified for routing convenience.
export const ORDERS: Order[] = [
  { id: 'ORD-2025-0142', orderNumber: 'ORD-2025-0142', status: 'COMPLETED',  mode: 'OPEN',   clientId: 'CL-1001', carrierId: 'CR-2003', cargoType: 'GENERAL',      cargoDescription: 'معدّات حقول النفط - أنابيب صلب',        weightKg: 24000, truckType: 'LARGE_FLATBED',     originCity: 'الرياض',     originAddress: 'حي السلي، مستودع الجزيرة', destinationCity: 'الدمام',          destinationAddress: 'ميناء الملك عبدالعزيز، البوابة 3', pickupDate: '2026-04-10T08:00:00Z', deliveryDate: '2026-04-12T16:30:00Z', clientBudget: 110000, agreedPrice: 105580, carrierAmount: 97134, commission:  8446, requiresInsurance: true,  requiresRefrigeration: false, createdAt: '2026-04-05T12:00:00Z', bidCount: 5 },
  { id: 'ORD-2025-0148', orderNumber: 'ORD-2025-0148', status: 'DELIVERED',  mode: 'OPEN',   clientId: 'CL-1005', carrierId: 'CR-2002', cargoType: 'PERISHABLE',   cargoDescription: 'حاويات مبرّدة - منتجات ألبان',          weightKg: 12500, truckType: 'REFRIGERATED',      originCity: 'جدة',         originAddress: 'مستودع التبريد المركزي، حي العزيزية', destinationCity: 'الرياض',          destinationAddress: 'سوق العزيزية المركزي',             pickupDate: '2026-05-08T05:00:00Z', deliveryDate: '2026-05-09T09:00:00Z', clientBudget: 50000,  agreedPrice:  48784, carrierAmount: 44881, commission:  3903, requiresInsurance: true,  requiresRefrigeration: true,  createdAt: '2026-05-02T09:30:00Z', bidCount: 7 },
  { id: 'ORD-2025-0150', orderNumber: 'ORD-2025-0150', status: 'IN_TRANSIT', mode: 'OPEN',   clientId: 'CL-1001', carrierId: 'CR-2001', cargoType: 'GENERAL',      cargoDescription: 'معدّات صناعية ثقيلة - مضخات',           weightKg: 18000, truckType: 'LARGE_FLATBED',     originCity: 'الرياض',     originAddress: 'المنطقة الصناعية الثانية', destinationCity: 'جدة',             destinationAddress: 'ميناء جدة الإسلامي، الرصيف 12',      pickupDate: '2026-05-13T07:00:00Z', clientBudget: 95000,  agreedPrice:  80464, carrierAmount: 74027, commission:  6437, requiresInsurance: true,  requiresRefrigeration: false, createdAt: '2026-05-10T11:20:00Z', bidCount: 6 },
  { id: 'ORD-2025-0155', orderNumber: 'ORD-2025-0155', status: 'BIDDING',    mode: 'OPEN',   clientId: 'CL-1002', cargoType: 'FRAGILE',      cargoDescription: 'خوادم وأجهزة Networking — حِزَم Dell',     weightKg:  4800, truckType: 'BOX_TRUCK',         originCity: 'جدة',         originAddress: 'مكاتب المنارة، حي الروضة', destinationCity: 'الطائف',          destinationAddress: 'مركز البيانات الإقليمي',           pickupDate: '2026-05-17T09:00:00Z', clientBudget: 12000,  agreedPrice: null,                                              requiresInsurance: true,  requiresRefrigeration: false, createdAt: '2026-05-12T14:15:00Z', bidCount: 4 },
  { id: 'ORD-2025-0160', orderNumber: 'ORD-2025-0160', status: 'PUBLISHED',  mode: 'OPEN',   clientId: 'CL-1005', cargoType: 'PERISHABLE',   cargoDescription: 'منتجات ألبان مبرّدة — توزيع جنوب',         weightKg:  9500, truckType: 'REFRIGERATED',      originCity: 'الرياض',     originAddress: 'مستودع الواحة، حي الشفاء', destinationCity: 'أبها',            destinationAddress: 'مستودع التوزيع الإقليمي',          pickupDate: '2026-05-17T05:00:00Z', clientBudget: 26000,  agreedPrice: null,                                              requiresInsurance: true,  requiresRefrigeration: true,  createdAt: '2026-05-13T08:00:00Z', bidCount: 0 },
  { id: 'ORD-2025-0162', orderNumber: 'ORD-2025-0162', status: 'PUBLISHED',  mode: 'OPEN',   clientId: 'CL-1003', cargoType: 'CONSTRUCTION', cargoDescription: 'مواد بناء — رمل وحصى مغسول',              weightKg: 32000, truckType: 'LARGE_FLATBED',     originCity: 'الدمام',     originAddress: 'محجر الفهد، شمال المدينة',  destinationCity: 'الرياض',          destinationAddress: 'موقع المشروع، شمال الرياض',         pickupDate: '2026-05-19T06:00:00Z', clientBudget:  8400,  agreedPrice: null,                                              requiresInsurance: false, requiresRefrigeration: false, createdAt: '2026-05-13T10:30:00Z', bidCount: 0 },
  { id: 'ORD-2025-0165', orderNumber: 'ORD-2025-0165', status: 'DRAFT',      mode: 'OPEN',   clientId: 'CL-1004', cargoType: 'GENERAL',      cargoDescription: 'بضاعة عامة معبأة في طبليّات',               weightKg:  6000, truckType: 'BOX_TRUCK',         originCity: 'الرياض',     originAddress: '— لم يُحدّد بعد —',                       destinationCity: 'بريدة',           destinationAddress: '— لم يُحدّد بعد —',                  pickupDate: '2026-05-18T09:00:00Z', clientBudget: 0,      agreedPrice: null,                                              requiresInsurance: false, requiresRefrigeration: false, createdAt: '2026-05-13T16:00:00Z', bidCount: 0 },
  { id: 'ORD-2025-0145', orderNumber: 'ORD-2025-0145', status: 'CANCELLED',  mode: 'OPEN',   clientId: 'CL-1005', cargoType: 'GENERAL',      cargoDescription: 'مواد تعبئة وتغليف',                       weightKg:  3200, truckType: 'BOX_TRUCK',         originCity: 'الرياض',     originAddress: 'حي العليا',                 destinationCity: 'مكة المكرمة',     destinationAddress: 'المنطقة الصناعية',                  pickupDate: '2026-05-15T10:00:00Z', clientBudget: 30000,  agreedPrice:  30800, carrierAmount: 28336, commission:  2464, requiresInsurance: false, requiresRefrigeration: false, createdAt: '2026-05-09T11:00:00Z', bidCount: 3 },
  // Direct request example
  { id: 'ORD-2025-0170', orderNumber: 'ORD-2025-0170', status: 'PUBLISHED',  mode: 'DIRECT', targetCarrierId: 'CR-2003', clientId: 'CL-1001', cargoType: 'OVERSIZED', cargoDescription: 'محوّل كهربائي عملاق — حمولة استثنائية', weightKg: 45000, truckType: 'LOWBED', originCity: 'الجبيل', originAddress: 'مصنع الخليج للبتروكيماويات', destinationCity: 'الرياض', destinationAddress: 'محطة الكهرباء، شرق الرياض', pickupDate: '2026-05-20T05:00:00Z', clientBudget: 165000, agreedPrice: null, requiresInsurance: true, requiresRefrigeration: false, specialInstructions: 'تنسيق مسبق مع المرور لشحنة عريضة + مرافقة أمنية', createdAt: '2026-05-13T19:00:00Z', bidCount: 0 },
];

// ─── Bids ─────────────────────────────────────────────────────────────

export const BIDS: Bid[] = [
  // Bids for ORD-2025-0155 (BIDDING) - 4 competing carriers
  { id: 'BID-3001', orderId: 'ORD-2025-0155', carrierId: 'CR-2001', price: 11500, estimatedDays: 1, truckType: 'BOX_TRUCK', notes: 'استلام نفس اليوم، تأمين شامل مرفق.',         status: 'PENDING', createdAt: '2026-05-12T15:00:00Z' },
  { id: 'BID-3002', orderId: 'ORD-2025-0155', carrierId: 'CR-2003', price: 10800, estimatedDays: 1, truckType: 'BOX_TRUCK', notes: 'خبرة سابقة مع نقل المعدات الإلكترونية.',     status: 'PENDING', createdAt: '2026-05-12T16:20:00Z' },
  { id: 'BID-3003', orderId: 'ORD-2025-0155', carrierId: 'CR-2002', price: 12200, estimatedDays: 2, truckType: 'BOX_TRUCK',                                                        status: 'PENDING', createdAt: '2026-05-12T17:45:00Z' },
  { id: 'BID-3004', orderId: 'ORD-2025-0155', carrierId: 'CR-2005', price: 11200, estimatedDays: 1, truckType: 'MEDIUM_FLATBED', notes: 'شاحنة جديدة 2025، GPS لحظي.',          status: 'PENDING', createdAt: '2026-05-12T19:10:00Z' },

  // Historical bids for completed orders
  { id: 'BID-3005', orderId: 'ORD-2025-0142', carrierId: 'CR-2003', price: 105580, estimatedDays: 2, truckType: 'LARGE_FLATBED', status: 'ACCEPTED',  createdAt: '2026-04-05T13:30:00Z' },
  { id: 'BID-3006', orderId: 'ORD-2025-0142', carrierId: 'CR-2001', price: 108200, estimatedDays: 2, truckType: 'LARGE_FLATBED', status: 'REJECTED',  createdAt: '2026-04-05T14:00:00Z' },
  { id: 'BID-3007', orderId: 'ORD-2025-0148', carrierId: 'CR-2002', price:  48784, estimatedDays: 1, truckType: 'REFRIGERATED',  status: 'ACCEPTED',  createdAt: '2026-05-02T11:00:00Z' },
  { id: 'BID-3008', orderId: 'ORD-2025-0150', carrierId: 'CR-2001', price:  80464, estimatedDays: 2, truckType: 'LARGE_FLATBED', status: 'ACCEPTED',  createdAt: '2026-05-10T13:00:00Z' },
];

// ─── Fleet (Carrier-side) — sample for CR-2001 (logged-in carrier) ───

export const TRUCKS: Truck[] = [
  { id: 'TRK-001', carrierId: 'CR-2001', plateNumber: 'أ ب ج 1234', truckType: 'LARGE_FLATBED', capacityKg: 25000, modelYear: 2023, status: 'ON_TRIP',     lastInspection: '2026-03-15T00:00:00Z', assignedDriverId: 'DRV-001' },
  { id: 'TRK-002', carrierId: 'CR-2001', plateNumber: 'د هـ و 5678', truckType: 'BOX_TRUCK',     capacityKg:  8000, modelYear: 2024, status: 'AVAILABLE',   lastInspection: '2026-04-02T00:00:00Z' },
  { id: 'TRK-003', carrierId: 'CR-2001', plateNumber: 'ز ح ط 9012', truckType: 'REFRIGERATED',  capacityKg: 15000, modelYear: 2022, status: 'AVAILABLE',   lastInspection: '2026-02-20T00:00:00Z', assignedDriverId: 'DRV-002' },
  { id: 'TRK-004', carrierId: 'CR-2001', plateNumber: 'ي ك ل 3456', truckType: 'MEDIUM_FLATBED', capacityKg: 18000, modelYear: 2021, status: 'MAINTENANCE', lastInspection: '2026-01-08T00:00:00Z' },
  { id: 'TRK-005', carrierId: 'CR-2001', plateNumber: 'م ن س 7890', truckType: 'LOWBED',         capacityKg: 50000, modelYear: 2023, status: 'AVAILABLE',   lastInspection: '2026-04-30T00:00:00Z', assignedDriverId: 'DRV-003' },
];

export const DRIVERS: Driver[] = [
  { id: 'DRV-001', carrierId: 'CR-2001', fullName: 'أحمد بن سعد الغامدي',    nationalId: '1023456789', licenseClass: 'تركيب وقاطرة', licenseExpiry: '2027-06-12', phone: '+966550001122', status: 'ON_TRIP',   assignedTruckId: 'TRK-001', totalTrips: 312 },
  { id: 'DRV-002', carrierId: 'CR-2001', fullName: 'خالد بن محمد العتيبي',    nationalId: '1029988776', licenseClass: 'حمولة ثقيلة',  licenseExpiry: '2028-02-25', phone: '+966550002233', status: 'AVAILABLE', assignedTruckId: 'TRK-003', totalTrips: 198 },
  { id: 'DRV-003', carrierId: 'CR-2001', fullName: 'سلطان بن عبدالله القحطاني', nationalId: '1011223344', licenseClass: 'حمولة استثنائية', licenseExpiry: '2026-11-04', phone: '+966550003344', status: 'AVAILABLE', assignedTruckId: 'TRK-005', totalTrips: 145 },
  { id: 'DRV-004', carrierId: 'CR-2001', fullName: 'فهد بن ناصر الدوسري',    nationalId: '1077889900', licenseClass: 'حمولة ثقيلة',  licenseExpiry: '2027-09-18', phone: '+966550004455', status: 'OFF_DUTY',                                totalTrips: 87 },
];

// ─── Payments ─────────────────────────────────────────────────────────

export const PAYMENTS: Payment[] = [
  { id: 'PAY-9001', orderId: 'ORD-2025-0142', clientId: 'CL-1001', carrierId: 'CR-2003', amount: 105580, commission:  8446, vat: 1267, state: 'RELEASED', paidAt: '2026-04-08T10:00:00Z', releasedAt: '2026-04-12T18:00:00Z' },
  { id: 'PAY-9002', orderId: 'ORD-2025-0148', clientId: 'CL-1005', carrierId: 'CR-2002', amount:  48784, commission:  3903, vat:  585, state: 'HELD',     paidAt: '2026-05-07T11:30:00Z' },
  { id: 'PAY-9003', orderId: 'ORD-2025-0150', clientId: 'CL-1001', carrierId: 'CR-2001', amount:  80464, commission:  6437, vat:  966, state: 'HELD',     paidAt: '2026-05-12T09:15:00Z' },
  { id: 'PAY-9004', orderId: 'ORD-2025-0145', clientId: 'CL-1005', carrierId: 'CR-2003', amount:  30800, commission:  2464, vat:  370, state: 'REFUNDED', paidAt: '2026-05-11T14:00:00Z' },
];

// ─── Disputes ─────────────────────────────────────────────────────────

export const DISPUTES: Dispute[] = [
  { id: 'DSP-2025-0042', orderId: 'ORD-2025-0148', raisedBy: 'CLIENT',  raisedById: 'CL-1005', status: 'UNDER_REVIEW', reason: 'تلف جزئي في البضاعة',     description: 'وصلت بعض الصناديق بأضرار سطحية. مرفق صور.',  createdAt: '2026-05-10T16:00:00Z' },
  { id: 'DSP-2025-0041', orderId: 'ORD-2025-0145', raisedBy: 'CARRIER', raisedById: 'CR-2003', status: 'RESOLVED',     reason: 'تأخر العميل في الاستلام',  description: 'الموقع كان مغلقاً ساعتين بعد موعد التسليم.', createdAt: '2026-05-10T12:00:00Z', resolvedAt: '2026-05-12T15:00:00Z' },
  { id: 'DSP-2025-0040', orderId: 'ORD-2025-0142', raisedBy: 'CLIENT',  raisedById: 'CL-1001', status: 'OPEN',         reason: 'خلاف على رسوم إضافية',     description: 'الناقل يطالب برسوم انتظار غير متفق عليها.', createdAt: '2026-05-13T08:30:00Z' },
];

// ─── Invoices ─────────────────────────────────────────────────────────

export const INVOICES: Invoice[] = [
  { id: 'INV-2025-0142', invoiceNumber: 'INV-2025-0142', orderId: 'ORD-2025-0142', clientId: 'CL-1001', amount: 105580, vat: 15837, total: 121417, status: 'PAID',    issuedAt: '2026-04-08T00:00:00Z', dueAt: '2026-04-22T00:00:00Z' },
  { id: 'INV-2025-0148', invoiceNumber: 'INV-2025-0148', orderId: 'ORD-2025-0148', clientId: 'CL-1005', amount:  48784, vat:  7318, total:  56102, status: 'PAID',    issuedAt: '2026-05-07T00:00:00Z', dueAt: '2026-05-21T00:00:00Z' },
  { id: 'INV-2025-0150', invoiceNumber: 'INV-2025-0150', orderId: 'ORD-2025-0150', clientId: 'CL-1001', amount:  80464, vat: 12070, total:  92534, status: 'ISSUED',  issuedAt: '2026-05-12T00:00:00Z', dueAt: '2026-05-26T00:00:00Z' },
  { id: 'INV-2025-0145', invoiceNumber: 'INV-2025-0145', orderId: 'ORD-2025-0145', clientId: 'CL-1005', amount:  30800, vat:  4620, total:  35420, status: 'OVERDUE', issuedAt: '2026-04-20T00:00:00Z', dueAt: '2026-05-04T00:00:00Z' },
];

// ─── Timelines (per order) ────────────────────────────────────────────

export function timelineFor(orderId: string): TimelineEvent[] {
  const order = ORDERS.find((o) => o.id === orderId);
  if (!order) return [];
  const t = new Date(order.createdAt).getTime();
  const D = 24 * 3600 * 1000;
  const ev = (kind: TimelineEventKind, offsetDays: number, note?: string, by?: string): TimelineEvent => ({
    kind, at: new Date(t + offsetDays * D).toISOString(), note, by,
  });

  switch (order.status) {
    case 'COMPLETED':
      return [
        ev('CREATED',          0, 'إنشاء الطلب', 'العميل'),
        ev('PUBLISHED',        0.05, 'نشر الطلب للسوق'),
        ev('BID_RECEIVED',     0.2, `${order.bidCount} عروض مستلمة`),
        ev('BID_ACCEPTED',     0.4, 'قبول عرض المسار السريع', 'العميل'),
        ev('CONFIRMED',        0.5, 'تأكيد التحميل', 'الناقل'),
        ev('PICKED_UP',        2,   'تم الاستلام من الموقع', 'الناقل'),
        ev('IN_TRANSIT',       2.1, 'الشحنة في الطريق'),
        ev('DELIVERED',        4,   'تم التسليم بنجاح', 'الناقل'),
        ev('PAYMENT_RELEASED', 4.2, 'الإفراج عن المبلغ من Escrow'),
        ev('COMPLETED',        4.5, 'إغلاق الطلب'),
      ];
    case 'IN_TRANSIT':
      return [
        ev('CREATED',     0,   'إنشاء الطلب', 'العميل'),
        ev('PUBLISHED',   0.05),
        ev('BID_RECEIVED', 0.3),
        ev('BID_ACCEPTED', 0.6, 'قبول عرض المسار السريع', 'العميل'),
        ev('CONFIRMED',   1),
        ev('PICKED_UP',   2,   'تم الاستلام'),
        ev('IN_TRANSIT',  2.1, 'في الطريق إلى الوجهة'),
      ];
    case 'DELIVERED':
      return [
        ev('CREATED',   0),
        ev('PUBLISHED', 0.05),
        ev('BID_RECEIVED', 0.3),
        ev('BID_ACCEPTED', 0.6),
        ev('CONFIRMED', 1),
        ev('PICKED_UP', 2),
        ev('IN_TRANSIT', 2.1),
        ev('DELIVERED', 3, 'تم التسليم — بانتظار التأكيد'),
      ];
    case 'BIDDING':
      return [
        ev('CREATED',     0, 'إنشاء الطلب', 'العميل'),
        ev('PUBLISHED',   0.05, 'نشر الطلب للسوق المفتوح'),
        ev('BID_RECEIVED', 0.5, `${order.bidCount} عروض مستلمة حتى الآن`),
      ];
    case 'PUBLISHED':
      return [
        ev('CREATED',   0, 'إنشاء الطلب', 'العميل'),
        ev('PUBLISHED', 0.05, order.mode === 'DIRECT' ? 'إرسال مباشر للناقل' : 'نشر للسوق'),
      ];
    case 'CANCELLED':
      return [
        ev('CREATED',   0),
        ev('PUBLISHED', 0.05),
        ev('CANCELLED', 0.6, 'إلغاء بطلب من العميل'),
      ];
    default:
      return [ev('CREATED', 0)];
  }
}

// ─── Lookups & helpers ────────────────────────────────────────────────

export function companyById(id: string | null | undefined): Company | undefined {
  if (!id) return undefined;
  return COMPANIES.find((c) => c.id === id);
}

export function ordersForClient(clientId: string): Order[] {
  return ORDERS.filter((o) => o.clientId === clientId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function ordersForCarrier(carrierId: string): Order[] {
  return ORDERS.filter((o) => o.carrierId === carrierId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function openOpportunitiesForCarrier(carrierId: string): Order[] {
  // Open marketplace orders + direct-to-this-carrier
  return ORDERS.filter(
    (o) =>
      (o.status === 'PUBLISHED' || o.status === 'BIDDING') &&
      ((o.mode === 'OPEN') || (o.mode === 'DIRECT' && o.targetCarrierId === carrierId)),
  );
}

export function bidsForOrder(orderId: string): Bid[] {
  return BIDS.filter((b) => b.orderId === orderId).sort((a, b) => a.price - b.price);
}

export function invoicesForClient(clientId: string): Invoice[] {
  return INVOICES.filter((i) => i.clientId === clientId);
}

export function paymentsForCarrier(carrierId: string): Payment[] {
  return PAYMENTS.filter((p) => p.carrierId === carrierId);
}

export function paymentsForClient(clientId: string): Payment[] {
  return PAYMENTS.filter((p) => p.clientId === clientId);
}

// ─── Current-user defaults (matches DEV_USERS roles) ─────────────────

export const CURRENT_CLIENT_ID = 'CL-1001';
export const CURRENT_CARRIER_ID = 'CR-2001';

// ─── Saudi city coordinates (for Leaflet maps) ───────────────────────

export const SAUDI_COORDS: Record<string, { lat: number; lng: number }> = {
  'الرياض':       { lat: 24.7136, lng: 46.6753 },
  'جدة':          { lat: 21.5430, lng: 39.1728 },
  'الدمام':       { lat: 26.4207, lng: 50.0888 },
  'مكة المكرمة':  { lat: 21.3891, lng: 39.8579 },
  'مكة':          { lat: 21.3891, lng: 39.8579 },
  'المدينة':      { lat: 24.5247, lng: 39.5692 },
  'الطائف':       { lat: 21.2854, lng: 40.4150 },
  'أبها':         { lat: 18.2164, lng: 42.5053 },
  'تبوك':         { lat: 28.3998, lng: 36.5716 },
  'الجبيل':       { lat: 27.0174, lng: 49.6220 },
  'ينبع':         { lat: 24.0894, lng: 38.0618 },
  'الخبر':        { lat: 26.2172, lng: 50.1971 },
  'بريدة':        { lat: 26.3260, lng: 43.9750 },
  'حائل':         { lat: 27.5114, lng: 41.7208 },
  'الأحساء':      { lat: 25.3833, lng: 49.5833 },
};

export function coordsFor(city: string): { lat: number; lng: number } {
  return SAUDI_COORDS[city] ?? SAUDI_COORDS['الرياض']!;
}

// Haversine distance in km between two lat/lng points
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function estimatedDurationLabel(km: number, avgSpeedKmh = 80): string {
  const total = km / avgSpeedKmh;
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  if (hours === 0) return `${minutes} دقيقة`;
  if (minutes === 0) return `${hours} ساعة`;
  return `${hours} س و ${minutes} د`;
}

// Major Saudi routes — used to label maps
export function primaryRoadFor(origin: string, destination: string): string {
  const key = [origin, destination].sort().join('|');
  const ROUTES: Record<string, string> = {
    'الدمام|الرياض':    'طريق الملك فهد',
    'الرياض|جدة':       'طريق الحرمين السريع',
    'الرياض|مكة المكرمة':'طريق الحرمين السريع',
    'المدينة|الرياض':   'طريق القصيم',
    'الطائف|جدة':       'طريق الهدا',
    'أبها|الرياض':      'طريق الرياض - أبها',
    'تبوك|الرياض':      'طريق الرياض - تبوك',
    'الجبيل|الرياض':    'طريق الملك فهد',
  };
  return ROUTES[key] ?? 'الطريق السريع';
}

// ─── Wallet domain ───────────────────────────────────────────────────

export type TxKind = 'CREDIT' | 'DEBIT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'COMMISSION' | 'PAYOUT';

export interface WalletTransaction {
  id: string;
  walletId: string;
  kind: TxKind;
  amount: number;         // positive amount; direction inferred from kind
  description: string;
  note?: string;
  relatedOrderId?: string;
  balanceAfter: number;
  at: string;             // ISO
  by?: string;            // who initiated (admin user, system)
}

export interface Wallet {
  id: string;
  companyId: string;
  balance: number;
  escrowHeld: number;
  currency: 'SAR';
  updatedAt: string;
}

export const WALLETS: Wallet[] = [
  { id: 'WAL-CL-1001', companyId: 'CL-1001', balance:  225000, escrowHeld:  80464, currency: 'SAR', updatedAt: '2026-05-13T19:00:00Z' },
  { id: 'WAL-CL-1002', companyId: 'CL-1002', balance:   45000, escrowHeld:  12000, currency: 'SAR', updatedAt: '2026-05-12T14:00:00Z' },
  { id: 'WAL-CL-1003', companyId: 'CL-1003', balance:  118000, escrowHeld:      0, currency: 'SAR', updatedAt: '2026-05-13T08:00:00Z' },
  { id: 'WAL-CL-1004', companyId: 'CL-1004', balance:   32500, escrowHeld:      0, currency: 'SAR', updatedAt: '2026-05-13T11:00:00Z' },
  { id: 'WAL-CL-1005', companyId: 'CL-1005', balance:   88200, escrowHeld:  48784, currency: 'SAR', updatedAt: '2026-05-12T11:30:00Z' },
  { id: 'WAL-CL-1006', companyId: 'CL-1006', balance:  410000, escrowHeld:      0, currency: 'SAR', updatedAt: '2026-05-11T16:00:00Z' },
  { id: 'WAL-CR-2001', companyId: 'CR-2001', balance:  185340, escrowHeld:  74027, currency: 'SAR', updatedAt: '2026-05-12T09:15:00Z' },
  { id: 'WAL-CR-2002', companyId: 'CR-2002', balance:   62150, escrowHeld:  44881, currency: 'SAR', updatedAt: '2026-05-09T10:00:00Z' },
  { id: 'WAL-CR-2003', companyId: 'CR-2003', balance:  324500, escrowHeld:      0, currency: 'SAR', updatedAt: '2026-04-12T18:00:00Z' },
];

export const WALLET_TRANSACTIONS: WalletTransaction[] = [
  // Client CL-1001
  { id: 'TX-10001', walletId: 'WAL-CL-1001', kind: 'CREDIT',         amount: 150000, description: 'إيداع رصيد',                  balanceAfter: 305464, at: '2026-04-01T09:00:00Z', by: 'فريق الإدارة' },
  { id: 'TX-10002', walletId: 'WAL-CL-1001', kind: 'ESCROW_HOLD',    amount: 105580, description: 'حجز Escrow — ORD-2025-0142',  relatedOrderId: 'ORD-2025-0142', balanceAfter: 199884, at: '2026-04-08T10:00:00Z', by: 'النظام' },
  { id: 'TX-10003', walletId: 'WAL-CL-1001', kind: 'ESCROW_RELEASE', amount: 105580, description: 'إفراج Escrow بعد التسليم',     relatedOrderId: 'ORD-2025-0142', balanceAfter: 199884, at: '2026-04-12T18:00:00Z', by: 'النظام' },
  { id: 'TX-10004', walletId: 'WAL-CL-1001', kind: 'ESCROW_HOLD',    amount:  80464, description: 'حجز Escrow — ORD-2025-0150',  relatedOrderId: 'ORD-2025-0150', balanceAfter: 119420, at: '2026-05-12T09:15:00Z', by: 'النظام' },
  { id: 'TX-10005', walletId: 'WAL-CL-1001', kind: 'CREDIT',         amount: 105580, description: 'إيداع شحن للمحفظة',          balanceAfter: 225000, at: '2026-05-13T19:00:00Z', by: 'فريق الإدارة' },

  // Client CL-1005
  { id: 'TX-10010', walletId: 'WAL-CL-1005', kind: 'CREDIT',         amount: 100000, description: 'إيداع رصيد افتتاحي',                                                balanceAfter: 100000, at: '2026-04-15T09:00:00Z', by: 'فريق الإدارة' },
  { id: 'TX-10011', walletId: 'WAL-CL-1005', kind: 'ESCROW_HOLD',    amount:  48784, description: 'حجز Escrow — ORD-2025-0148', relatedOrderId: 'ORD-2025-0148',       balanceAfter:  51216, at: '2026-05-07T11:30:00Z', by: 'النظام' },
  { id: 'TX-10012', walletId: 'WAL-CL-1005', kind: 'REFUND',         amount:  30800, description: 'استرداد ORD-2025-0145 (ملغى)', relatedOrderId: 'ORD-2025-0145',     balanceAfter:  82016, at: '2026-05-11T14:00:00Z', by: 'فريق الإدارة' },
  { id: 'TX-10013', walletId: 'WAL-CL-1005', kind: 'DEBIT',          amount:   6184, description: 'خصم تأمين الشحنة (تعويض)',                                          balanceAfter:  75832, at: '2026-05-12T10:00:00Z', by: 'فريق الإدارة', note: 'تعويض جزئي بسبب تلف في الصناديق' },
  { id: 'TX-10014', walletId: 'WAL-CL-1005', kind: 'CREDIT',         amount:  12368, description: 'إيداع إضافي',                                                       balanceAfter:  88200, at: '2026-05-12T11:30:00Z', by: 'فريق الإدارة' },

  // Carrier CR-2001
  { id: 'TX-20001', walletId: 'WAL-CR-2001', kind: 'ESCROW_RELEASE', amount:  97134, description: 'إفراج ORD-2025-0142 بعد التسليم', relatedOrderId: 'ORD-2025-0142', balanceAfter:  97134, at: '2026-04-12T18:00:00Z', by: 'النظام' },
  { id: 'TX-20002', walletId: 'WAL-CR-2001', kind: 'COMMISSION',     amount:   8446, description: 'عمولة المنصة (8%) — ORD-2025-0142', relatedOrderId: 'ORD-2025-0142', balanceAfter:  97134, at: '2026-04-12T18:00:00Z', by: 'النظام' },
  { id: 'TX-20003', walistId: 'WAL-CR-2001', kind: 'PAYOUT' as any,  amount:  97134, description: 'تحويل بنكي أسبوعي',                                                  balanceAfter:      0, at: '2026-04-19T09:00:00Z', by: 'النظام' } as any,
  { id: 'TX-20004', walletId: 'WAL-CR-2001', kind: 'ESCROW_HOLD',    amount:  74027, description: 'حجز Escrow — ORD-2025-0150', relatedOrderId: 'ORD-2025-0150',       balanceAfter:      0, at: '2026-05-12T09:15:00Z', by: 'النظام' },
  { id: 'TX-20005', walletId: 'WAL-CR-2001', kind: 'CREDIT',         amount: 185340, description: 'تجميع مدفوعات أكثر من طلب',                                          balanceAfter: 185340, at: '2026-05-13T15:00:00Z', by: 'النظام' },
];

export function walletForCompany(companyId: string): Wallet | undefined {
  return WALLETS.find((w) => w.companyId === companyId);
}

export function transactionsForWallet(walletId: string): WalletTransaction[] {
  return WALLET_TRANSACTIONS.filter((tx) => tx.walletId === walletId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function transactionsForCompany(companyId: string): WalletTransaction[] {
  const w = walletForCompany(companyId);
  if (!w) return [];
  return transactionsForWallet(w.id);
}

// ─── Notifications ──────────────────────────────────────────────────

export type NotificationKind =
  | 'ORDER_BID' | 'ORDER_ACCEPTED' | 'ORDER_PICKED_UP' | 'ORDER_DELIVERED'
  | 'INVOICE_OVERDUE' | 'PAYMENT_RELEASED' | 'NEW_OPPORTUNITY'
  | 'KYC_PENDING' | 'DISPUTE_NEW';

export interface AppNotification {
  id: string;
  audience: 'admin' | 'client' | 'carrier';
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read?: boolean;
  at: string;
}

export const NOTIFICATIONS: AppNotification[] = [
  // Admin
  { id: 'N-A-01', audience: 'admin',   kind: 'DISPUTE_NEW',      title: 'نزاع جديد',           body: 'شركة الجزيرة للطاقة رفعت نزاعاً على ORD-2025-0142', href: '/disputes', at: '2026-05-13T08:30:00Z' },
  { id: 'N-A-02', audience: 'admin',   kind: 'KYC_PENDING',      title: 'KYC بانتظار المراجعة', body: 'شركة المنارة للتقنية رفعت مستندات KYC',                href: '/companies', at: '2026-05-12T16:00:00Z' },
  { id: 'N-A-03', audience: 'admin',   kind: 'PAYMENT_RELEASED', title: 'إفراج Escrow جاهز',    body: 'PAY-9002 جاهز للإفراج للناقل',                          href: '/payments',  at: '2026-05-12T10:00:00Z' },

  // Client
  { id: 'N-C-01', audience: 'client',  kind: 'ORDER_BID',        title: '4 عروض جديدة',         body: 'ORD-2025-0155 — قارن العروض الآن',                       href: '/orders/ORD-2025-0155', at: '2026-05-13T19:30:00Z' },
  { id: 'N-C-02', audience: 'client',  kind: 'ORDER_PICKED_UP',  title: 'الشاحنة في الطريق',    body: 'ORD-2025-0150 انطلق من الرياض إلى جدة',                  href: '/orders/ORD-2025-0150', at: '2026-05-13T08:00:00Z' },
  { id: 'N-C-03', audience: 'client',  kind: 'INVOICE_OVERDUE',  title: 'فاتورة متأخرة',         body: 'INV-2025-0145 تجاوزت موعد الاستحقاق',                    href: '/invoices', at: '2026-05-12T10:00:00Z', read: true },

  // Carrier
  { id: 'N-R-01', audience: 'carrier', kind: 'NEW_OPPORTUNITY',  title: 'فرصة جديدة موجّهة لك',  body: 'شركة الجزيرة أرسلت لك طلب نقل محوّل كهربائي',           href: '/opportunities/ORD-2025-0170', at: '2026-05-13T19:00:00Z' },
  { id: 'N-R-02', audience: 'carrier', kind: 'ORDER_ACCEPTED',   title: 'تم قبول عرضك',          body: 'ORD-2025-0150 بقيمة 80,464 ر.س.',                       href: '/orders/ORD-2025-0150', at: '2026-05-12T11:00:00Z' },
  { id: 'N-R-03', audience: 'carrier', kind: 'PAYMENT_RELEASED', title: 'إفراج عن مبلغ',          body: 'صافي 97,134 ر.س. أُضيف إلى حسابك',                       href: '/earnings', at: '2026-04-12T18:00:00Z', read: true },
];

export function notificationsFor(audience: 'admin' | 'client' | 'carrier'): AppNotification[] {
  return NOTIFICATIONS.filter((n) => n.audience === audience).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

// ─── Truck trips (per-truck history) ────────────────────────────────

export interface TruckTrip {
  orderId: string;
  truckId: string;
  driverId?: string;
  clientName: string;
  originCity: string;
  destinationCity: string;
  startedAt: string;
  finishedAt?: string;
  distanceKm: number;
  amount: number;
  status: OrderStatus;
}

const TRIP_BASE: Array<Omit<TruckTrip, 'distanceKm'>> = [
  { orderId: 'ORD-2025-0150', truckId: 'TRK-001', driverId: 'DRV-001', clientName: 'شركة الجزيرة للطاقة',         originCity: 'الرياض', destinationCity: 'جدة',          startedAt: '2026-05-13T07:00:00Z',                                        amount: 80464, status: 'IN_TRANSIT' },
  { orderId: 'ORD-2025-0142', truckId: 'TRK-001', driverId: 'DRV-001', clientName: 'شركة الجزيرة للطاقة',         originCity: 'الرياض', destinationCity: 'الدمام',       startedAt: '2026-04-10T08:00:00Z', finishedAt: '2026-04-12T16:30:00Z', amount: 105580, status: 'COMPLETED' },
  { orderId: 'ORD-2025-0148', truckId: 'TRK-003', driverId: 'DRV-002', clientName: 'مؤسسة الواحة للمواد الغذائية',originCity: 'جدة',    destinationCity: 'الرياض',       startedAt: '2026-05-08T05:00:00Z', finishedAt: '2026-05-09T09:00:00Z', amount:  48784, status: 'DELIVERED' },
  { orderId: 'ORD-2025-0170', truckId: 'TRK-005', driverId: 'DRV-003', clientName: 'شركة الجزيرة للطاقة',         originCity: 'الجبيل', destinationCity: 'الرياض',       startedAt: '2026-05-20T05:00:00Z',                                        amount: 162000, status: 'PUBLISHED' },
  { orderId: 'ORD-2025-0098', truckId: 'TRK-001',                        clientName: 'شركة الفهد للمقاولات',       originCity: 'الدمام', destinationCity: 'الرياض',       startedAt: '2026-03-12T06:00:00Z', finishedAt: '2026-03-13T18:00:00Z', amount:  86200, status: 'COMPLETED' },
  { orderId: 'ORD-2025-0102', truckId: 'TRK-003',                        clientName: 'مؤسسة الواحة للمواد الغذائية',originCity: 'الرياض', destinationCity: 'مكة المكرمة', startedAt: '2026-03-20T04:00:00Z', finishedAt: '2026-03-21T11:30:00Z', amount:  54300, status: 'COMPLETED' },
];

export function tripsForTruck(truckId: string): TruckTrip[] {
  return TRIP_BASE
    .filter((t) => t.truckId === truckId)
    .map((t) => ({
      ...t,
      distanceKm: distanceKm(coordsFor(t.originCity), coordsFor(t.destinationCity)),
    }))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

// ─── Truck Brands & Models (admin-managed) ────────────────────────────

export interface TruckBrand {
  id: string;
  nameAr: string;
  nameEn?: string;
  models: TruckModel[];
}

export interface TruckModel {
  id: string;
  name: string;
}

/**
 * Default seed for truck brands and their models.
 * The admin app can extend or modify this via the persisted store; the carrier
 * wizard reads from the same shape to populate cascading dropdowns.
 */
export const DEFAULT_BRANDS: TruckBrand[] = [
  {
    id: 'BR-MB',  nameAr: 'مرسيدس بنز', nameEn: 'Mercedes-Benz',
    models: [
      { id: 'M-MB-1', name: 'Actros 2653' },
      { id: 'M-MB-2', name: 'Actros 1845' },
      { id: 'M-MB-3', name: 'Arocs 4145'  },
      { id: 'M-MB-4', name: 'Axor 2540'   },
    ],
  },
  {
    id: 'BR-VLV', nameAr: 'فولفو', nameEn: 'Volvo',
    models: [
      { id: 'M-VLV-1', name: 'FH 540'    },
      { id: 'M-VLV-2', name: 'FH 460'    },
      { id: 'M-VLV-3', name: 'FMX 460'   },
      { id: 'M-VLV-4', name: 'FH 16 750' },
    ],
  },
  {
    id: 'BR-MAN', nameAr: 'مان', nameEn: 'MAN',
    models: [
      { id: 'M-MAN-1', name: 'TGX 18.580' },
      { id: 'M-MAN-2', name: 'TGS 33.480' },
      { id: 'M-MAN-3', name: 'TGX 41.640' },
    ],
  },
  {
    id: 'BR-SCN', nameAr: 'سكانيا', nameEn: 'Scania',
    models: [
      { id: 'M-SCN-1', name: 'R 450' },
      { id: 'M-SCN-2', name: 'R 500' },
      { id: 'M-SCN-3', name: 'R 580' },
      { id: 'M-SCN-4', name: 'S 730' },
    ],
  },
  {
    id: 'BR-IVC', nameAr: 'إيفيكو', nameEn: 'Iveco',
    models: [
      { id: 'M-IVC-1', name: 'Stralis 460' },
      { id: 'M-IVC-2', name: 'S-Way 480'   },
      { id: 'M-IVC-3', name: 'Trakker 500' },
    ],
  },
  {
    id: 'BR-ISZ', nameAr: 'إيسوزو', nameEn: 'Isuzu',
    models: [
      { id: 'M-ISZ-1', name: 'FVR Series'  },
      { id: 'M-ISZ-2', name: 'GIGA Series' },
    ],
  },
  {
    id: 'BR-HNO', nameAr: 'هينو', nameEn: 'Hino',
    models: [
      { id: 'M-HNO-1', name: '700 Series' },
      { id: 'M-HNO-2', name: '500 Series' },
      { id: 'M-HNO-3', name: '300 Series' },
    ],
  },
  {
    id: 'BR-DAF', nameAr: 'داف', nameEn: 'DAF',
    models: [
      { id: 'M-DAF-1', name: 'XF 480' },
      { id: 'M-DAF-2', name: 'CF 480' },
    ],
  },
];

// ─── Support tickets ─────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketAudience = 'CLIENT' | 'CARRIER';
export type TicketCategory =
  | 'ACCOUNT' | 'BILLING' | 'ORDER' | 'TECHNICAL' | 'KYC' | 'DRIVER' | 'OTHER';

export interface SupportTicket {
  id: string;
  subject: string;
  raisedBy: TicketAudience;
  raisedById: string;     // company id
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;    // admin agent name
  orderId?: string;
  messageCount: number;
}

export const SUPPORT_TICKETS: SupportTicket[] = [
  { id: 'TKT-5012', subject: 'استفسار عن رسوم إضافية على ORD-2025-0142',  raisedBy: 'CLIENT',  raisedById: 'CL-1001', category: 'ORDER',     priority: 'HIGH',    status: 'IN_PROGRESS',  description: 'الناقل أضاف رسوم انتظار غير متفق عليها مسبقاً.', createdAt: '2026-05-13T08:45:00Z', updatedAt: '2026-05-13T14:20:00Z', assignedTo: 'فهد العتيبي', orderId: 'ORD-2025-0142', messageCount: 4 },
  { id: 'TKT-5011', subject: 'رفض مستند KYC شهادة الزكاة',                 raisedBy: 'CARRIER', raisedById: 'CR-2005', category: 'KYC',       priority: 'MEDIUM',  status: 'WAITING_USER', description: 'نحتاج إعادة تحميل شهادة الزكاة بصيغة PDF واضحة.',createdAt: '2026-05-12T11:30:00Z', updatedAt: '2026-05-12T18:00:00Z', assignedTo: 'سعد القحطاني', messageCount: 3 },
  { id: 'TKT-5010', subject: 'مشكلة في تسجيل الدخول من جوال السائق',       raisedBy: 'CARRIER', raisedById: 'CR-2001', category: 'TECHNICAL', priority: 'URGENT',  status: 'OPEN',         description: 'تطبيق السائق لا يفتح بعد آخر تحديث للأندرويد.',  createdAt: '2026-05-13T07:10:00Z', updatedAt: '2026-05-13T07:10:00Z', messageCount: 1 },
  { id: 'TKT-5009', subject: 'تأخر صرف المبلغ من Escrow',                  raisedBy: 'CARRIER', raisedById: 'CR-2002', category: 'BILLING',   priority: 'HIGH',    status: 'RESOLVED',     description: 'مرّ يومان بعد التسليم ولم يُفرَج عن المبلغ.',   createdAt: '2026-05-10T15:00:00Z', updatedAt: '2026-05-11T10:30:00Z', assignedTo: 'فهد العتيبي', orderId: 'ORD-2025-0148', messageCount: 6 },
  { id: 'TKT-5008', subject: 'تعديل بيانات السجل التجاري للعميل',          raisedBy: 'CLIENT',  raisedById: 'CL-1005', category: 'ACCOUNT',   priority: 'LOW',     status: 'CLOSED',       description: 'انتهت صلاحية السجل التجاري السابق وتم تحديثه.', createdAt: '2026-05-05T09:00:00Z', updatedAt: '2026-05-07T11:00:00Z', assignedTo: 'منيرة الشمراني', messageCount: 5 },
  { id: 'TKT-5007', subject: 'طلب تغيير السائق بعد انطلاق الرحلة',         raisedBy: 'CARRIER', raisedById: 'CR-2003', category: 'DRIVER',    priority: 'MEDIUM',  status: 'CLOSED',       description: 'السائق الأصلي تعرّض لظرف طارئ.',                createdAt: '2026-05-08T13:00:00Z', updatedAt: '2026-05-09T08:00:00Z', assignedTo: 'سعد القحطاني', orderId: 'ORD-2025-0148', messageCount: 7 },
  { id: 'TKT-5006', subject: 'لا تظهر الفواتير في صفحة الفواتير',         raisedBy: 'CLIENT',  raisedById: 'CL-1001', category: 'TECHNICAL', priority: 'MEDIUM',  status: 'CLOSED',       description: 'الفواتير المسددة لا تظهر في القائمة بعد التحديث.', createdAt: '2026-05-01T16:00:00Z', updatedAt: '2026-05-02T11:00:00Z', assignedTo: 'فهد العتيبي', messageCount: 4 },
];

// ─── Audit log ───────────────────────────────────────────────────────

export type AuditActor = 'ADMIN' | 'SYSTEM' | 'CLIENT' | 'CARRIER';
export type AuditCategory =
  | 'AUTH' | 'COMPANY' | 'KYC' | 'ORDER' | 'PAYMENT' | 'DISPUTE'
  | 'SETTINGS' | 'WALLET' | 'TICKET';

export interface AuditEvent {
  id: string;
  at: string;
  actor: AuditActor;
  actorName: string;
  category: AuditCategory;
  action: string;
  target?: string;       // human-readable target (e.g. "ORD-2025-0150")
  detail?: string;
}

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'AUD-12005', at: '2026-05-13T16:30:00Z', actor: 'ADMIN',  actorName: 'فهد العتيبي',     category: 'PAYMENT',  action: 'إفراج يدوي عن مبلغ Escrow', target: 'PAY-9002', detail: 'بناء على إقفال نزاع DSP-2025-0040' },
  { id: 'AUD-12004', at: '2026-05-13T15:10:00Z', actor: 'SYSTEM', actorName: 'النظام',           category: 'ORDER',    action: 'تحويل الحالة تلقائياً إلى IN_TRANSIT', target: 'ORD-2025-0150' },
  { id: 'AUD-12003', at: '2026-05-13T11:00:00Z', actor: 'ADMIN',  actorName: 'سعد القحطاني',     category: 'KYC',      action: 'اعتماد شركة جديدة',                 target: 'CR-2004',          detail: 'مستندات سارية حتى 2027-03' },
  { id: 'AUD-12002', at: '2026-05-13T09:45:00Z', actor: 'CARRIER', actorName: 'الجزيرة للنقل',    category: 'COMPANY',  action: 'تحديث بيانات الاتصال',              target: 'CR-2003' },
  { id: 'AUD-12001', at: '2026-05-12T18:20:00Z', actor: 'ADMIN',  actorName: 'منيرة الشمراني',  category: 'SETTINGS', action: 'تعديل نسبة العمولة من 7% إلى 8%' },
  { id: 'AUD-12000', at: '2026-05-12T14:00:00Z', actor: 'CLIENT', actorName: 'الجزيرة للطاقة',   category: 'DISPUTE',  action: 'فتح نزاع جديد',                     target: 'DSP-2025-0040' },
  { id: 'AUD-11999', at: '2026-05-12T08:30:00Z', actor: 'SYSTEM', actorName: 'النظام',           category: 'WALLET',   action: 'تحويل تلقائي إلى محفظة الناقل',     target: 'WLT-2002',         detail: '+44,881 ر.س. بعد خصم العمولة' },
  { id: 'AUD-11998', at: '2026-05-11T22:00:00Z', actor: 'ADMIN',  actorName: 'فهد العتيبي',     category: 'TICKET',   action: 'إغلاق تذكرة دعم',                   target: 'TKT-5009' },
  { id: 'AUD-11997', at: '2026-05-11T14:00:00Z', actor: 'ADMIN',  actorName: 'سعد القحطاني',     category: 'AUTH',     action: 'إعادة تعيين كلمة المرور لمستخدم',   target: 'CL-1003' },
  { id: 'AUD-11996', at: '2026-05-10T19:00:00Z', actor: 'CARRIER', actorName: 'النخبة للشحن',    category: 'ORDER',    action: 'قبول عرض على طلب',                  target: 'ORD-2025-0150' },
];

// ─── Saved addresses (per client) ────────────────────────────────────

export type AddressKind = 'PICKUP' | 'DESTINATION' | 'BOTH';
export interface SavedAddress {
  id: string;
  clientId: string;
  label: string;
  city: string;
  address: string;
  kind: AddressKind;
  contactName: string;
  contactPhone: string;
  isDefault?: boolean;
}

export const SAVED_ADDRESSES: SavedAddress[] = [
  { id: 'ADR-001', clientId: 'CL-1001', label: 'المستودع الرئيسي', city: 'الرياض', address: 'حي السلي، شارع التجارة الكبرى، مستودع 14',         kind: 'PICKUP',      contactName: 'سامي العنزي',  contactPhone: '+966550101010', isDefault: true },
  { id: 'ADR-002', clientId: 'CL-1001', label: 'فرع جدة',           city: 'جدة',    address: 'حي البوادي، طريق الملك عبدالله، عمارة 22',          kind: 'BOTH',         contactName: 'محمد الزهراني',contactPhone: '+966550202020' },
  { id: 'ADR-003', clientId: 'CL-1001', label: 'موقع البناء',       city: 'الدمام', address: 'مدينة الجبيل الصناعية، قطعة 8',                     kind: 'DESTINATION', contactName: 'علي الشهري',    contactPhone: '+966550303030' },
  { id: 'ADR-004', clientId: 'CL-1005', label: 'المركز اللوجستي',   city: 'جدة',    address: 'المنطقة الصناعية الثانية، طريق الخدمة',            kind: 'BOTH',         contactName: 'ناصر الغامدي',  contactPhone: '+966550404040', isDefault: true },
  { id: 'ADR-005', clientId: 'CL-1005', label: 'مستودع الواحة',     city: 'الرياض', address: 'حي المصانع، شارع المنتج 14',                       kind: 'DESTINATION', contactName: 'يوسف القرني',  contactPhone: '+966550505050' },
];

// ─── Carrier compliance documents ────────────────────────────────────

export type DocStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
export interface CarrierDoc {
  id: string;
  carrierId: string;
  type: 'COMMERCIAL_REGISTER' | 'VAT' | 'ZAKAT' | 'TRANSPORT_LICENSE' | 'INSURANCE' | 'BANK_LETTER';
  number?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: DocStatus;
  fileName?: string;
}

export const CARRIER_DOCS: CarrierDoc[] = [
  { id: 'DOC-001', carrierId: 'CR-2001', type: 'COMMERCIAL_REGISTER', number: '1010234567', issuedAt: '2022-03-12', expiresAt: '2027-03-12', status: 'VALID',          fileName: 'CR-1010234567.pdf' },
  { id: 'DOC-002', carrierId: 'CR-2001', type: 'VAT',                 number: '300012345678901', issuedAt: '2022-04-01', expiresAt: '2030-04-01', status: 'VALID',  fileName: 'VAT-certificate.pdf' },
  { id: 'DOC-003', carrierId: 'CR-2001', type: 'ZAKAT',               number: 'ZK-99812',  issuedAt: '2026-01-10', expiresAt: '2026-06-30', status: 'EXPIRING_SOON',  fileName: 'zakat-2025.pdf' },
  { id: 'DOC-004', carrierId: 'CR-2001', type: 'TRANSPORT_LICENSE',   number: 'TL-2024-0188', issuedAt: '2024-02-01', expiresAt: '2027-02-01', status: 'VALID',     fileName: 'transport-license.pdf' },
  { id: 'DOC-005', carrierId: 'CR-2001', type: 'INSURANCE',           number: 'INS-AXA-77432', issuedAt: '2025-06-01', expiresAt: '2026-06-01', status: 'EXPIRING_SOON', fileName: 'insurance-policy.pdf' },
  { id: 'DOC-006', carrierId: 'CR-2001', type: 'BANK_LETTER',         issuedAt: '2025-09-15', status: 'VALID', fileName: 'bank-iban-letter.pdf' },
];

// ─── Promotions / Promo codes (admin) ────────────────────────────────

export type PromoStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'DRAFT';
export interface Promotion {
  id: string;
  code: string;
  description: string;
  audience: 'CLIENT' | 'CARRIER' | 'ALL';
  kind: 'PERCENTAGE_OFF' | 'FIXED_AMOUNT' | 'COMMISSION_WAIVER';
  value: number;        // % or SAR
  usageCount: number;
  usageLimit?: number;
  status: PromoStatus;
  startsAt: string;
  endsAt: string;
}

export const PROMOTIONS: Promotion[] = [
  { id: 'PRM-001', code: 'WELCOME10',     description: 'خصم 10% للعملاء الجدد على أول طلب',             audience: 'CLIENT',  kind: 'PERCENTAGE_OFF',    value: 10, usageCount: 142, usageLimit: 500, status: 'ACTIVE',  startsAt: '2026-04-01', endsAt: '2026-06-30' },
  { id: 'PRM-002', code: 'NAQLA50',       description: 'حسم 50 ر.س. لكل طلب فوق 2000 ر.س.',             audience: 'CLIENT',  kind: 'FIXED_AMOUNT',      value: 50, usageCount: 89,  usageLimit: 300, status: 'ACTIVE',  startsAt: '2026-05-01', endsAt: '2026-05-31' },
  { id: 'PRM-003', code: 'CARRIERLAUNCH', description: 'إعفاء من العمولة لأول 3 طلبات للناقلين الجدد',  audience: 'CARRIER', kind: 'COMMISSION_WAIVER', value: 0,  usageCount: 31,  usageLimit: 200, status: 'ACTIVE',  startsAt: '2026-03-15', endsAt: '2026-12-31' },
  { id: 'PRM-004', code: 'RAMADAN2026',   description: 'حسم 15% خلال شهر رمضان',                       audience: 'ALL',     kind: 'PERCENTAGE_OFF',    value: 15, usageCount: 217, usageLimit: 1000,status: 'EXPIRED', startsAt: '2026-02-10', endsAt: '2026-03-12' },
  { id: 'PRM-005', code: 'SUMMER2026',    description: 'عرض الصيف القادم',                              audience: 'CLIENT',  kind: 'PERCENTAGE_OFF',    value: 20, usageCount: 0,   usageLimit: 800, status: 'DRAFT',   startsAt: '2026-06-15', endsAt: '2026-09-15' },
  { id: 'PRM-006', code: 'EXPRESS25',     description: 'حسم 25 ر.س. للطلبات السريعة',                  audience: 'CLIENT',  kind: 'FIXED_AMOUNT',      value: 25, usageCount: 18,  usageLimit: 100, status: 'PAUSED',  startsAt: '2026-04-20', endsAt: '2026-07-20' },
];

// ─── Helpers (cross-cutting lookups) ─────────────────────────────────

export function ticketsFor(audience: TicketAudience | 'ALL', id?: string): SupportTicket[] {
  if (audience === 'ALL') return [...SUPPORT_TICKETS];
  return SUPPORT_TICKETS.filter((t) => t.raisedBy === audience && (!id || t.raisedById === id));
}

export function disputesFor(party: 'CLIENT' | 'CARRIER', id: string): Dispute[] {
  return DISPUTES.filter((d) => {
    if (d.raisedBy === party && d.raisedById === id) return true;
    // For the opposing party, find disputes on orders involving them
    const order = ORDERS.find((o) => o.id === d.orderId);
    if (!order) return false;
    if (party === 'CLIENT'  && order.clientId  === id) return true;
    if (party === 'CARRIER' && order.carrierId === id) return true;
    return false;
  });
}

export function bidsForCarrier(carrierId: string): Bid[] {
  return BIDS.filter((b) => b.carrierId === carrierId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function trucksForCarrier(carrierId: string): Truck[] {
  return TRUCKS.filter((t) => t.carrierId === carrierId);
}

export function driversForCarrier(carrierId: string): Driver[] {
  return DRIVERS.filter((d) => d.carrierId === carrierId);
}

export function addressesForClient(clientId: string): SavedAddress[] {
  return SAVED_ADDRESSES.filter((a) => a.clientId === clientId);
}

export function carrierDocsFor(carrierId: string): CarrierDoc[] {
  return CARRIER_DOCS.filter((d) => d.carrierId === carrierId);
}

export function pendingKycCompanies(): Company[] {
  return COMPANIES.filter((c) => c.kycStatus === 'PENDING_VERIFICATION' || c.kycStatus === 'NOT_SUBMITTED');
}

export function carrierById(id: string | null | undefined): Company | undefined {
  if (!id) return undefined;
  return COMPANIES.find((c) => c.id === id && c.kind === 'CARRIER');
}

export function driverById(id: string | null | undefined): Driver | undefined {
  if (!id) return undefined;
  return DRIVERS.find((d) => d.id === id);
}

export function truckById(id: string | null | undefined): Truck | undefined {
  if (!id) return undefined;
  return TRUCKS.find((t) => t.id === id);
}

export function activeOrdersForClient(clientId: string): Order[] {
  return ORDERS.filter(
    (o) => o.clientId === clientId &&
      (o.status === 'CONFIRMED' || o.status === 'IN_TRANSIT' || o.status === 'PUBLISHED' || o.status === 'BIDDING'),
  );
}

export function activeOrdersForCarrier(carrierId: string): Order[] {
  return ORDERS.filter(
    (o) => o.carrierId === carrierId &&
      (o.status === 'CONFIRMED' || o.status === 'IN_TRANSIT'),
  );
}

// ─── Notification templates & provider config ────────────────────────

export type NotificationCategory = 'OTP' | 'TRANSACTIONAL' | 'NOTIFICATION' | 'ALERT';
export type NotificationAudience = 'CLIENT' | 'CARRIER' | 'ADMIN' | 'DRIVER';

export interface ChannelTemplate {
  enabled: boolean;
  subject?: string;     // for email
  body: string;
}

export interface NotificationTemplate {
  id: string;           // event key e.g. 'order.accepted'
  category: NotificationCategory;
  audience: NotificationAudience;
  name: string;         // Arabic display name
  description: string;
  enabled: boolean;     // master toggle for whole notification
  variables: string[];  // available placeholders
  channels: {
    email: ChannelTemplate;
    sms:   ChannelTemplate;
    inApp: ChannelTemplate;
  };
}

export type SmsProviderId = 'taqnyat' | 'unifonic' | 'mobily' | 'msegat' | 'twilio';

export interface ProvidersConfig {
  email: {
    provider: 'resend';
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
    enabled: boolean;
  };
  sms: {
    provider: SmsProviderId;
    apiKey: string;
    apiSecret?: string;
    senderId: string;
    enabled: boolean;
  };
  general: {
    rateLimitPerHour: number;
    retryOnFailure: boolean;
    sandboxMode: boolean;
  };
}

export const DEFAULT_PROVIDERS_CONFIG: ProvidersConfig = {
  email: {
    provider: 'resend',
    apiKey: '',
    fromEmail: 'noreply@naqla.sa',
    fromName: 'نقلة لوجيستك',
    replyTo: 'support@naqla.sa',
    enabled: false,
  },
  sms: {
    provider: 'taqnyat',
    apiKey: '',
    senderId: 'NAQLA',
    enabled: false,
  },
  general: {
    rateLimitPerHour: 1000,
    retryOnFailure: true,
    sandboxMode: true,
  },
};

export const SMS_PROVIDERS: { id: SmsProviderId; name: string; region: string }[] = [
  { id: 'taqnyat',  name: 'تقنيات',           region: 'السعودية' },
  { id: 'unifonic', name: 'يوني فونيك',       region: 'السعودية' },
  { id: 'mobily',   name: 'موبايلي للأعمال',  region: 'السعودية' },
  { id: 'msegat',   name: 'mSegat',           region: 'السعودية' },
  { id: 'twilio',   name: 'Twilio',           region: 'دولي' },
];

/**
 * Default notification templates — covers every key event across all audiences
 * with three channels (email, sms, in-app). Strings use {{var}} placeholders.
 */
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ─── OTP & Authentication ──────────────────────────────────────────
  {
    id: 'auth.email_verification', category: 'OTP', audience: 'CLIENT',
    name: 'تأكيد البريد الإلكتروني (OTP)',
    description: 'يُرسل عند التسجيل لتفعيل البريد',
    enabled: true,
    variables: ['{{name}}', '{{otp}}', '{{expiry}}'],
    channels: {
      email: { enabled: true,  subject: 'رمز تأكيد البريد - نقلة لوجيستك', body: 'مرحباً {{name}}،\n\nرمز التحقق الخاص بك هو: {{otp}}\nصالح لمدة {{expiry}} دقيقة.\n\nإن لم تطلب التسجيل، تجاهل هذه الرسالة.' },
      sms:   { enabled: false, body: 'رمز نقلة: {{otp}}. صالح {{expiry}} دقيقة.' },
      inApp: { enabled: false, body: '' },
    },
  },
  {
    id: 'auth.phone_verification', category: 'OTP', audience: 'CLIENT',
    name: 'تأكيد الجوال (OTP)',
    description: 'يُرسل عند التسجيل لتفعيل الجوال',
    enabled: true,
    variables: ['{{otp}}', '{{expiry}}'],
    channels: {
      email: { enabled: false, body: '' },
      sms:   { enabled: true,  body: 'رمز نقلة لوجيستك: {{otp}}. صالح {{expiry}} دقيقة. لا تشاركه مع أحد.' },
      inApp: { enabled: false, body: '' },
    },
  },
  {
    id: 'auth.password_reset', category: 'OTP', audience: 'CLIENT',
    name: 'استعادة كلمة المرور',
    description: 'يُرسل لإعادة تعيين كلمة المرور',
    enabled: true,
    variables: ['{{name}}', '{{otp}}', '{{link}}', '{{expiry}}'],
    channels: {
      email: { enabled: true,  subject: 'إعادة تعيين كلمة المرور', body: 'مرحباً {{name}}،\n\nاضغط على الرابط لإعادة تعيين كلمة المرور:\n{{link}}\n\nأو استخدم الرمز: {{otp}}\nصالح لمدة {{expiry}} دقيقة.' },
      sms:   { enabled: true,  body: 'رمز إعادة تعيين كلمة المرور: {{otp}}' },
      inApp: { enabled: false, body: '' },
    },
  },
  {
    id: 'auth.login_otp', category: 'OTP', audience: 'CLIENT',
    name: 'رمز تسجيل الدخول',
    description: 'رمز التحقق الثنائي عند تسجيل الدخول',
    enabled: true,
    variables: ['{{otp}}'],
    channels: {
      email: { enabled: false, body: '' },
      sms:   { enabled: true,  body: 'رمز تسجيل الدخول: {{otp}}' },
      inApp: { enabled: false, body: '' },
    },
  },

  // ─── Client — Order lifecycle ──────────────────────────────────────
  {
    id: 'client.order.published', category: 'TRANSACTIONAL', audience: 'CLIENT',
    name: 'نشر الطلب على السوق',
    description: 'يُرسل عند نشر طلب جديد ليبدأ استقبال العروض',
    enabled: true,
    variables: ['{{name}}', '{{orderNumber}}', '{{origin}}', '{{destination}}', '{{budget}}'],
    channels: {
      email: { enabled: true,  subject: 'تم نشر طلبك {{orderNumber}}', body: 'مرحباً {{name}}،\n\nتم نشر طلبك {{orderNumber}} من {{origin}} إلى {{destination}}.\nبانتظار عروض الناقلين...\n\nالميزانية: {{budget}} ر.س' },
      sms:   { enabled: false, body: 'نقلة: تم نشر طلبك {{orderNumber}}' },
      inApp: { enabled: true,  body: 'طلبك {{orderNumber}} منشور الآن — بانتظار العروض' },
    },
  },
  {
    id: 'client.bid.received', category: 'NOTIFICATION', audience: 'CLIENT',
    name: 'استلام عرض جديد',
    description: 'يُرسل عند تقديم ناقل عرضاً على طلبك',
    enabled: true,
    variables: ['{{name}}', '{{orderNumber}}', '{{carrierName}}', '{{price}}', '{{days}}'],
    channels: {
      email: { enabled: true,  subject: 'عرض جديد على {{orderNumber}}', body: 'مرحباً {{name}}،\n\nقدّم {{carrierName}} عرضاً على طلبك:\nالسعر: {{price}} ر.س\nالمدة: {{days}} أيام\n\nراجع العرض وقارنه بالعروض الأخرى.' },
      sms:   { enabled: false, body: 'عرض جديد من {{carrierName}} بسعر {{price}} ر.س' },
      inApp: { enabled: true,  body: 'عرض جديد من {{carrierName}} على {{orderNumber}}' },
    },
  },
  {
    id: 'client.order.confirmed', category: 'TRANSACTIONAL', audience: 'CLIENT',
    name: 'تأكيد قبول العرض',
    description: 'يُرسل عند قبول العميل لعرض ناقل',
    enabled: true,
    variables: ['{{name}}', '{{orderNumber}}', '{{carrierName}}', '{{pickupDate}}', '{{price}}'],
    channels: {
      email: { enabled: true,  subject: 'تأكيد قبول العرض - {{orderNumber}}', body: 'مرحباً {{name}}،\n\nتم قبول عرض {{carrierName}} على طلبك {{orderNumber}}.\nموعد الاستلام: {{pickupDate}}\nالمبلغ: {{price}} ر.س محجوز في Escrow.' },
      sms:   { enabled: true,  body: 'تم تأكيد طلبك {{orderNumber}} مع {{carrierName}}. موعد الاستلام {{pickupDate}}' },
      inApp: { enabled: true,  body: 'تأكدت رحلة {{orderNumber}} مع {{carrierName}}' },
    },
  },
  {
    id: 'client.order.picked_up', category: 'NOTIFICATION', audience: 'CLIENT',
    name: 'تم استلام الشحنة',
    description: 'يُرسل عند تأكيد الناقل استلام الشحنة',
    enabled: true,
    variables: ['{{orderNumber}}', '{{driver}}', '{{plate}}', '{{trackingUrl}}'],
    channels: {
      email: { enabled: true,  subject: 'تم استلام شحنتك {{orderNumber}}', body: 'تم استلام شحنتك {{orderNumber}} بواسطة السائق {{driver}} (لوحة {{plate}}).\nتابع موقع الشاحنة لحظياً: {{trackingUrl}}' },
      sms:   { enabled: true,  body: 'تم استلام شحنتك {{orderNumber}} - السائق {{driver}}' },
      inApp: { enabled: true,  body: 'الشحنة {{orderNumber}} في الطريق' },
    },
  },
  {
    id: 'client.order.delivered', category: 'TRANSACTIONAL', audience: 'CLIENT',
    name: 'تم تسليم الشحنة',
    description: 'يُرسل عند تأكيد التسليم',
    enabled: true,
    variables: ['{{name}}', '{{orderNumber}}', '{{destination}}'],
    channels: {
      email: { enabled: true,  subject: '✓ تم تسليم {{orderNumber}}', body: 'مرحباً {{name}}،\n\nتم تسليم شحنتك {{orderNumber}} بنجاح في {{destination}}.\n\nنرجو تقييم تجربتك مع الناقل.' },
      sms:   { enabled: true,  body: 'تم تسليم شحنتك {{orderNumber}} بنجاح. شكراً لاستخدامك نقلة.' },
      inApp: { enabled: true,  body: 'تم تسليم {{orderNumber}} - يرجى التقييم' },
    },
  },
  {
    id: 'client.invoice.issued', category: 'TRANSACTIONAL', audience: 'CLIENT',
    name: 'إصدار فاتورة جديدة',
    description: 'يُرسل عند إصدار فاتورة',
    enabled: true,
    variables: ['{{name}}', '{{invoiceNumber}}', '{{total}}', '{{dueDate}}', '{{invoiceUrl}}'],
    channels: {
      email: { enabled: true,  subject: 'فاتورة جديدة {{invoiceNumber}}', body: 'مرحباً {{name}}،\n\nصدرت فاتورة جديدة بقيمة {{total}} ر.س.\nرقم الفاتورة: {{invoiceNumber}}\nموعد الاستحقاق: {{dueDate}}\n\nالاطلاع: {{invoiceUrl}}' },
      sms:   { enabled: false, body: 'فاتورة جديدة {{invoiceNumber}} - {{total}} ر.س' },
      inApp: { enabled: true,  body: 'فاتورة جديدة {{invoiceNumber}} - {{total}} ر.س' },
    },
  },
  {
    id: 'client.invoice.overdue', category: 'ALERT', audience: 'CLIENT',
    name: 'فاتورة متأخرة السداد',
    description: 'تنبيه على فاتورة تجاوزت موعد الاستحقاق',
    enabled: true,
    variables: ['{{name}}', '{{invoiceNumber}}', '{{total}}', '{{daysLate}}'],
    channels: {
      email: { enabled: true,  subject: '⚠️ فاتورة متأخرة - {{invoiceNumber}}', body: 'تنبيه: الفاتورة {{invoiceNumber}} متأخرة {{daysLate}} يوماً.\nالمبلغ: {{total}} ر.س.\nيرجى السداد لتجنّب توقف الخدمة.' },
      sms:   { enabled: true,  body: 'فاتورتك {{invoiceNumber}} متأخرة. يرجى السداد لتجنب توقف الخدمة.' },
      inApp: { enabled: true,  body: 'فاتورة متأخرة {{invoiceNumber}} - {{total}} ر.س' },
    },
  },
  {
    id: 'client.dispute.resolved', category: 'NOTIFICATION', audience: 'CLIENT',
    name: 'حلّ نزاع',
    description: 'يُرسل عند إغلاق نزاع كان مفتوحاً',
    enabled: true,
    variables: ['{{name}}', '{{disputeId}}', '{{resolution}}'],
    channels: {
      email: { enabled: true,  subject: 'تم حل النزاع {{disputeId}}', body: 'مرحباً {{name}}،\n\nتم حل النزاع {{disputeId}}.\nالنتيجة: {{resolution}}' },
      sms:   { enabled: false, body: 'تم حل النزاع {{disputeId}}' },
      inApp: { enabled: true,  body: 'حل النزاع {{disputeId}}' },
    },
  },

  // ─── Carrier — Operations ──────────────────────────────────────────
  {
    id: 'carrier.opportunity.new', category: 'NOTIFICATION', audience: 'CARRIER',
    name: 'فرصة نقل جديدة',
    description: 'يُرسل عند توفّر طلب يطابق ملف الناقل',
    enabled: true,
    variables: ['{{origin}}', '{{destination}}', '{{truckType}}', '{{budget}}'],
    channels: {
      email: { enabled: false, subject: 'فرصة نقل جديدة', body: 'فرصة نقل جديدة من {{origin}} إلى {{destination}}\nالنوع: {{truckType}}\nالميزانية: {{budget}} ر.س' },
      sms:   { enabled: true,  body: 'فرصة جديدة: {{origin}} ← {{destination}} ({{truckType}})' },
      inApp: { enabled: true,  body: 'فرصة جديدة: {{origin}} ← {{destination}}' },
    },
  },
  {
    id: 'carrier.order.direct', category: 'NOTIFICATION', audience: 'CARRIER',
    name: 'طلب مباشر من عميل',
    description: 'يُرسل عند طلب عميل مباشر للناقل',
    enabled: true,
    variables: ['{{clientName}}', '{{orderNumber}}', '{{pickupDate}}'],
    channels: {
      email: { enabled: true,  subject: 'طلب نقل مباشر من {{clientName}}', body: 'طلب نقل مباشر:\nالعميل: {{clientName}}\nرقم الطلب: {{orderNumber}}\nموعد الاستلام: {{pickupDate}}\n\nالرجاء الرد خلال 4 ساعات.' },
      sms:   { enabled: true,  body: 'طلب مباشر من {{clientName}} - استلام {{pickupDate}}' },
      inApp: { enabled: true,  body: 'طلب مباشر من {{clientName}}' },
    },
  },
  {
    id: 'carrier.bid.accepted', category: 'TRANSACTIONAL', audience: 'CARRIER',
    name: 'تم قبول عرضك',
    description: 'يُرسل عند قبول العميل لعرض الناقل',
    enabled: true,
    variables: ['{{carrierName}}', '{{orderNumber}}', '{{clientName}}', '{{pickupDate}}', '{{amount}}'],
    channels: {
      email: { enabled: true,  subject: '🎉 قُبل عرضك على {{orderNumber}}', body: 'تهانينا {{carrierName}}!\n\nقَبِل {{clientName}} عرضك على الطلب {{orderNumber}}.\nموعد الاستلام: {{pickupDate}}\nالمبلغ: {{amount}} ر.س (محجوز Escrow)\n\nأكّد جاهزية الشاحنة والسائق.' },
      sms:   { enabled: true,  body: 'تم قبول عرضك على {{orderNumber}}. استلام {{pickupDate}}' },
      inApp: { enabled: true,  body: 'فزت بالطلب {{orderNumber}}!' },
    },
  },
  {
    id: 'carrier.bid.rejected', category: 'NOTIFICATION', audience: 'CARRIER',
    name: 'تم رفض عرضك',
    description: 'يُرسل عند رفض العميل أو قبول عرض آخر',
    enabled: true,
    variables: ['{{orderNumber}}'],
    channels: {
      email: { enabled: false, body: '' },
      sms:   { enabled: false, body: '' },
      inApp: { enabled: true,  body: 'لم يُقبل عرضك على {{orderNumber}}' },
    },
  },
  {
    id: 'carrier.payment.released', category: 'TRANSACTIONAL', audience: 'CARRIER',
    name: 'الإفراج عن مبلغ Escrow',
    description: 'يُرسل عند تحويل المبلغ من Escrow لحساب الناقل',
    enabled: true,
    variables: ['{{carrierName}}', '{{amount}}', '{{orderNumber}}', '{{iban}}'],
    channels: {
      email: { enabled: true,  subject: 'تم تحويل مستحقاتك - {{orderNumber}}', body: 'مرحباً {{carrierName}}،\n\nتم تحويل {{amount}} ر.س إلى حسابك ({{iban}}) عن الطلب {{orderNumber}}.' },
      sms:   { enabled: true,  body: 'تم تحويل {{amount}} ر.س عن {{orderNumber}}' },
      inApp: { enabled: true,  body: 'دفعة جديدة {{amount}} ر.س' },
    },
  },
  {
    id: 'carrier.kyc.approved', category: 'TRANSACTIONAL', audience: 'CARRIER',
    name: 'اعتماد حساب الناقل',
    description: 'يُرسل عند اعتماد KYC',
    enabled: true,
    variables: ['{{carrierName}}'],
    channels: {
      email: { enabled: true,  subject: '✓ تم اعتماد حسابك', body: 'تهانينا {{carrierName}}!\n\nتم اعتماد حسابك بنجاح، يمكنك البدء بقبول الطلبات الآن.' },
      sms:   { enabled: true,  body: 'تم اعتماد حسابك على نقلة. ابدأ بقبول الطلبات الآن.' },
      inApp: { enabled: true,  body: 'تم اعتماد حسابك ✓' },
    },
  },
  {
    id: 'carrier.kyc.rejected', category: 'ALERT', audience: 'CARRIER',
    name: 'رفض اعتماد الناقل',
    description: 'يُرسل عند رفض المستندات',
    enabled: true,
    variables: ['{{carrierName}}', '{{reason}}'],
    channels: {
      email: { enabled: true,  subject: 'يلزمك تصحيح بعض المستندات', body: 'مرحباً {{carrierName}}،\n\nيلزم تصحيح ما يلي: {{reason}}\n\nأعد رفع المستندات لمراجعتها.' },
      sms:   { enabled: false, body: '' },
      inApp: { enabled: true,  body: 'يلزمك مراجعة المستندات: {{reason}}' },
    },
  },
  {
    id: 'carrier.document.expiring', category: 'ALERT', audience: 'CARRIER',
    name: 'وثيقة على وشك الانتهاء',
    description: 'تنبيه قبل انتهاء صلاحية وثيقة بـ 30 يوماً',
    enabled: true,
    variables: ['{{docName}}', '{{daysLeft}}'],
    channels: {
      email: { enabled: true,  subject: 'تنبيه: {{docName}} تنتهي خلال {{daysLeft}} يوم', body: 'وثيقتك {{docName}} ستنتهي خلال {{daysLeft}} يوم. يرجى تجديدها لاستمرار النشاط على المنصة.' },
      sms:   { enabled: true,  body: '{{docName}} تنتهي خلال {{daysLeft}} يوم' },
      inApp: { enabled: true,  body: '{{docName}} تنتهي قريباً' },
    },
  },

  // ─── Driver — Mobile app ───────────────────────────────────────────
  {
    id: 'driver.trip.assigned', category: 'NOTIFICATION', audience: 'DRIVER',
    name: 'رحلة جديدة معيّنة',
    description: 'يُرسل للسائق عند تعيين رحلة له',
    enabled: true,
    variables: ['{{driver}}', '{{orderNumber}}', '{{pickupAddress}}', '{{pickupTime}}'],
    channels: {
      email: { enabled: false, body: '' },
      sms:   { enabled: true,  body: 'رحلة جديدة {{orderNumber}} - استلام من {{pickupAddress}} في {{pickupTime}}' },
      inApp: { enabled: true,  body: 'رحلة جديدة {{orderNumber}}' },
    },
  },

  // ─── Admin — Internal alerts ───────────────────────────────────────
  {
    id: 'admin.kyc.new', category: 'NOTIFICATION', audience: 'ADMIN',
    name: 'طلب KYC جديد',
    description: 'يُرسل لفريق الامتثال عند تقديم شركة جديدة',
    enabled: true,
    variables: ['{{companyName}}', '{{companyType}}', '{{submittedAt}}'],
    channels: {
      email: { enabled: true,  subject: 'طلب اعتماد جديد - {{companyName}}', body: 'تم تقديم طلب اعتماد جديد:\nالشركة: {{companyName}}\nالنوع: {{companyType}}\nتاريخ التقديم: {{submittedAt}}' },
      sms:   { enabled: false, body: '' },
      inApp: { enabled: true,  body: 'طلب اعتماد جديد: {{companyName}}' },
    },
  },
  {
    id: 'admin.dispute.opened', category: 'ALERT', audience: 'ADMIN',
    name: 'نزاع جديد مفتوح',
    description: 'تنبيه لفريق الدعم عند فتح نزاع',
    enabled: true,
    variables: ['{{disputeId}}', '{{orderNumber}}', '{{raisedBy}}'],
    channels: {
      email: { enabled: true,  subject: '🔴 نزاع جديد {{disputeId}}', body: 'فُتح نزاع جديد:\nرقم: {{disputeId}}\nالطلب: {{orderNumber}}\nالمُنشئ: {{raisedBy}}' },
      sms:   { enabled: true,  body: 'نزاع جديد {{disputeId}} على {{orderNumber}}' },
      inApp: { enabled: true,  body: 'نزاع جديد {{disputeId}}' },
    },
  },
  {
    id: 'admin.ticket.urgent', category: 'ALERT', audience: 'ADMIN',
    name: 'تذكرة دعم عاجلة',
    description: 'يُرسل عند تذكرة بأولوية عاجلة',
    enabled: true,
    variables: ['{{ticketId}}', '{{subject}}', '{{raisedBy}}'],
    channels: {
      email: { enabled: true,  subject: '🚨 تذكرة عاجلة {{ticketId}}', body: 'تذكرة عاجلة:\nرقم: {{ticketId}}\nالموضوع: {{subject}}\nمن: {{raisedBy}}' },
      sms:   { enabled: true,  body: 'تذكرة عاجلة {{ticketId}}' },
      inApp: { enabled: true,  body: 'تذكرة عاجلة {{ticketId}}' },
    },
  },
  {
    id: 'admin.payment.disputed', category: 'ALERT', audience: 'ADMIN',
    name: 'دفعة متنازع عليها',
    description: 'يُرسل عند فتح نزاع على دفعة Escrow',
    enabled: true,
    variables: ['{{paymentId}}', '{{amount}}'],
    channels: {
      email: { enabled: true,  subject: 'دفعة متنازع عليها {{paymentId}}', body: 'دفعة Escrow متنازع عليها:\n{{paymentId}} بقيمة {{amount}} ر.س.' },
      sms:   { enabled: false, body: '' },
      inApp: { enabled: true,  body: 'دفعة متنازع عليها {{paymentId}}' },
    },
  },
];

// ─── Legal documents ──────────────────────────────────────────────────

export type LegalDocId = 'terms' | 'privacy' | 'transport';

export interface LegalDocument {
  id: LegalDocId;
  title: string;
  content: string;            // markdown
  version: string;            // e.g. "1.0", "1.1"
  publishedAt: string;
  draftContent?: string;
  draftUpdatedAt?: string;
}

export const DEFAULT_LEGAL_DOCS: Record<LegalDocId, LegalDocument> = {
  terms: {
    id: 'terms',
    title: 'شروط الاستخدام',
    version: '1.0',
    publishedAt: '2026-01-01T00:00:00Z',
    content: `# شروط الاستخدام

**آخر تحديث: 1 يناير 2026**

## 1. تعريف المنصة

"نقلة لوجيستك" (وتُشار إليها فيما يلي بـ "المنصة") هي منصة تقنية وسيطة تربط الشركات والأفراد الراغبين في خدمات نقل البضائع بشركات النقل المرخّصة، ولا تُعد المنصة طرفاً مباشراً في عقد النقل بين الأطراف.

## 2. تعريف الأطراف

- **العميل**: كل شخص طبيعي أو اعتباري يستخدم المنصة لطلب خدمة نقل بضائع.
- **الناقل**: كل شركة نقل مرخّصة مسجّلة على المنصة لتقديم خدمات النقل.
- **المنصة**: شركة نقلة لوجيستك، الجهة المالكة والمشغّلة لمنصة نقلة.

## 3. مسؤوليات العميل

1. تقديم معلومات دقيقة وكاملة عن الشحنة (الوزن، الأبعاد، نوع البضاعة).
2. الالتزام بمواعيد الاستلام المتفق عليها مع الناقل.
3. ضمان سلامة تغليف البضاعة قبل الاستلام.
4. سداد قيمة الطلب وفق آلية الدفع المتاحة على المنصة.
5. عدم إساءة استخدام المنصة لأغراض غير مشروعة.

## 4. مسؤوليات الناقل

1. الالتزام بمواعيد الاستلام والتسليم.
2. المحافظة على سلامة البضاعة طوال فترة النقل.
3. امتلاك التراخيص النظامية اللازمة (رخصة نقل بضائع، تأمين شامل).
4. الالتزام بأنظمة المرور والسلامة العامة.
5. توفير سائقين مؤهلين وحاصلين على رخص قيادة سارية.

## 5. مسؤولية المنصة

تعمل المنصة كوسيط تقني فقط بين العميل والناقل. ولا تتحمل المنصة مسؤولية:

- تأخر التسليم لأسباب خارجة عن إرادتها.
- تلف أو فقدان البضاعة أثناء النقل.
- النزاعات المباشرة بين العميل والناقل.
- أي ضرر غير مباشر ناتج عن استخدام المنصة.

تقتصر مسؤولية المنصة على توفير البنية التقنية الموثوقة وضمان سلامة المعاملات المالية عبر نظام Escrow.

## 6. سياسة الإلغاء والاسترداد

### الإلغاء من العميل:

- **قبل نشر الطلب**: مجاناً، استرداد كامل.
- **بعد النشر وقبل قبول عرض**: مجاناً.
- **بعد قبول العرض وقبل بدء النقل**: تُخصم رسوم إلغاء بنسبة 10% من قيمة الطلب.
- **بعد بدء النقل**: لا يمكن الإلغاء، يُرجى فتح نزاع.

### الإلغاء من الناقل:

- **قبل بدء النقل**: يمكن الإلغاء مع تطبيق غرامة على تقييم الناقل.
- **بعد بدء النقل**: لا يمكن الإلغاء.

## 7. آلية حل النزاعات

1. **التواصل المباشر**: ينبغي للأطراف محاولة حل أي خلاف بشكل ودي مباشر.
2. **التوسّط عبر المنصة**: يمكن فتح نزاع رسمي عبر صفحة النزاعات.
3. **مراجعة فريق الامتثال**: يراجع الفريق النزاع خلال 24-48 ساعة.
4. **القرار النهائي**: يصدر قرار المنصة ملزماً ضمن حدود مسؤوليتها.
5. **التحكيم النظامي**: لأي نزاع لا يمكن حلّه، يُلجأ إلى نظام التحكيم السعودي.

## 8. الاختصاص القضائي

تخضع هذه الاتفاقية وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع ينشأ بشأنها.

## 9. التعديلات

تحتفظ المنصة بحقها في تعديل هذه الشروط في أي وقت، مع إشعار المستخدمين قبل سريانها بمدة كافية.

## 10. التواصل

لأي استفسار قانوني: legal@naqla.sa`,
  },

  privacy: {
    id: 'privacy',
    title: 'سياسة الخصوصية',
    version: '1.0',
    publishedAt: '2026-01-01T00:00:00Z',
    content: `# سياسة الخصوصية

**آخر تحديث: 1 يناير 2026**

## 1. مقدمة

تحرص "نقلة لوجيستك" على حماية خصوصية مستخدميها وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية الصادر بالمرسوم الملكي رقم (م/19).

## 2. البيانات التي نجمعها

### بيانات الحساب:
- الاسم الكامل
- البريد الإلكتروني
- رقم الجوال
- بيانات الشركة (السجل التجاري، الرقم الضريبي)

### بيانات الاستخدام:
- سجل الطلبات والمعاملات
- المراسلات داخل المنصة
- بيانات تقنية (IP، نوع الجهاز، المتصفح)

### بيانات الموقع:
- مواقع الاستلام والتسليم
- موقع الشاحنة أثناء النقل (للناقلين)

## 3. كيف نستخدم بياناتك

- توفير خدمات المنصة وتنفيذ الطلبات.
- التواصل معك بخصوص حسابك وطلباتك.
- تحسين تجربة الاستخدام وتطوير الخدمات.
- الالتزام بالمتطلبات النظامية والقانونية.
- منع الاحتيال وحماية أمن المنصة.

## 4. مشاركة البيانات

نشارك بياناتك في الحالات التالية فقط:

1. **مع الطرف المقابل**: بيانات التواصل بين العميل والناقل لإتمام الصفقة.
2. **مع مزوّدي الخدمات**: شركاء معتمدون (Resend للبريد، مزوّدو SMS، بوابات الدفع).
3. **مع الجهات الحكومية**: عند الطلب وفق الأنظمة المعمول بها.
4. **في حالات النزاع**: للجهات المختصة بالنظر في النزاع.

**لا نبيع بياناتك أبداً لأي طرف ثالث.**

## 5. أمن البيانات

نستخدم إجراءات حماية تقنية وإدارية تشمل:

- تشفير البيانات أثناء النقل (TLS) والتخزين (AES-256).
- التحقق الثنائي (2FA) لكل الحسابات.
- مراقبة مستمرة لأمن النظام.
- محدودية الوصول للبيانات الحساسة (RBAC).

## 6. حقوقك

وفقاً لنظام حماية البيانات السعودي، لك الحق في:

- الاطلاع على بياناتك.
- تصحيح بياناتك غير الدقيقة.
- حذف بياناتك (بعد انتهاء فترة الاحتفاظ القانونية).
- الاعتراض على معالجة بياناتك.
- نقل بياناتك إلى مزوّد آخر.

## 7. الاحتفاظ بالبيانات

نحتفظ ببياناتك طوال فترة استخدامك للمنصة، وبعد إغلاق حسابك نحتفظ ببعض البيانات لفترة قد تصل إلى 7 سنوات للالتزام بالمتطلبات النظامية (قانون الزكاة والضريبة).

## 8. ملفات تعريف الارتباط (Cookies)

نستخدم ملفات تعريف الارتباط لـ:
- تذكّر تسجيل دخولك.
- تحسين أداء المنصة.
- تحليلات استخدام مجهولة الهوية.

يمكنك إدارة الكوكيز من إعدادات متصفحك.

## 9. التواصل بخصوص الخصوصية

للاستفسارات أو ممارسة حقوقك:
- البريد: privacy@naqla.sa
- المسؤول عن حماية البيانات (DPO): dpo@naqla.sa`,
  },

  transport: {
    id: 'transport',
    title: 'شروط وأحكام النقل',
    version: '1.0',
    publishedAt: '2026-01-01T00:00:00Z',
    content: `# شروط وأحكام النقل

**آخر تحديث: 1 يناير 2026**

## 1. نطاق الخدمة

تطبّق هذه الشروط على جميع عمليات النقل البري للبضائع داخل المملكة العربية السعودية عبر منصة نقلة لوجيستك.

## 2. الالتزامات المتبادلة

### يلتزم العميل:
- بتقديم بيانات دقيقة عن الشحنة.
- بالتغليف السليم للبضائع.
- بحضور موعد التحميل أو توكيل من ينوب عنه.
- بسداد القيمة عبر النظام (Escrow).

### يلتزم الناقل:
- بالحضور في الموعد المحدد للتحميل.
- بنقل البضاعة بأمان وفي أقصر مدة معقولة.
- بتوفير شاحنة مناسبة للحمولة.
- بالحصول على إيصال تسليم موقّع.

## 3. التأمين والمسؤولية

- يجب أن يكون لدى كل ناقل تأمين شامل ساري المفعول يغطي البضائع المنقولة.
- في حال تلف أو فقدان البضاعة:
  - **تلف جزئي**: تعويض حسب نسبة الضرر.
  - **تلف كلي أو فقدان**: تعويض كامل بحد أقصى قيمة الفاتورة المقدّمة من العميل.
- لا يشمل التعويض الأضرار غير المباشرة (فرصة، أرباح متوقعة).

## 4. التأخير

### تأخر الناقل:
- **حتى ساعتين**: لا تعويض.
- **من 2 إلى 4 ساعات**: تنبيه على الناقل.
- **أكثر من 4 ساعات**: تعويض تلقائي 5% من قيمة الطلب للعميل.
- **أكثر من 12 ساعة**: يحق للعميل إلغاء الطلب مع استرداد كامل.

### تأخر العميل (في الحضور للتحميل):
- **حتى ساعة**: لا رسوم.
- **من 1 إلى 4 ساعات**: رسوم انتظار 100 ر.س/ساعة.
- **أكثر من 4 ساعات**: يحق للناقل إلغاء الطلب مع احتساب رسوم الإلغاء.

## 5. البضائع الممنوعة

يحظر نقل البضائع التالية عبر المنصة:

- المواد المخدّرة بكافة أنواعها.
- الأسلحة والذخائر بدون تصاريح.
- المواد المشعّة.
- النقود والمعادن الثمينة.
- البضائع المهرّبة أو غير القانونية.
- الكائنات الحية بدون تراخيص بيطرية.

## 6. الحمولات الخاصة

تتطلب الحمولات التالية ترتيبات خاصة:

- **المواد الخطرة (HAZMAT)**: ناقل مرخّص + تنسيق مسبق.
- **الحمولات الاستثنائية (Oversized)**: مرافقة أمنية + إخطار المرور.
- **المواد القابلة للتلف**: شاحنة مبرّدة + توقيت دقيق.
- **مواد البناء الثقيلة**: لوبد أو مسطح كبير.

## 7. إثبات التسليم

عند التسليم يجب:
- توقيع العميل أو من ينوب عنه على بوليصة التسليم.
- التقاط صورة للبضاعة بعد التفريغ.
- تحديث حالة الطلب في المنصة فوراً.

## 8. النزاعات أثناء النقل

إذا وقع أي حادث أو نزاع أثناء النقل:
1. يجب على الناقل إخطار المنصة فوراً.
2. توثيق الحادث بالصور والتقارير.
3. التواصل مع جهات الإنقاذ عند الحاجة.
4. عدم التصرف بالبضاعة دون موافقة العميل/المنصة.

## 9. القوة القاهرة

لا يُعد طرفاً مخلاً بالتزاماته إذا تعذّر التنفيذ بسبب قوة قاهرة:
- الكوارث الطبيعية.
- الحوادث الخارجة عن الإرادة.
- إغلاق الطرق الرسمي.
- الحظر أو القرارات الحكومية.

## 10. الاختصاص

تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع.`,
  },
};

/** SEO / Meta configuration for landing + apps */
export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;          // e.g. "%s | Naqla"
  defaultDescription: string;
  defaultKeywords: string[];
  canonicalUrl: string;
  ogImage: string;
  twitterHandle: string;
  themeColor: string;
  locale: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  // Structured data
  organizationName: string;
  organizationLogo: string;
  organizationPhone: string;
  organizationEmail: string;
  // Verification
  googleSiteVerification: string;
  bingSiteVerification: string;
  // Analytics
  googleAnalyticsId: string;
  facebookPixelId: string;
}

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  siteName: 'نقلة لوجيستك',
  defaultTitle: 'نقلة لوجيستك — منصة نقل البضائع الذكية في السعودية',
  titleTemplate: '%s | نقلة لوجيستك',
  defaultDescription: 'منصة نقلة لوجيستك تربط الشركات بأفضل شركات النقل المعتمدة في المملكة العربية السعودية. أسعار تنافسية، تتبع لحظي، وتأمين شامل لكل شحنة.',
  defaultKeywords: ['نقل بضائع', 'شحن', 'لوجستيات', 'السعودية', 'نقل', 'شاحنات', 'naqla', 'logistics', 'shipping', 'saudi arabia'],
  canonicalUrl: 'https://naqla.sa',
  ogImage: 'https://naqla.sa/og-image.png',
  twitterHandle: '@naqla_sa',
  themeColor: '#0A3D3A',
  locale: 'ar_SA',
  robotsIndex: true,
  robotsFollow: true,
  organizationName: 'نقلة لوجيستك',
  organizationLogo: 'https://naqla.sa/logo.png',
  organizationPhone: '+966920000000',
  organizationEmail: 'support@naqla.sa',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
};

// ─── Truck type catalog (admin-managed) ───────────────────────────────

export interface TruckTypeOption {
  id: string;              // e.g. 'BOX_TRUCK', 'LARGE_FLATBED'
  nameAr: string;
  nameEn: string;
  capacityKg: number;
  description: string;
  imageUrl: string;        // URL to descriptive image (admin uploads/pastes)
  icon: string;            // emoji fallback
  active: boolean;
}

/**
 * Default service-types catalog. Admin can add/edit/disable types from settings,
 * and these populate the service-type dropdown in the provider's add-service wizard.
 */
export const DEFAULT_SERVICE_TYPES: TruckTypeOption[] = [
  {
    id: 'CONSULTING',
    nameAr: 'استشارات',
    nameEn: 'Consulting',
    capacityKg: 0,
    description: 'خدمات الاستشارات المهنية وتقييم الأعمال وإعداد الخطط الاستراتيجية للشركات.',
    imageUrl: '',
    icon: '💼',
    active: true,
  },
  {
    id: 'DESIGN',
    nameAr: 'تصميم',
    nameEn: 'Design',
    capacityKg: 0,
    description: 'خدمات التصميم الجرافيكي والهوية البصرية وتصميم الجرافيك وتصميم المنتجات.',
    imageUrl: '',
    icon: '🎨',
    active: true,
  },
  {
    id: 'INSTALLATION',
    nameAr: 'تركيب',
    nameEn: 'Installation',
    capacityKg: 0,
    description: 'خدمات التركيب والتجميع للمعدات والأجهزة والأنظمة في المواقع المختلفة.',
    imageUrl: '',
    icon: '🔧',
    active: true,
  },
  {
    id: 'MAINTENANCE',
    nameAr: 'صيانة',
    nameEn: 'Maintenance',
    capacityKg: 0,
    description: 'خدمات الصيانة الدورية والطارئة للمعدات والأنظمة والمنشآت.',
    imageUrl: '',
    icon: '🛠️',
    active: true,
  },
  {
    id: 'TECHNICAL_SUPPORT',
    nameAr: 'دعم تقني',
    nameEn: 'Technical Support',
    capacityKg: 0,
    description: 'خدمات الدعم والمساندة التقنية لحل المشكلات وضمان استمرارية الأعمال.',
    imageUrl: '',
    icon: '🖥️',
    active: true,
  },
  {
    id: 'TRAINING',
    nameAr: 'تدريب',
    nameEn: 'Training',
    capacityKg: 0,
    description: 'برامج التدريب وتطوير الكوادر البشرية وورش العمل المتخصصة للمؤسسات.',
    imageUrl: '',
    icon: '📚',
    active: true,
  },
  {
    id: 'IT_SERVICES',
    nameAr: 'خدمات تقنية',
    nameEn: 'IT Services',
    capacityKg: 0,
    description: 'خدمات تكنولوجيا المعلومات من بنية تحتية وأمن سيبراني وتطوير برمجيات.',
    imageUrl: '',
    icon: '💻',
    active: true,
  },
  {
    id: 'LOGISTICS',
    nameAr: 'لوجستيات',
    nameEn: 'Logistics',
    capacityKg: 0,
    description: 'خدمات سلسلة التوريد والشحن والتخزين وإدارة المستودعات.',
    imageUrl: '',
    icon: '📦',
    active: true,
  },
  {
    id: 'PROJECT_MANAGEMENT',
    nameAr: 'إدارة مشاريع',
    nameEn: 'Project Management',
    capacityKg: 0,
    description: 'إدارة المشاريع من التخطيط إلى التسليم وفق أفضل المنهجيات العالمية.',
    imageUrl: '',
    icon: '📋',
    active: true,
  },
  {
    id: 'OTHER',
    nameAr: 'أخرى',
    nameEn: 'Other',
    capacityKg: 0,
    description: 'خدمات متنوعة أخرى لا تندرج ضمن التصنيفات المذكورة.',
    imageUrl: '',
    icon: '⚡',
    active: true,
  },
];

/** @deprecated use DEFAULT_SERVICE_TYPES */
export const DEFAULT_TRUCK_TYPES = DEFAULT_SERVICE_TYPES;

export function truckTypeById(id: string | null | undefined, list: TruckTypeOption[] = DEFAULT_TRUCK_TYPES): TruckTypeOption | undefined {
  if (!id) return undefined;
  return list.find((t) => t.id === id);
}

// ─── DIRECT order negotiations ────────────────────────────────────────
//
// For DIRECT orders (mode='DIRECT', targetCarrierId set), there's no public
// bidding. Instead a private negotiation between client and carrier:
//
//   1. Client creates DIRECT order → status: PUBLISHED (no price)
//   2. Carrier sees it → 3 actions:
//        - ACCEPT_WITH_PRICE → adds round { by: CARRIER, kind: ACCEPT, price }
//        - COUNTER           → adds round { by: CARRIER, kind: COUNTER, price }
//        - DECLINE           → status: DECLINED (client can pick another carrier)
//   3. After carrier's first round → status: NEGOTIATING
//   4. Client sees the latest round → 3 actions:
//        - ACCEPT → order moves to ASSIGNED with agreedPrice = round.price
//        - COUNTER → adds round { by: CLIENT, kind: COUNTER, price }
//        - REJECT → status: DECLINED
//   5. Carrier sees client's counter → same 3 actions, and so on
//
// The last round's `kind` tells the UI which side is "due" to respond.

export type ProposalRoundKind = 'COUNTER' | 'ACCEPT' | 'DECLINE';
export type ProposalRoundBy = 'CLIENT' | 'CARRIER';

export interface ProposalRound {
  by: ProposalRoundBy;
  kind: ProposalRoundKind;
  price: number;
  days?: number;
  notes?: string;
  at: string;
}

export type ProposalStatus =
  | 'AWAITING_CARRIER'        // freshly created DIRECT order, no rounds yet
  | 'AWAITING_CLIENT'         // carrier has proposed, client must respond
  | 'AWAITING_CARRIER_REPLY'  // client has countered, carrier must respond
  | 'ACCEPTED'                // someone accepted — order moves to ASSIGNED
  | 'DECLINED';               // one side declined — order can be re-routed

export interface DirectProposal {
  id: string;
  orderId: string;
  carrierId: string;
  clientId: string;
  rounds: ProposalRound[];
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Demo negotiations. Mirror the real OrderID/CarrierID combinations from
 * the orders seed so they show up in the right place.
 */
export const DIRECT_PROPOSALS: DirectProposal[] = [
  {
    id: 'PRP-001',
    orderId: 'ORD-2025-0170',           // existing DIRECT order to CR-2003
    carrierId: 'CR-2003',
    clientId: 'CL-1001',
    status: 'AWAITING_CLIENT',
    rounds: [
      {
        by: 'CARRIER', kind: 'COUNTER',
        price: 158000, days: 2,
        notes: 'مرافقة أمنية متاحة + خبرة سابقة بالمحوّلات الكهربائية.',
        at: '2026-05-14T09:30:00Z',
      },
    ],
    createdAt: '2026-05-13T19:00:00Z',
    updatedAt: '2026-05-14T09:30:00Z',
  },
];

export function proposalForOrder(orderId: string): DirectProposal | undefined {
  return DIRECT_PROPOSALS.find((p) => p.orderId === orderId);
}

export function proposalsForCarrier(carrierId: string): DirectProposal[] {
  return DIRECT_PROPOSALS.filter((p) => p.carrierId === carrierId);
}

/** The most recent round on a proposal — i.e. the one currently "on the table". */
export function lastRound(proposal: DirectProposal): ProposalRound | undefined {
  return proposal.rounds[proposal.rounds.length - 1];
}

// ─── Team Members & Roles (per company) ──────────────────────────────
//
// Company accounts on Naqla are multi-user. Roles control what each
// member can do inside their company's dashboard:
//
//   OWNER    — single per company, created at signup; cannot be removed/demoted
//   ADMIN    — same permissions as OWNER except cannot remove the owner
//   STAFF    — (client side) operations: create+track orders, view invoices
//   DISPATCH — (carrier side) dispatch: accept orders, manage fleet/drivers
//   FINANCE  — read invoices/payments/statements, export, view-only on orders
//
// The matrix below is the SOURCE OF TRUTH for permission checks both in the
// UI (showing/hiding actions) and on the backend (CompanyRoleGuard).

export type CompanyRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DISPATCH' | 'FINANCE';

export type TeamMemberStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';

export interface TeamMember {
  id: string;
  companyId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: CompanyRole;
  status: TeamMemberStatus;
  addedAt: string;
  /** When non-null, indicates this is the company owner (cannot be removed) */
  isOwner?: boolean;
  avatar?: string;
}

export interface RolePermissions {
  can: string[];
  cannot: string[];
}

/**
 * Permissions matrix. Strings are i18n-keys-like labels — they're rendered
 * as bullet points in the role cards.
 *
 * For CLIENT companies we use {OWNER, ADMIN, STAFF, FINANCE}.
 * For CARRIER companies we use {OWNER, ADMIN, DISPATCH, FINANCE}.
 */
export const CLIENT_ROLE_PERMISSIONS: Record<Extract<CompanyRole, 'OWNER' | 'ADMIN' | 'STAFF' | 'FINANCE'>, RolePermissions> = {
  OWNER: {
    can: [
      'صلاحيات كاملة بدون قيود',
      'إدارة الفريق + تعيين الـ Admin',
      'حذف الحساب أو إغلاقه',
      'تعديل بيانات الشركة + الحساب البنكي',
    ],
    cannot: [],
  },
  ADMIN: {
    can: [
      'إنشاء وإلغاء الطلبات',
      'عرض جميع الطلبات والفواتير',
      'إدارة الفريق وإضافة أعضاء',
      'تعديل بيانات الشركة',
      'عرض الفواتير والمدفوعات',
    ],
    cannot: [
      'حذف المالك أو تغيير دوره',
    ],
  },
  STAFF: {
    can: [
      'إنشاء طلبات جديدة',
      'متابعة الطلبات وتتبعها',
      'عرض الفواتير (قراءة فقط)',
    ],
    cannot: [
      'إلغاء الطلبات',
      'إدارة الفريق',
      'تعديل بيانات الشركة',
      'الوصول للحساب البنكي',
    ],
  },
  FINANCE: {
    can: [
      'عرض الفواتير والمدفوعات',
      'تصدير كشف الحساب (PDF / Excel)',
      'عرض الطلبات (قراءة فقط)',
    ],
    cannot: [
      'إنشاء أو إلغاء طلبات',
      'إدارة الفريق',
      'تعديل بيانات الشركة',
    ],
  },
};

export const CARRIER_ROLE_PERMISSIONS: Record<Extract<CompanyRole, 'OWNER' | 'ADMIN' | 'DISPATCH' | 'FINANCE'>, RolePermissions> = {
  OWNER: {
    can: [
      'صلاحيات كاملة بدون قيود',
      'إدارة الفريق + تعيين الـ Admin',
      'حذف الحساب أو إغلاقه',
      'تعديل بيانات الشركة + الحساب البنكي',
    ],
    cannot: [],
  },
  ADMIN: {
    can: [
      'قبول ورفض الطلبات',
      'إدارة الأسطول والسائقين',
      'إدارة الفريق وإضافة أعضاء',
      'عرض الأرباح والمدفوعات',
      'تعديل بيانات الشركة',
    ],
    cannot: [
      'حذف المالك أو تغيير دوره',
    ],
  },
  DISPATCH: {
    can: [
      'عرض وقبول الطلبات',
      'إدارة الأسطول والسائقين',
      'تحديث حالة الشحنات',
      'تتبع الرحلات لحظياً',
    ],
    cannot: [
      'إدارة الفريق',
      'عرض الأرباح والمدفوعات',
      'تعديل بيانات الشركة',
    ],
  },
  FINANCE: {
    can: [
      'عرض الأرباح والمدفوعات',
      'تصدير كشف الحساب (PDF / Excel)',
      'عرض الطلبات (قراءة فقط)',
    ],
    cannot: [
      'قبول أو رفض طلبات',
      'إدارة الأسطول',
      'إدارة الفريق',
    ],
  },
};

/** Returns the right permissions matrix for a company kind */
export function permissionsFor(kind: CompanyKind, role: CompanyRole): RolePermissions {
  if (kind === 'CLIENT') {
    return CLIENT_ROLE_PERMISSIONS[role as keyof typeof CLIENT_ROLE_PERMISSIONS]
      ?? { can: [], cannot: [] };
  }
  return CARRIER_ROLE_PERMISSIONS[role as keyof typeof CARRIER_ROLE_PERMISSIONS]
    ?? { can: [], cannot: [] };
}

/** Roles available when inviting a new member, by company kind. */
export function availableRolesFor(kind: CompanyKind): CompanyRole[] {
  return kind === 'CLIENT'
    ? ['ADMIN', 'STAFF', 'FINANCE']
    : ['ADMIN', 'DISPATCH', 'FINANCE'];
}

/** Seed team members for the current client + carrier. */
export const TEAM_MEMBERS: TeamMember[] = [
  // Client CL-1001 team
  { id: 'TM-C-1', companyId: 'CL-1001', fullName: 'وليد بن سعد الحربي',  phone: '+966551110001', email: 'walid@jazira-energy.sa',  role: 'OWNER',  isOwner: true, status: 'ACTIVE', addedAt: '2024-03-12T09:00:00Z' },
  { id: 'TM-C-2', companyId: 'CL-1001', fullName: 'سارة بنت عبدالله العمري', phone: '+966551110002', email: 'sara@jazira-energy.sa',   role: 'ADMIN',                 status: 'ACTIVE', addedAt: '2024-05-20T09:00:00Z' },
  { id: 'TM-C-3', companyId: 'CL-1001', fullName: 'فهد بن خالد الدوسري',   phone: '+966551110003',                                          role: 'STAFF',                 status: 'ACTIVE', addedAt: '2024-09-15T09:00:00Z' },
  { id: 'TM-C-4', companyId: 'CL-1001', fullName: 'هند بنت ناصر القحطاني',  phone: '+966551110004', email: 'hind@jazira-energy.sa',  role: 'FINANCE',               status: 'ACTIVE', addedAt: '2025-01-10T09:00:00Z' },
  { id: 'TM-C-5', companyId: 'CL-1001', fullName: 'محمد بن علي الزهراني',  phone: '+966551110005',                                          role: 'STAFF',                 status: 'SUSPENDED', addedAt: '2024-11-08T09:00:00Z' },

  // Carrier CR-2001 team
  { id: 'TM-R-1', companyId: 'CR-2001', fullName: 'فهد بن محمد العتيبي',   phone: '+966552220001', email: 'fahad@fastroute.sa',     role: 'OWNER',  isOwner: true, status: 'ACTIVE', addedAt: '2023-08-10T09:00:00Z' },
  { id: 'TM-R-2', companyId: 'CR-2001', fullName: 'سلطان بن عبدالله الشهري', phone: '+966552220002', email: 'sultan@fastroute.sa',   role: 'ADMIN',                 status: 'ACTIVE', addedAt: '2023-10-05T09:00:00Z' },
  { id: 'TM-R-3', companyId: 'CR-2001', fullName: 'علي بن سعد الغامدي',     phone: '+966552220003',                                          role: 'DISPATCH',              status: 'ACTIVE', addedAt: '2024-02-18T09:00:00Z' },
  { id: 'TM-R-4', companyId: 'CR-2001', fullName: 'منيرة بنت حمد الرشيد',  phone: '+966552220004', email: 'muneera@fastroute.sa',   role: 'FINANCE',               status: 'ACTIVE', addedAt: '2024-06-22T09:00:00Z' },
  { id: 'TM-R-5', companyId: 'CR-2001', fullName: 'خالد بن طلال السبيعي',  phone: '+966552220005',                                          role: 'DISPATCH',              status: 'PENDING_ACTIVATION', addedAt: '2026-05-15T09:00:00Z' },
];

export function teamMembersFor(companyId: string): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.companyId === companyId);
}

export function memberById(id: string): TeamMember | undefined {
  return TEAM_MEMBERS.find((m) => m.id === id);
}

// ───────────────────────────────────────────────────────────────────────────
// Cities (admin-managed, seeded from KSA's major commercial hubs)
// ───────────────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  /** Administrative region (the 13 official regions of Saudi Arabia). */
  region: string;
  /** WGS-84 latitude. */
  lat: number;
  /** WGS-84 longitude. */
  lng: number;
  active: boolean;
}

/**
 * Default seed: 15 commercial-traffic hubs across KSA. Coordinates target the
 * city center (admin can fine-tune later). Used by the New Order wizard for
 * route selection and the maps preview.
 */
export const DEFAULT_CITIES: City[] = [
  { id: 'CITY-RUH', nameAr: 'الرياض',         nameEn: 'Riyadh',     region: 'الرياض',        lat: 24.7136, lng: 46.6753, active: true },
  { id: 'CITY-JED', nameAr: 'جدة',             nameEn: 'Jeddah',     region: 'مكة المكرمة',   lat: 21.3891, lng: 39.8579, active: true },
  { id: 'CITY-DMM', nameAr: 'الدمام',          nameEn: 'Dammam',     region: 'الشرقية',       lat: 26.4207, lng: 50.0888, active: true },
  { id: 'CITY-MKK', nameAr: 'مكة المكرمة',     nameEn: 'Mecca',      region: 'مكة المكرمة',   lat: 21.4858, lng: 39.1925, active: true },
  { id: 'CITY-MED', nameAr: 'المدينة المنورة', nameEn: 'Medina',     region: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, active: true },
  { id: 'CITY-TIF', nameAr: 'الطائف',          nameEn: 'Taif',       region: 'مكة المكرمة',   lat: 21.2854, lng: 40.4150, active: true },
  { id: 'CITY-ABH', nameAr: 'أبها',            nameEn: 'Abha',       region: 'عسير',          lat: 18.2164, lng: 42.5053, active: true },
  { id: 'CITY-TBK', nameAr: 'تبوك',            nameEn: 'Tabuk',      region: 'تبوك',          lat: 28.3998, lng: 36.5716, active: true },
  { id: 'CITY-JUB', nameAr: 'الجبيل',          nameEn: 'Jubail',     region: 'الشرقية',       lat: 27.0174, lng: 49.6220, active: true },
  { id: 'CITY-YNB', nameAr: 'ينبع',            nameEn: 'Yanbu',      region: 'المدينة المنورة', lat: 24.0894, lng: 38.0618, active: true },
  { id: 'CITY-HAI', nameAr: 'حائل',            nameEn: 'Hail',       region: 'حائل',          lat: 27.5114, lng: 41.7208, active: true },
  { id: 'CITY-QSM', nameAr: 'القصيم',          nameEn: 'Qassim',     region: 'القصيم',        lat: 26.3260, lng: 43.9750, active: true },
  { id: 'CITY-NJR', nameAr: 'نجران',           nameEn: 'Najran',     region: 'نجران',         lat: 17.4933, lng: 44.1277, active: true },
  { id: 'CITY-BAH', nameAr: 'الباحة',          nameEn: 'Baha',       region: 'الباحة',        lat: 20.0129, lng: 41.4677, active: true },
  { id: 'CITY-JOF', nameAr: 'الجوف',           nameEn: 'Jouf',       region: 'الجوف',         lat: 29.9697, lng: 40.1677, active: true },
];

// ───────────────────────────────────────────────────────────────────────────
// Cargo Types (admin-managed)
// ───────────────────────────────────────────────────────────────────────────

export interface CargoTypeDef {
  id: string;
  nameAr: string;
  nameEn: string;
  /** Emoji shown in the order wizard and order detail. */
  icon: string;
  /** Requires temperature-controlled transport (e.g. food, medical). */
  requiresRefrigeration: boolean;
  /** Hazardous / sensitive — flagged for compliance + driver matching. */
  hazardous: boolean;
  active: boolean;
}

/**
 * Default seed: 10 cargo type definitions covering the bulk of KSA freight
 * traffic. The legacy `CargoType` union remains for the order schema, but the
 * new admin UI works against this richer record (bilingual + flags + icon).
 */
export const DEFAULT_CARGO_TYPES: CargoTypeDef[] = [
  { id: 'CT-GEN', nameAr: 'بضائع عامة',     nameEn: 'General Goods',      icon: '📦', requiresRefrigeration: false, hazardous: false, active: true },
  { id: 'CT-FOO', nameAr: 'مواد غذائية',    nameEn: 'Food & Beverages',   icon: '🍎', requiresRefrigeration: true,  hazardous: false, active: true },
  { id: 'CT-ELE', nameAr: 'إلكترونيات',     nameEn: 'Electronics',        icon: '💻', requiresRefrigeration: false, hazardous: false, active: true },
  { id: 'CT-FUR', nameAr: 'أثاث',           nameEn: 'Furniture',          icon: '🛋️', requiresRefrigeration: false, hazardous: false, active: true },
  { id: 'CT-CON', nameAr: 'مواد بناء',      nameEn: 'Construction',       icon: '🧱', requiresRefrigeration: false, hazardous: false, active: true },
  { id: 'CT-AUT', nameAr: 'قطع سيارات',     nameEn: 'Auto Parts',         icon: '🔧', requiresRefrigeration: false, hazardous: false, active: true },
  { id: 'CT-MED', nameAr: 'مستلزمات طبية',  nameEn: 'Medical Supplies',   icon: '💊', requiresRefrigeration: true,  hazardous: false, active: true },
  { id: 'CT-CHE', nameAr: 'مواد كيميائية',  nameEn: 'Chemicals',          icon: '🧪', requiresRefrigeration: false, hazardous: true,  active: true },
  { id: 'CT-HAZ', nameAr: 'مواد خطرة',      nameEn: 'Hazardous',          icon: '☢️', requiresRefrigeration: false, hazardous: true,  active: true },
  { id: 'CT-FRA', nameAr: 'هشة',            nameEn: 'Fragile',            icon: '🍷', requiresRefrigeration: false, hazardous: false, active: true },
];

// ───────────────────────────────────────────────────────────────────────────
// SMS / outbound message templates (admin-managed via /admin/settings)
//
// Naming note: a separate richer `NotificationTemplate` already exists above
// for the in-app notifications matrix (per-channel + audience + category).
// These `SmsTemplate` records are the simpler bilingual-body shape used by
// outbound flows like the team-invitation SMS.
// ───────────────────────────────────────────────────────────────────────────

export type SmsTemplateChannel = 'SMS' | 'EMAIL' | 'PUSH';

export interface SmsTemplate {
  id: string;
  /** Stable machine-readable name, used by services to look the template up. */
  name: string;
  channel: SmsTemplateChannel;
  /** Subject — used by EMAIL only. */
  subjectAr?: string;
  subjectEn?: string;
  /** Body content. Supports `{variable}` placeholders. */
  bodyAr: string;
  bodyEn: string;
  /** Names of variables the template can substitute. */
  variables: string[];
  active: boolean;
}

/**
 * Default seed for outbound SMS templates. The `team_member_invitation`
 * template is consumed by `TeamMembersService.invite()` when sending the
 * activation SMS.
 */
export const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'TMP-INVITE',
    name: 'team_member_invitation',
    channel: 'SMS',
    bodyAr:
      'مرحباً {memberName}،\n' +
      'تمت إضافتك لفريق {companyName} على منصة نقلة لوجيستك\n' +
      'بصلاحية: {roleName}\n\n' +
      'انضم الآن: {inviteLink}\n\n' +
      'فريق نقلة لوجيستك',
    bodyEn:
      'Hi {memberName},\n' +
      'You have been added to {companyName} on Naqla Logistics\n' +
      'Role: {roleName}\n\n' +
      'Join now: {inviteLink}\n\n' +
      'The Naqla team',
    variables: ['memberName', 'companyName', 'roleName', 'inviteLink'],
    active: true,
  },
  {
    id: 'TMP-OTP',
    name: 'otp_verification',
    channel: 'SMS',
    bodyAr: 'رمز التحقق: {code}\nصالح لمدة 10 دقائق.\nنقلة لوجيستك',
    bodyEn: 'Verification code: {code}\nValid for 10 minutes.\nNaqla Logistics',
    variables: ['code'],
    active: true,
  },
  {
    id: 'TMP-ORDER-NEW',
    name: 'order_published',
    channel: 'SMS',
    bodyAr: 'تم نشر طلبك رقم {orderNumber}. سنبلغك بأول عرض.\nنقلة لوجيستك',
    bodyEn: 'Order {orderNumber} published. We will notify you of the first bid.\nNaqla Logistics',
    variables: ['orderNumber'],
    active: true,
  },
  {
    id: 'TMP-BID-ACCEPTED',
    name: 'bid_accepted',
    channel: 'SMS',
    bodyAr: 'مبروك! تم قبول عرضك على الطلب {orderNumber} بقيمة {amount} ر.س.',
    bodyEn: 'Congrats! Your bid on order {orderNumber} was accepted ({amount} SAR).',
    variables: ['orderNumber', 'amount'],
    active: true,
  },
];
