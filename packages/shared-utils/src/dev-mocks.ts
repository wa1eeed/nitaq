// ⚠️ TEMPORARY DEV MOCKS — remove (or wrap behind an env flag) once the
// real API/auth flow is restored. Keeps every dashboard page renderable
// while the backend is offline or auth is broken.

// ─── helpers ──────────────────────────────────────────────────
const iso = (daysAgo = 0, hoursAgo = 0) =>
  new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

// ─── Companies ────────────────────────────────────────────────
const COMPANIES = [
  {
    id: 'co-client-1',
    nameAr: 'شركة الجزيرة للطاقة',
    nameEn: 'Aljazeera Energy',
    type: 'CLIENT',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    crNumber: '1010000001',
    vatNumber: '300000000000003',
    logo: null,
    city: 'الرياض',
    region: 'الرياض',
    address: 'حي العليا، طريق الملك فهد',
    contactPhone: '+966112000001',
    contactEmail: 'ops@jazeera.example',
    website: null,
    commissionRate: 0.08,
    creditLimit: 100000,
    walletBalance: 24500,
    subscriptionPlan: 'pro',
    subscriptionEndsAt: null,
    createdAt: iso(45),
    updatedAt: iso(2),
    kycDocuments: [
      { id: 'doc-1', type: 'cr', fileUrl: '#', status: 'APPROVED', notes: null, reviewedBy: null, reviewedAt: iso(40), createdAt: iso(45) },
      { id: 'doc-2', type: 'vat', fileUrl: '#', status: 'APPROVED', notes: null, reviewedBy: null, reviewedAt: iso(40), createdAt: iso(45) },
    ],
    _count: { users: 4, trucks: 0 },
  },
  {
    id: 'co-client-2',
    nameAr: 'مجموعة الإنشاء العربية',
    nameEn: 'Arab Construction Group',
    type: 'CLIENT',
    status: 'ACTIVE',
    kycStatus: 'PENDING',
    crNumber: '1010000005',
    vatNumber: null,
    logo: null,
    city: 'جدة',
    region: 'مكة المكرمة',
    address: null,
    contactPhone: '+966125000010',
    contactEmail: 'info@arabconstruction.example',
    website: null,
    commissionRate: 0.08,
    creditLimit: 50000,
    walletBalance: 8200,
    subscriptionPlan: 'basic',
    subscriptionEndsAt: null,
    createdAt: iso(12),
    updatedAt: iso(1),
    kycDocuments: [],
    _count: { users: 2, trucks: 0 },
  },
  {
    id: 'co-carrier-1',
    nameAr: 'شركة المسار السريع للنقل',
    nameEn: 'Fast Track Transport',
    type: 'CARRIER',
    status: 'ACTIVE',
    kycStatus: 'APPROVED',
    crNumber: '1010000002',
    vatNumber: '300000000000004',
    logo: null,
    city: 'الدمام',
    region: 'الشرقية',
    address: 'المنطقة الصناعية الثانية',
    contactPhone: '+966138000001',
    contactEmail: 'ops@fasttrack.example',
    website: null,
    commissionRate: 0.08,
    creditLimit: 200000,
    walletBalance: 145200,
    subscriptionPlan: 'enterprise',
    subscriptionEndsAt: null,
    createdAt: iso(60),
    updatedAt: iso(1),
    kycDocuments: [
      { id: 'doc-3', type: 'cr', fileUrl: '#', status: 'APPROVED', notes: null, reviewedBy: null, reviewedAt: iso(55), createdAt: iso(60) },
      { id: 'doc-4', type: 'insurance', fileUrl: '#', status: 'APPROVED', notes: null, reviewedBy: null, reviewedAt: iso(55), createdAt: iso(60) },
    ],
    _count: { users: 12, trucks: 18 },
  },
  {
    id: 'co-carrier-2',
    nameAr: 'النقل المتقدم',
    nameEn: 'Advanced Logistics',
    type: 'CARRIER',
    status: 'PENDING_VERIFICATION',
    kycStatus: 'PENDING',
    crNumber: null,
    vatNumber: null,
    logo: null,
    city: 'الرياض',
    region: 'الرياض',
    address: null,
    contactPhone: '+966112000020',
    contactEmail: 'info@advancedlogistics.example',
    website: null,
    commissionRate: 0.10,
    creditLimit: 0,
    walletBalance: 0,
    subscriptionPlan: 'basic',
    subscriptionEndsAt: null,
    createdAt: iso(3),
    updatedAt: iso(0, 3),
    kycDocuments: [
      { id: 'doc-5', type: 'cr', fileUrl: '#', status: 'PENDING', notes: null, reviewedBy: null, reviewedAt: null, createdAt: iso(2) },
    ],
    _count: { users: 1, trucks: 4 },
  },
];

// ─── Orders ───────────────────────────────────────────────────
const ORDERS = [
  {
    id: 'ord-1', orderNumber: 'ORD-2025-0142', status: 'COMPLETED',
    clientId: 'co-client-1', carrierId: 'co-carrier-1',
    cargoType: 'INSTALLATION', cargoDescription: 'تركيب منظومة كاميرات مراقبة',
    weight: null, pallets: null, volume: null,
    originCity: 'الرياض', originRegion: 'الرياض', originAddress: 'المنطقة الصناعية الثانية',
    originLat: null, originLng: null,
    destinationCity: 'الرياض', destinationRegion: 'الرياض', destinationAddress: 'المنطقة الصناعية الثانية',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'INSTALLATION', requiresRefrigeration: false, requiresInsurance: true,
    specialInstructions: null,
    pickupDate: iso(-7), deliveryDate: iso(-5), bidDeadline: iso(8),
    clientBudget: 12000, agreedPrice: 11500, commissionAmount: 920, carrierAmount: 10580,
    actualPickupAt: iso(7), actualDeliveryAt: iso(5),
    poNumber: null, bolNumber: null, documents: [],
    clientRating: 5, carrierRating: 5,
    notes: null, cancelReason: null,
    createdAt: iso(15), updatedAt: iso(5),
    client: { id: 'co-client-1', nameAr: 'شركة الجزيرة للطاقة', logo: null },
    carrier: { id: 'co-carrier-1', nameAr: 'شركة المسار السريع للنقل', logo: null },
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 3 },
  },
  {
    id: 'ord-2', orderNumber: 'ORD-2025-0150', status: 'IN_TRANSIT',
    clientId: 'co-client-1', carrierId: 'co-carrier-1',
    cargoType: 'MAINTENANCE', cargoDescription: 'صيانة دورية لمنظومة التكييف المركزي',
    weight: null, pallets: null, volume: null,
    originCity: 'الرياض', originRegion: 'الرياض', originAddress: 'المنطقة الصناعية الثانية',
    originLat: null, originLng: null,
    destinationCity: 'الرياض', destinationRegion: 'الرياض', destinationAddress: 'المنطقة الصناعية الثانية',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'MAINTENANCE', requiresRefrigeration: false, requiresInsurance: true,
    specialInstructions: 'يلزم حضور مهندس متخصص — الوصول من الباب الخلفي',
    pickupDate: iso(-2), deliveryDate: iso(1), bidDeadline: null,
    clientBudget: 9500, agreedPrice: 9200, commissionAmount: 736, carrierAmount: 8464,
    actualPickupAt: iso(2), actualDeliveryAt: null,
    poNumber: 'PO-2025-887', bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(5), updatedAt: iso(0, 6),
    client: { id: 'co-client-1', nameAr: 'شركة الجزيرة للطاقة', logo: null },
    carrier: { id: 'co-carrier-1', nameAr: 'شركة المسار السريع للنقل', logo: null },
    bids: [], trackingEvents: [
      { id: 'tr-1', orderId: 'ord-2', status: 'PICKED_UP', description: 'تم تحميل الشحنة', lat: null, lng: null, city: 'الرياض', photos: [], signature: null, notes: null, createdBy: 'dev', createdAt: iso(2) },
      { id: 'tr-2', orderId: 'ord-2', status: 'IN_TRANSIT', description: 'متجهة إلى جدة، تجاوزنا الدوادمي', lat: null, lng: null, city: 'الدوادمي', photos: [], signature: null, notes: null, createdBy: 'dev', createdAt: iso(1) },
    ],
    payment: null, invoice: null,
    _count: { bids: 5 },
  },
  {
    id: 'ord-3', orderNumber: 'ORD-2025-0155', status: 'BIDDING',
    clientId: 'co-client-2', carrierId: null,
    cargoType: 'CONSULTING', cargoDescription: 'استشارات هندسية لمشروع توسعة المصنع',
    weight: null, pallets: null, volume: null,
    originCity: 'جدة', originRegion: 'مكة المكرمة', originAddress: 'مدينة جدة الصناعية',
    originLat: null, originLng: null,
    destinationCity: 'جدة', destinationRegion: 'مكة المكرمة', destinationAddress: 'مدينة جدة الصناعية',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'CONSULTING', requiresRefrigeration: false, requiresInsurance: false,
    specialInstructions: null,
    pickupDate: iso(-3), deliveryDate: iso(-2), bidDeadline: iso(-1),
    clientBudget: 6500, agreedPrice: null, commissionAmount: null, carrierAmount: null,
    actualPickupAt: null, actualDeliveryAt: null,
    poNumber: null, bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(1), updatedAt: iso(0, 1),
    client: { id: 'co-client-2', nameAr: 'مجموعة الإنشاء العربية', logo: null },
    carrier: null,
    bids: [
      { id: 'b-1', orderId: 'ord-3', carrierId: 'co-carrier-1', amount: 6200, status: 'PENDING', estimatedDays: 1, notes: 'تسليم في نفس اليوم', expiresAt: null, createdAt: iso(0, 4), updatedAt: iso(0, 4), carrier: { id: 'co-carrier-1', nameAr: 'شركة المسار السريع للنقل', logo: null, status: 'ACTIVE' } },
      { id: 'b-2', orderId: 'ord-3', carrierId: 'co-carrier-2', amount: 5800, status: 'PENDING', estimatedDays: 2, notes: null, expiresAt: null, createdAt: iso(0, 2), updatedAt: iso(0, 2), carrier: { id: 'co-carrier-2', nameAr: 'النقل المتقدم', logo: null, status: 'PENDING_VERIFICATION' } },
    ],
    trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 2 },
  },
  {
    id: 'ord-4', orderNumber: 'ORD-2025-0160', status: 'PUBLISHED',
    clientId: 'co-client-1', carrierId: null,
    cargoType: 'TRAINING', cargoDescription: 'تدريب فريق المبيعات على منظومة CRM الجديدة',
    weight: null, pallets: null, volume: null,
    originCity: 'الرياض', originRegion: 'الرياض', originAddress: 'مقر الشركة — حي العليا',
    originLat: null, originLng: null,
    destinationCity: 'الرياض', destinationRegion: 'الرياض', destinationAddress: 'مقر الشركة — حي العليا',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'TRAINING', requiresRefrigeration: false, requiresInsurance: true,
    specialInstructions: 'يلزم جهاز عرض وقاعة اجتماعات',
    pickupDate: iso(-3), deliveryDate: iso(-1), bidDeadline: iso(2),
    clientBudget: 13500, agreedPrice: null, commissionAmount: null, carrierAmount: null,
    actualPickupAt: null, actualDeliveryAt: null,
    poNumber: null, bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(0, 2), updatedAt: iso(0, 2),
    client: { id: 'co-client-1', nameAr: 'شركة الجزيرة للطاقة', logo: null },
    carrier: null,
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 0 },
  },
  {
    id: 'ord-5', orderNumber: 'ORD-2025-0162', status: 'PUBLISHED',
    clientId: 'co-client-2', carrierId: null,
    cargoType: 'IT_SERVICES', cargoDescription: 'تطوير تطبيق إدارة المستودعات',
    weight: null, pallets: null, volume: null,
    originCity: 'الدمام', originRegion: 'الشرقية', originAddress: 'مقر الشركة — حي الشاطئ',
    originLat: null, originLng: null,
    destinationCity: 'الدمام', destinationRegion: 'الشرقية', destinationAddress: 'مقر الشركة — حي الشاطئ',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'IT_SERVICES', requiresRefrigeration: false, requiresInsurance: true,
    specialInstructions: 'يُفضّل العمل عن بُعد مع اجتماع أسبوعي حضوري',
    pickupDate: iso(-5), deliveryDate: iso(-4), bidDeadline: iso(3),
    clientBudget: 4200, agreedPrice: null, commissionAmount: null, carrierAmount: null,
    actualPickupAt: null, actualDeliveryAt: null,
    poNumber: null, bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(0, 5), updatedAt: iso(0, 5),
    client: { id: 'co-client-2', nameAr: 'مجموعة الإنشاء العربية', logo: null },
    carrier: null,
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 1 },
  },
  {
    id: 'ord-6', orderNumber: 'ORD-2025-0148', status: 'DELIVERED',
    clientId: 'co-client-1', carrierId: 'co-carrier-1',
    cargoType: 'DESIGN', cargoDescription: 'تصميم هوية بصرية للعلامة التجارية',
    weight: null, pallets: null, volume: null,
    originCity: 'جدة', originRegion: 'مكة المكرمة', originAddress: 'حي البوادي',
    originLat: null, originLng: null,
    destinationCity: 'جدة', destinationRegion: 'مكة المكرمة', destinationAddress: 'حي البوادي',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'DESIGN', requiresRefrigeration: false, requiresInsurance: false,
    specialInstructions: null,
    pickupDate: iso(-10), deliveryDate: iso(-8), bidDeadline: null,
    clientBudget: 5500, agreedPrice: 5200, commissionAmount: 416, carrierAmount: 4784,
    actualPickupAt: iso(10), actualDeliveryAt: iso(8),
    poNumber: null, bolNumber: 'BOL-2025-0148', documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(12), updatedAt: iso(8),
    client: { id: 'co-client-1', nameAr: 'شركة الجزيرة للطاقة', logo: null },
    carrier: { id: 'co-carrier-1', nameAr: 'شركة المسار السريع للنقل', logo: null },
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 4 },
  },
  {
    id: 'ord-7', orderNumber: 'ORD-2025-0165', status: 'DRAFT',
    clientId: 'co-client-1', carrierId: null,
    cargoType: 'OTHER', cargoDescription: '— لم يُكتمل بعد —',
    weight: null, pallets: null, volume: null,
    originCity: 'الرياض', originRegion: 'الرياض', originAddress: '',
    originLat: null, originLng: null,
    destinationCity: 'الرياض', destinationRegion: 'الرياض', destinationAddress: '',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'OTHER', requiresRefrigeration: false, requiresInsurance: false,
    specialInstructions: null,
    pickupDate: iso(-4), deliveryDate: null, bidDeadline: null,
    clientBudget: null, agreedPrice: null, commissionAmount: null, carrierAmount: null,
    actualPickupAt: null, actualDeliveryAt: null,
    poNumber: null, bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: null,
    createdAt: iso(0, 1), updatedAt: iso(0, 1),
    client: { id: 'co-client-1', nameAr: 'شركة الجزيرة للطاقة', logo: null },
    carrier: null,
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 0 },
  },
  {
    id: 'ord-8', orderNumber: 'ORD-2025-0145', status: 'CANCELLED',
    clientId: 'co-client-2', carrierId: null,
    cargoType: 'PROJECT_MANAGEMENT', cargoDescription: 'إدارة مشروع تطوير المنصة الرقمية',
    weight: null, pallets: null, volume: null,
    originCity: 'الرياض', originRegion: 'الرياض', originAddress: 'حي الملقا',
    originLat: null, originLng: null,
    destinationCity: 'الرياض', destinationRegion: 'الرياض', destinationAddress: 'حي الملقا',
    destinationLat: null, destinationLng: null,
    requiredServiceType: 'PROJECT_MANAGEMENT', requiresRefrigeration: false, requiresInsurance: false,
    specialInstructions: null,
    pickupDate: iso(-1), deliveryDate: null, bidDeadline: iso(-3),
    clientBudget: 3800, agreedPrice: null, commissionAmount: null, carrierAmount: null,
    actualPickupAt: null, actualDeliveryAt: null,
    poNumber: null, bolNumber: null, documents: [],
    clientRating: null, carrierRating: null,
    notes: null, cancelReason: 'تأجيل المشروع من قِبل العميل',
    createdAt: iso(8), updatedAt: iso(3),
    client: { id: 'co-client-2', nameAr: 'مجموعة الإنشاء العربية', logo: null },
    carrier: null,
    bids: [], trackingEvents: [], payment: null, invoice: null,
    _count: { bids: 2 },
  },
];

// ─── Services (provider resources) ───────────────────────────
const TRUCKS = [
  { id: 'tr-1', companyId: 'co-carrier-1', plateNumber: 'SVC-0001', type: 'INSTALLATION', capacity: 1, length: null, width: null, height: null, make: null, model: null, year: null, hasRefrigeration: false, hasGPS: false, isActive: true, photos: [], documents: [], currentDriverId: 'drv-1', createdAt: iso(60), updatedAt: iso(2) },
  { id: 'tr-2', companyId: 'co-carrier-1', plateNumber: 'SVC-0002', type: 'MAINTENANCE', capacity: 1, length: null, width: null, height: null, make: null, model: null, year: null, hasRefrigeration: false, hasGPS: false, isActive: true, photos: [], documents: [], currentDriverId: 'drv-2', createdAt: iso(45), updatedAt: iso(1) },
  { id: 'tr-3', companyId: 'co-carrier-1', plateNumber: 'SVC-0003', type: 'CONSULTING', capacity: 1, length: null, width: null, height: null, make: null, model: null, year: null, hasRefrigeration: false, hasGPS: false, isActive: true, photos: [], documents: [], currentDriverId: null, createdAt: iso(90), updatedAt: iso(5) },
  { id: 'tr-4', companyId: 'co-carrier-1', plateNumber: 'SVC-0004', type: 'TRAINING', capacity: 1, length: null, width: null, height: null, make: null, model: null, year: null, hasRefrigeration: false, hasGPS: false, isActive: false, photos: [], documents: [], currentDriverId: null, createdAt: iso(120), updatedAt: iso(20) },
];

// ─── Drivers ─────────────────────────────────────────────────
const DRIVERS = [
  { id: 'drv-1', userId: 'u-drv-1', companyId: 'co-carrier-1', licenseNumber: '1098765432', licenseExpiry: iso(-365), licenseType: 'ثقيل', status: 'ON_TRIP', currentLat: null, currentLng: null, lastLocationAt: iso(0, 1), rating: 4.8, totalTrips: 142, photo: null, isActive: true, createdAt: iso(60), updatedAt: iso(0, 1), user: { firstName: 'محمد', lastName: 'العنزي', phone: '+966555000001', avatar: null } },
  { id: 'drv-2', userId: 'u-drv-2', companyId: 'co-carrier-1', licenseNumber: '1098765433', licenseExpiry: iso(-450), licenseType: 'ثقيل', status: 'AVAILABLE', currentLat: null, currentLng: null, lastLocationAt: iso(2), rating: 4.6, totalTrips: 98, photo: null, isActive: true, createdAt: iso(50), updatedAt: iso(0, 5), user: { firstName: 'فهد', lastName: 'الشمري', phone: '+966555000002', avatar: null } },
  { id: 'drv-3', userId: 'u-drv-3', companyId: 'co-carrier-1', licenseNumber: '1098765434', licenseExpiry: iso(-200), licenseType: 'ثقيل', status: 'OFF_DUTY', currentLat: null, currentLng: null, lastLocationAt: iso(7), rating: 4.9, totalTrips: 215, photo: null, isActive: true, createdAt: iso(120), updatedAt: iso(1), user: { firstName: 'عبدالله', lastName: 'القحطاني', phone: '+966555000003', avatar: null } },
];

// ─── Payments ────────────────────────────────────────────────
const PAYMENTS = [
  { id: 'pay-1', orderId: 'ord-1', status: 'RELEASED', totalAmount: 11500, commissionAmount: 920, carrierAmount: 10580, paymentMethod: 'BANK', transactionRef: 'TXN-9981', paidAt: iso(6), heldAt: iso(7), releasedAt: iso(4), createdAt: iso(7), updatedAt: iso(4), order: { orderNumber: 'ORD-2025-0142', clientId: 'co-client-1', carrierId: 'co-carrier-1' } },
  { id: 'pay-2', orderId: 'ord-2', status: 'HELD', totalAmount: 9200, commissionAmount: 736, carrierAmount: 8464, paymentMethod: 'BANK', transactionRef: 'TXN-9985', paidAt: iso(2), heldAt: iso(2), releasedAt: null, createdAt: iso(2), updatedAt: iso(2), order: { orderNumber: 'ORD-2025-0150', clientId: 'co-client-1', carrierId: 'co-carrier-1' } },
  { id: 'pay-3', orderId: 'ord-6', status: 'RELEASED', totalAmount: 5200, commissionAmount: 416, carrierAmount: 4784, paymentMethod: 'BANK', transactionRef: 'TXN-9990', paidAt: iso(9), heldAt: iso(10), releasedAt: iso(7), createdAt: iso(10), updatedAt: iso(7), order: { orderNumber: 'ORD-2025-0148', clientId: 'co-client-1', carrierId: 'co-carrier-1' } },
];

// ─── Invoices ────────────────────────────────────────────────
const INVOICES = [
  { id: 'inv-1', invoiceNumber: 'INV-25-0042', status: 'PAID', orderId: 'ord-1', issuerId: 'co-carrier-1', receiverId: 'co-client-1', amount: 10000, vatAmount: 1500, totalAmount: 11500, vatNumber: '300000000000004', crNumber: '1010000002', notes: null, pdfUrl: null, dueDate: iso(-7), paidAt: iso(4), createdAt: iso(7), updatedAt: iso(4), issuer: { nameAr: 'شركة المسار السريع للنقل' }, receiver: { nameAr: 'شركة الجزيرة للطاقة' } },
  { id: 'inv-2', invoiceNumber: 'INV-25-0044', status: 'ISSUED', orderId: 'ord-2', issuerId: 'co-carrier-1', receiverId: 'co-client-1', amount: 8000, vatAmount: 1200, totalAmount: 9200, vatNumber: '300000000000004', crNumber: '1010000002', notes: null, pdfUrl: null, dueDate: iso(-25), paidAt: null, createdAt: iso(1), updatedAt: iso(1), issuer: { nameAr: 'شركة المسار السريع للنقل' }, receiver: { nameAr: 'شركة الجزيرة للطاقة' } },
  { id: 'inv-3', invoiceNumber: 'INV-25-0046', status: 'OVERDUE', orderId: null, issuerId: 'co-carrier-1', receiverId: 'co-client-2', amount: 4500, vatAmount: 675, totalAmount: 5175, vatNumber: '300000000000004', crNumber: '1010000002', notes: 'فاتورة خدمات نقل سابقة', pdfUrl: null, dueDate: iso(15), paidAt: null, createdAt: iso(45), updatedAt: iso(15), issuer: { nameAr: 'شركة المسار السريع للنقل' }, receiver: { nameAr: 'مجموعة الإنشاء العربية' } },
];

// ─── Notifications ───────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 'n-1', userId: 'dev-user', type: 'BID_RECEIVED', titleAr: 'عرض جديد على طلبك', titleEn: null, bodyAr: 'تلقى الطلب ORD-2025-0155 عرضاً جديداً بقيمة 6,200 ر.س', bodyEn: null, isRead: false, readAt: null, data: { orderId: 'ord-3' }, createdAt: iso(0, 1) },
  { id: 'n-2', userId: 'dev-user', type: 'PAYMENT_RELEASED', titleAr: 'تم الإفراج عن المبلغ', titleEn: null, bodyAr: 'تم إفراج 10,580 ر.س لحساب شركة المسار السريع', bodyEn: null, isRead: false, readAt: null, data: { paymentId: 'pay-1' }, createdAt: iso(0, 4) },
  { id: 'n-3', userId: 'dev-user', type: 'ORDER_ASSIGNED', titleAr: 'تم إسناد الطلب', titleEn: null, bodyAr: 'تم إسناد الطلب ORD-2025-0150 لشركة المسار السريع', bodyEn: null, isRead: true, readAt: iso(2), data: { orderId: 'ord-2' }, createdAt: iso(3) },
  { id: 'n-4', userId: 'dev-user', type: 'KYC_APPROVED', titleAr: 'KYC معتمد', titleEn: null, bodyAr: 'تمت الموافقة على وثائق التحقق من شركتك', bodyEn: null, isRead: true, readAt: iso(40), data: null, createdAt: iso(45) },
  { id: 'n-5', userId: 'dev-user', type: 'SYSTEM', titleAr: 'مرحباً بك في نقلة 👋', titleEn: null, bodyAr: 'حسابك جاهز للعمل، أنشئ أول طلب أو تصفّح الفرص المتاحة', bodyEn: null, isRead: true, readAt: iso(58), data: null, createdAt: iso(60) },
];

// ─── Admin dashboard stats ───────────────────────────────────
const ADMIN_DASHBOARD_STATS = {
  orders: { today: 12, week: 87, month: 342 },
  revenue: { gmv: 1547820, commission: 123825 },
  activeCompanies: 287,
  processingOrders: 42,
  openDisputes: 4,
  recentOrders: ORDERS.slice(0, 6).map((o) => ({
    id: o.id, orderNumber: o.orderNumber, status: o.status,
    agreedPrice: o.agreedPrice, createdAt: o.createdAt,
    client: o.client, carrier: o.carrier,
  })),
};

// ─── Settings ────────────────────────────────────────────────
const SETTINGS = [
  { id: 's-1', key: 'commission_default_rate', value: '0.08', category: 'finance', updatedAt: iso(30) },
  { id: 's-2', key: 'vat_rate', value: '0.15', category: 'finance', updatedAt: iso(30) },
  { id: 's-3', key: 'platform_name_ar', value: 'نقلة لوجيستك', category: 'general', updatedAt: iso(30) },
  { id: 's-4', key: 'platform_name_en', value: 'Naqla Logistics', category: 'general', updatedAt: iso(30) },
  { id: 's-5', key: 'support_phone', value: '+966570009449', category: 'general', updatedAt: iso(30) },
];

// ─── Disputes ────────────────────────────────────────────────
const DISPUTES = [
  { id: 'dsp-1', orderId: 'ord-6', status: 'OPEN', reason: 'بضاعة تالفة عند التسليم', description: 'يدّعي العميل أن جزءاً من البضاعة وصل مكسوراً', openedBy: 'u-client-1', assignedTo: null, resolution: null, resolvedAt: null, attachments: [], createdAt: iso(0, 6), updatedAt: iso(0, 6), order: { orderNumber: 'ORD-2025-0148', clientId: 'co-client-1', carrierId: 'co-carrier-1' } },
  { id: 'dsp-2', orderId: 'ord-1', status: 'RESOLVED', reason: 'تأخر في التسليم', description: 'تأخر تسليم الشحنة 8 ساعات عن الموعد المتفق عليه', openedBy: 'u-client-1', assignedTo: 'u-admin', resolution: 'تم خصم 5% من قيمة الطلب', resolvedAt: iso(3), attachments: [], createdAt: iso(5), updatedAt: iso(3), order: { orderNumber: 'ORD-2025-0142', clientId: 'co-client-1', carrierId: 'co-carrier-1' } },
];

// ─── Current user (auth/me) ──────────────────────────────────
const USER_ME = {
  id: 'dev-user',
  email: 'admin@naqla.sa',
  phone: '+966500000001',
  passwordHash: null,
  role: 'SUPER_ADMIN',
  firstName: 'وليد',
  lastName: 'الحربي',
  avatar: null,
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  lastLoginAt: iso(0, 0),
  companyId: null,
  createdAt: iso(180),
  updatedAt: iso(0, 0),
  company: null,
};

// ─── URL → mock resolver ─────────────────────────────────────
/**
 * Returns mock payload for a given API path (without /api prefix),
 * or `null` if no mock is registered for that URL.
 *
 * Used by each portal's axios response interceptor as a dev fallback
 * when the real API isn't reachable or returns an error.
 */
export function getMockResponse(url: string): unknown | null {
  // Strip leading slash & query string for clean matching.
  const path = url.replace(/^\/+/, '').split('?')[0]!;

  // ── Auth/me ─────────────────────────────────────────────
  if (path === 'users/me') return USER_ME;

  // ── Admin dashboard ─────────────────────────────────────
  if (path === 'admin/dashboard/stats') return ADMIN_DASHBOARD_STATS;
  if (path === 'admin/companies') return COMPANIES;
  if (path === 'admin/orders') return ORDERS;
  if (path === 'admin/disputes') return DISPUTES;
  if (path === 'admin/transactions') return [];
  if (path === 'admin/settings') return SETTINGS;

  // ── Companies ───────────────────────────────────────────
  if (path === 'companies') return COMPANIES;
  if (/^companies\/[^/]+\/kyc$/.test(path)) {
    const id = path.split('/')[1];
    return COMPANIES.find((c) => c.id === id)?.kycDocuments ?? [];
  }
  if (/^companies\/[^/]+\/stats$/.test(path)) {
    return { totalOrders: 24, totalRevenue: 124500, activeBids: 3 };
  }
  if (/^companies\/[^/]+$/.test(path)) {
    const id = path.split('/')[1];
    return COMPANIES.find((c) => c.id === id) ?? COMPANIES[0];
  }

  // ── Orders ──────────────────────────────────────────────
  if (path === 'orders') return ORDERS;
  if (/^orders\/[^/]+\/tracking$/.test(path)) {
    const id = path.split('/')[1];
    return ORDERS.find((o) => o.id === id)?.trackingEvents ?? [];
  }
  if (/^orders\/[^/]+\/bids$/.test(path)) {
    const id = path.split('/')[1];
    return ORDERS.find((o) => o.id === id)?.bids ?? [];
  }
  if (/^orders\/[^/]+$/.test(path)) {
    const id = path.split('/')[1];
    return ORDERS.find((o) => o.id === id) ?? ORDERS[0];
  }

  // ── Fleet ───────────────────────────────────────────────
  if (path === 'fleet/trucks') return TRUCKS;
  if (path === 'fleet/drivers') return DRIVERS;
  if (/^fleet\/trucks\/[^/]+$/.test(path)) {
    return TRUCKS.find((t) => t.id === path.split('/')[2]) ?? TRUCKS[0];
  }
  if (/^fleet\/drivers\/[^/]+$/.test(path)) {
    return DRIVERS.find((d) => d.id === path.split('/')[2]) ?? DRIVERS[0];
  }

  // ── Payments / Invoices ─────────────────────────────────
  if (path === 'payments') return PAYMENTS;
  if (/^payments\/[^/]+$/.test(path)) {
    return PAYMENTS.find((p) => p.id === path.split('/')[1]) ?? PAYMENTS[0];
  }
  if (path === 'invoices') return INVOICES;
  if (/^invoices\/[^/]+$/.test(path)) {
    return INVOICES.find((i) => i.id === path.split('/')[1]) ?? INVOICES[0];
  }

  // ── Notifications ───────────────────────────────────────
  if (path === 'notifications') return NOTIFICATIONS;

  return null;
}

// ─── Dev users (used by each portal's login bypass) ──────────
export const DEV_USERS = {
  admin: {
    id: 'dev-user-admin',
    email: 'admin@nitaq.sa',
    phone: '+966500000001',
    firstName: 'وليد',
    lastName: 'الحربي',
    role: 'SUPER_ADMIN',
    companyId: null as string | null,
  },
  client: {
    id: 'dev-user-client',
    email: 'client@nitaq.sa',
    phone: '+966500000002',
    firstName: 'أحمد',
    lastName: 'العتيبي',
    role: 'CLIENT_ADMIN',
    companyId: 'co-client-1' as string | null,
  },
  carrier: {
    id: 'dev-user-carrier',
    email: 'provider@nitaq.sa',
    phone: '+966500000003',
    firstName: 'سلطان',
    lastName: 'القحطاني',
    role: 'PROVIDER_ADMIN',
    companyId: 'co-carrier-1' as string | null,
  },
} as const;

export const DEV_BYPASS_TOKEN = 'dev-bypass-token';
