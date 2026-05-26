# نيطاق — تعليمات Claude Code الشاملة

## نظرة عامة على المشروع

**اسم المنصة:** نيطاق (Nitaq Platform)
**النوع:** Marketplace + Services Management Platform
**السوق المستهدف:** المملكة العربية السعودية (B2B)
**الهدف:** منصة تقنية وسيطة تربط طالبي الخدمات بمقدّمي الخدمات (شركات وأفراد) — "Services Marketplace + Freelance ERP"

---

## السياق التجاري

### المشكلة
- الشركات تعاني من صعوبة إيجاد مقدّمي خدمات موثوقين
- تفاوت الأسعار وغياب الشفافية
- إدارة عبر واتساب واتصالات بدون رقمنة
- مقدّمو الخدمات يعانون من تأخر السداد وقلة الطلبات

### الحل
منصة رقمية تحل: التشغيل، التعاقد، التحصيل، التنظيم، التتبع، إدارة الخدمات

### نموذج الربح
1. عمولة 5-12% على كل طلب
2. اشتراكات شهرية لمقدّمي الخدمات (Basic/Pro/Enterprise)
3. رسوم خدمات مالية (Escrow، دفع آجل)
4. خدمات إضافية (مستندات، تكامل ERP)

---

## المتطلبات التقنية

### Stack التقني المطلوب
```
Backend:     Node.js + NestJS + TypeScript
Database:    PostgreSQL + Prisma ORM
Cache:       Redis
Storage:     MinIO (S3-compatible)
Frontend:    Next.js 14 + TypeScript + Tailwind CSS
Realtime:    Socket.io
API:         REST + WebSocket
Auth:        JWT (Access + Refresh tokens)
Queue:       Bull (Redis-based)
```

### بنية المشروع (Monorepo)
```
nitaq/
├── apps/
│   ├── api/                    # NestJS Backend (Port 4000)
│   └── web/
│       ├── admin/              # لوحة الأدمن (Port 3001)
│       ├── client/             # واجهة العميل (Port 3002)
│       ├── provider/           # واجهة مقدّم الخدمة (Port 3003)
│       └── landing/            # الصفحة التسويقية (Port 3000)
├── packages/
│   ├── shared-types/           # TypeScript types مشتركة
│   ├── shared-ui/              # UI Components مشتركة
│   └── shared-utils/           # Utilities مشتركة
├── docker-compose.yml
├── docker-compose.production.yml
└── turbo.json
```

---

## قاعدة البيانات — Schema الكاملة

### الجداول الرئيسية

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  ADMIN
  CLIENT_ADMIN
  CLIENT_USER
  PROVIDER_ADMIN
  PROVIDER_USER
  EMPLOYEE
}

enum CompanyType {
  CLIENT      // شركة طالبة الخدمة
  PROVIDER    // شركة مقدّمة للخدمة
}

enum CompanyStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  REJECTED
}

enum KYCStatus {
  NOT_SUBMITTED
  PENDING
  APPROVED
  REJECTED
}

enum OrderStatus {
  DRAFT
  PUBLISHED         // منشور للعروض
  BIDDING           // قيد التقديم
  ASSIGNED          // تم الإسناد
  CONFIRMED         // مؤكد
  IN_TRANSIT        // في الطريق
  DELIVERED         // تم التسليم
  COMPLETED         // مكتمل ومحاسب
  CANCELLED
  DISPUTED
}

enum ServiceType {
  CONSULTING         // استشارات
  DESIGN             // تصميم
  DEVELOPMENT        // تطوير
  MAINTENANCE        // صيانة
  CLEANING           // تنظيف
  SECURITY           // أمن وحراسة
  CATERING           // تقديم طعام
  OTHER              // أخرى
}

enum CargoType {
  GENERAL            // بضائع عامة
  FOOD               // مواد غذائية
  CHEMICALS          // مواد كيميائية
  ELECTRONICS        // إلكترونيات
  FURNITURE          // أثاث
  CONSTRUCTION       // مواد بناء
  AUTOMOTIVE         // قطع سيارات
  MEDICAL            // مستلزمات طبية
  HAZARDOUS          // مواد خطرة
  FRAGILE            // هشة
}

enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
  EXPIRED
}

enum PaymentStatus {
  PENDING
  HELD          // Escrow
  RELEASED
  REFUNDED
  FAILED
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  OVERDUE
  CANCELLED
}

enum NotificationType {
  ORDER_CREATED
  BID_RECEIVED
  BID_ACCEPTED
  BID_REJECTED
  ORDER_ASSIGNED
  ORDER_CONFIRMED
  SHIPMENT_STARTED
  SHIPMENT_DELIVERED
  PAYMENT_RECEIVED
  PAYMENT_RELEASED
  KYC_APPROVED
  KYC_REJECTED
  DISPUTE_OPENED
  DISPUTE_RESOLVED
  SYSTEM
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  CLOSED
}

enum EmployeeStatus {
  AVAILABLE
  ON_ASSIGNMENT
  OFF_DUTY
}

// ─── MODELS ───────────────────────────────────────────────────────

model User {
  id                String        @id @default(cuid())
  email             String?       @unique
  phone             String        @unique
  passwordHash      String?
  role              UserRole
  firstName         String
  lastName          String
  avatar            String?
  isActive          Boolean       @default(true)
  isEmailVerified   Boolean       @default(false)
  isPhoneVerified   Boolean       @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  company           Company?      @relation(fields: [companyId], references: [id])
  companyId         String?
  
  driverProfile     DriverProfile?
  notifications     Notification[]
  auditLogs         AuditLog[]
  refreshTokens     RefreshToken[]
  apiKeys           ApiKey[]

  @@index([companyId])
  @@index([role])
}

model Company {
  id                String          @id @default(cuid())
  type              CompanyType
  status            CompanyStatus   @default(PENDING_VERIFICATION)
  kycStatus         KYCStatus       @default(NOT_SUBMITTED)
  
  nameAr            String
  nameEn            String?
  crNumber          String?         @unique  // رقم السجل التجاري
  vatNumber         String?                  // الرقم الضريبي
  logo              String?
  
  // العنوان
  city              String
  region            String
  address           String?
  
  // التواصل
  contactPhone      String
  contactEmail      String
  website           String?
  
  // إعدادات مالية
  commissionRate    Float           @default(0.08)  // 8% افتراضي
  creditLimit       Float           @default(0)
  walletBalance     Float           @default(0)
  
  // اشتراك
  subscriptionPlan  String          @default("basic")
  subscriptionEndsAt DateTime?
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  users             User[]
  services          Service[]
  employees         EmployeeProfile[]
  
  ordersAsClient    Order[]         @relation("ClientOrders")
  ordersAsProvider  Order[]         @relation("ProviderOrders")
  
  bids              Bid[]
  invoicesIssued    Invoice[]       @relation("IssuerInvoices")
  invoicesReceived  Invoice[]       @relation("ReceiverInvoices")
  kycDocuments      KYCDocument[]
  transactions      Transaction[]
  reviews           Review[]        @relation("ReviewedCompany")
  reviewsGiven      Review[]        @relation("ReviewerCompany")

  @@index([type, status])
  @@index([city])
}

model KYCDocument {
  id          String      @id @default(cuid())
  companyId   String
  company     Company     @relation(fields: [companyId], references: [id])
  
  type        String      // cr, vat, license, insurance, etc.
  fileUrl     String
  status      KYCStatus   @default(PENDING)
  notes       String?
  reviewedBy  String?
  reviewedAt  DateTime?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Service {
  id              String      @id @default(cuid())
  companyId       String
  company         Company     @relation(fields: [companyId], references: [id])
  
  serviceCode     String      @unique
  type            ServiceType
  capacity        Float       // الطاقة الاستيعابية
  
  make            String?     // الصانع/المورّد
  model           String?
  year            Int?
  
  isActive        Boolean     @default(true)
  
  photos          String[]
  documents       String[]    // رخصة، تأمين، etc.
  
  currentEmployeeId String?
  currentEmployee   EmployeeProfile? @relation(fields: [currentEmployeeId], references: [id])
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  orderServices   OrderService[]

  @@index([companyId])
  @@index([type])
}

model EmployeeProfile {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id])
  companyId       String
  company         Company         @relation(fields: [companyId], references: [id])
  
  idNumber        String          @unique
  idExpiry        DateTime
  specialty       String          // مثل: تطوير، تصميم، صيانة
  
  status          EmployeeStatus  @default(OFF_DUTY)
  currentLat      Float?
  currentLng      Float?
  lastLocationAt  DateTime?
  
  rating          Float           @default(0)
  totalAssignments Int            @default(0)
  
  photo           String?
  isActive        Boolean         @default(true)
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  assignedServices  Service[]
  orderEmployees    OrderEmployee[]
  locationHistory   LocationHistory[]
}

model Order {
  id                  String        @id @default(cuid())
  orderNumber         String        @unique @default(cuid())
  status              OrderStatus   @default(DRAFT)
  
  // الأطراف
  clientId            String
  client              Company       @relation("ClientOrders", fields: [clientId], references: [id])
  providerId          String?
  provider            Company?      @relation("ProviderOrders", fields: [providerId], references: [id])
  
  // معلومات الطلب
  serviceCategory     ServiceType
  serviceDescription  String
  quantity            Float?        // الكمية إن وُجدت
  duration            Int?          // المدة بالأيام
  
  // المسار
  originCity          String
  originRegion        String
  originAddress       String
  originLat           Float?
  originLng           Float?
  
  destinationCity     String
  destinationRegion   String
  destinationAddress  String
  destinationLat      Float?
  destinationLng      Float?
  
  // متطلبات خاصة
  requiredServiceType ServiceType
  requiresInsurance   Boolean      @default(false)
  specialInstructions String?
  
  // التواريخ
  pickupDate          DateTime
  deliveryDate        DateTime?
  bidDeadline         DateTime?
  
  // التسعير
  clientBudget        Float?        // ميزانية العميل الاسترشادية
  agreedPrice         Float?        // السعر المتفق عليه
  commissionAmount    Float?        // عمولة المنصة
  providerAmount      Float?        // المبلغ لمقدّم الخدمة
  
  // التتبع
  actualPickupAt      DateTime?
  actualDeliveryAt    DateTime?
  
  // مستندات
  poNumber            String?       // رقم أمر الشراء
  bolNumber           String?       // رقم بوليصة الشحن
  documents           String[]
  
  // التقييم
  clientRating        Int?
  providerRating      Int?
  
  notes               String?
  cancelReason        String?
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  
  bids                Bid[]
  orderTrucks         OrderTruck[]
  orderDrivers        OrderDriver[]
  trackingEvents      TrackingEvent[]
  payment             Payment?
  invoice             Invoice?
  dispute             Dispute?
  review              Review?

  @@index([clientId, status])
  @@index([carrierId, status])
  @@index([status])
  @@index([pickupDate])
  @@index([originCity, destinationCity])
}

model Bid {
  id            String      @id @default(cuid())
  orderId       String
  order         Order       @relation(fields: [orderId], references: [id])
  providerId    String
  provider      Company     @relation(fields: [providerId], references: [id])
  
  amount        Float
  status        BidStatus   @default(PENDING)
  
  estimatedDays Int
  notes         String?
  
  expiresAt     DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([orderId, providerId])
  @@index([orderId, status])
}

model OrderService {
  id         String    @id @default(cuid())
  orderId    String
  order      Order     @relation(fields: [orderId], references: [id])
  serviceId  String
  service    Service   @relation(fields: [serviceId], references: [id])
  
  createdAt  DateTime  @default(now())
  
  @@unique([orderId, serviceId])
}

model OrderEmployee {
  id           String          @id @default(cuid())
  orderId      String
  order        Order           @relation(fields: [orderId], references: [id])
  employeeId   String
  employee     EmployeeProfile @relation(fields: [employeeId], references: [id])
  
  assignedAt   DateTime        @default(now())
  
  @@unique([orderId, employeeId])
}

model TrackingEvent {
  id          String    @id @default(cuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])
  
  status      String
  description String
  
  lat         Float?
  lng         Float?
  city        String?
  
  photos      String[]
  signature   String?   // توقيع إلكتروني
  notes       String?
  
  createdBy   String
  createdAt   DateTime  @default(now())

  @@index([orderId])
}

model LocationHistory {
  id          String          @id @default(cuid())
  employeeId  String
  employee    EmployeeProfile @relation(fields: [employeeId], references: [id])
  
  lat         Float
  lng         Float
  speed       Float?
  
  recordedAt  DateTime      @default(now())

  @@index([employeeId, recordedAt])
}

model Payment {
  id              String          @id @default(cuid())
  orderId         String          @unique
  order           Order           @relation(fields: [orderId], references: [id])
  
  status          PaymentStatus   @default(PENDING)
  totalAmount     Float
  commissionAmount Float
  providerAmount  Float
  
  paymentMethod   String?
  transactionRef  String?
  
  paidAt          DateTime?
  heldAt          DateTime?
  releasedAt      DateTime?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Transaction {
  id            String      @id @default(cuid())
  companyId     String
  company       Company     @relation(fields: [companyId], references: [id])
  
  type          String      // credit, debit, commission, payout, refund
  amount        Float
  balance       Float       // الرصيد بعد العملية
  
  reference     String?
  description   String
  
  orderId       String?
  invoiceId     String?
  
  createdAt     DateTime    @default(now())

  @@index([companyId, createdAt])
}

model Invoice {
  id              String          @id @default(cuid())
  invoiceNumber   String          @unique @default(cuid())
  status          InvoiceStatus   @default(DRAFT)
  
  orderId         String?         @unique
  order           Order?          @relation(fields: [orderId], references: [id])
  
  issuerId        String
  issuer          Company         @relation("IssuerInvoices", fields: [issuerId], references: [id])
  receiverId      String
  receiver        Company         @relation("ReceiverInvoices", fields: [receiverId], references: [id])
  
  amount          Float
  vatAmount       Float           @default(0)
  totalAmount     Float
  
  vatNumber       String?
  crNumber        String?
  
  notes           String?
  pdfUrl          String?
  
  dueDate         DateTime?
  paidAt          DateTime?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Dispute {
  id          String          @id @default(cuid())
  orderId     String          @unique
  order       Order           @relation(fields: [orderId], references: [id])
  
  status      DisputeStatus   @default(OPEN)
  reason      String
  description String
  
  openedBy    String
  assignedTo  String?
  
  resolution  String?
  resolvedAt  DateTime?
  
  attachments String[]
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Review {
  id              String    @id @default(cuid())
  orderId         String    @unique
  order           Order     @relation(fields: [orderId], references: [id])
  
  reviewerId      String
  reviewer        Company   @relation("ReviewerCompany", fields: [reviewerId], references: [id])
  reviewedId      String
  reviewed        Company   @relation("ReviewedCompany", fields: [reviewedId], references: [id])
  
  rating          Int       // 1-5
  comment         String?
  
  onTime          Boolean?
  cargoCondition  Boolean?
  communication   Boolean?
  
  createdAt       DateTime  @default(now())

  @@index([reviewedId])
}

model Notification {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(fields: [userId], references: [id])
  
  type        NotificationType
  titleAr     String
  titleEn     String?
  bodyAr      String
  bodyEn      String?
  
  isRead      Boolean             @default(false)
  readAt      DateTime?
  
  data        Json?               // بيانات إضافية (orderId, etc.)
  
  createdAt   DateTime            @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

model AuditLog {
  id            String    @id @default(cuid())
  userId        String?
  user          User?     @relation(fields: [userId], references: [id])
  
  action        String
  resourceType  String
  resourceId    String?
  
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  
  createdAt     DateTime  @default(now())

  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([createdAt])
}

model RefreshToken {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  token       String    @unique
  isRevoked   Boolean   @default(false)
  
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  @@index([userId])
}

model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  name        String
  key         String    @unique
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?
}

model Setting {
  id        String    @id @default(cuid())
  key       String    @unique
  value     String
  category  String    @default("general")
  updatedAt DateTime  @updatedAt
}
```

---

## API Endpoints الكاملة

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/verify-phone
POST /api/auth/send-otp
POST /api/auth/reset-password
```

### Companies
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
POST   /api/companies/:id/kyc
GET    /api/companies/:id/kyc
PUT    /api/companies/:id/kyc/status    [ADMIN]
GET    /api/companies/:id/stats
```

### Orders
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id
POST   /api/orders/:id/publish
POST   /api/orders/:id/assign
POST   /api/orders/:id/confirm
POST   /api/orders/:id/cancel
GET    /api/orders/:id/tracking
POST   /api/orders/:id/tracking     (إضافة حدث تتبع)
```

### Bids
```
GET    /api/orders/:orderId/bids
POST   /api/orders/:orderId/bids
PUT    /api/orders/:orderId/bids/:id
POST   /api/orders/:orderId/bids/:id/accept
POST   /api/orders/:orderId/bids/:id/reject
```

### Services
```
GET    /api/services
POST   /api/services
GET    /api/services/:id
PUT    /api/services/:id
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
POST   /api/employees/:id/location
```

### Payments & Invoices
```
GET    /api/payments
GET    /api/payments/:id
POST   /api/payments/:id/release     [ADMIN]
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
POST   /api/invoices/:id/send
```

### Admin
```
GET    /api/admin/dashboard/stats
GET    /api/admin/companies
PUT    /api/admin/companies/:id/status
GET    /api/admin/orders
GET    /api/admin/disputes
PUT    /api/admin/disputes/:id
GET    /api/admin/transactions
GET    /api/admin/settings
PUT    /api/admin/settings
```

### Notifications
```
GET    /api/notifications
PUT    /api/notifications/read-all
PUT    /api/notifications/:id/read
```

---

## الواجهات المطلوبة

### 1. لوحة الأدمن (admin dashboard)
صفحات مطلوبة:
- `/` — لوحة التحكم الرئيسية (إحصائيات شاملة)
- `/companies` — إدارة الشركات (عملاء + مقدّمو الخدمات)
- `/companies/:id` — تفاصيل شركة + KYC
- `/orders` — إدارة جميع الطلبات
- `/orders/:id` — تفاصيل طلب
- `/payments` — المدفوعات والمعاملات المالية
- `/disputes` — النزاعات
- `/settings` — إعدادات المنصة (عمولات، etc.)
- `/reports` — تقارير

إحصائيات Dashboard:
- إجمالي الطلبات (اليوم / الأسبوع / الشهر)
- إجمالي الإيرادات والعمولات
- عدد الشركات النشطة
- طلبات قيد المعالجة
- نزاعات مفتوحة
- رسم بياني للطلبات والإيرادات
- آخر طلبات الخدمات

### 2. واجهة العميل (client portal)
صفحات مطلوبة:
- `/` — Dashboard (طلباتي، إحصائيات)
- `/orders` — قائمة طلباتي
- `/orders/new` — إنشاء طلب جديد (wizard متعدد الخطوات)
- `/orders/:id` — تفاصيل طلب + تتبع + عروض
- `/invoices` — فواتيري
- `/payments` — مدفوعاتي
- `/company` — إعدادات شركتي + KYC
- `/notifications` — الإشعارات

تدفق إنشاء طلب (New Order Wizard):
```
خطوة 1: معلومات الطلب (نوع الخدمة، الوصف، الكمية)
خطوة 2: الموقع والتوقيت (مكان الخدمة، تاريخ البدء)
خطوة 3: متطلبات خاصة (نوع الخدمة المطلوبة، تأمين)
خطوة 4: الميزانية والملاحظات
خطوة 5: مراجعة وتأكيد
```

### 3. واجهة مقدّم الخدمة (provider portal)
صفحات مطلوبة:
- `/` — Dashboard (فرص متاحة، طلباتي النشطة)
- `/opportunities` — فرص الخدمات المتاحة (Marketplace)
- `/opportunities/:id` — تفاصيل فرصة + تقديم عرض
- `/orders` — طلباتي المقبولة
- `/orders/:id` — تفاصيل طلب + تحديث حالة
- `/services` — قائمة الخدمات المقدّمة
- `/employees` — الموظفون
- `/earnings` — الأرباح والمدفوعات
- `/company` — إعدادات الشركة + KYC
- `/notifications` — الإشعارات

### 4. الصفحة التسويقية (landing page)
- Hero Section
- مميزات المنصة
- كيف تعمل (للعميل / لمقدّم الخدمة)
- إحصائيات
- شهادات
- CTA للتسجيل

---

## متطلبات التصميم

### الهوية البصرية
```css
/* الألوان الرئيسية */
--primary: #0A3D3A;        /* أخضر بترولي */
--primary-light: #0D5C56;
--primary-lighter: #1A7A72;
--accent: #00C9A7;          /* أخضر نعناعي */
--accent-light: #33D4B7;
--gold: #F0C040;             /* ذهبي للإبراز */
--gold-light: #F5D070;

/* الخلفيات */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAF9;
--bg-tertiary: #EEF2F1;

/* Dark Mode */
--bg-dark: #0A1A18;
--bg-dark-card: #0F2420;
--bg-dark-elevated: #162E2A;

/* النصوص */
--text-primary: #1A2E2C;
--text-secondary: #4A6360;
--text-muted: #7A9B98;
--text-dark: #E8F0EF;

/* الحالات */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* الحدود */
--border: #D1DDD9;
--border-dark: #1F3632;
```

### الخطوط
```css
/* عربي */
font-family: 'Tajawal', sans-serif;
/* إنجليزي / أرقام */
font-family: 'Inter', sans-serif;

/* مقاسات */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
```

### متطلبات التصميم
- دعم RTL كامل (اللغة العربية أساسية)
- Light Mode + Dark Mode
- Responsive (Desktop + Tablet + Mobile)
- تصميم احترافي يناسب الأعمال B2B
- تحميل سريع وأداء عالي
- استخدام Tailwind CSS
- مكونات shadcn/ui أو Radix UI

---

## متطلبات Realtime

```typescript
// Socket.io Events

// أحداث يرسلها العميل
'order:subscribe'     // متابعة طلب معين
'order:unsubscribe'

// أحداث يرسلها الخادم
'order:status_changed'    // تغير حالة الطلب
'order:new_bid'           // عرض جديد
'order:bid_accepted'      // قبول عرض
'tracking:location_update' // تحديث موقع الموظف
'notification:new'         // إشعار جديد
'dashboard:stats_update'   // تحديث إحصائيات الأدمن
```

---

## Docker & Deployment

### docker-compose.yml (Development)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nitaq
      POSTGRES_PASSWORD: nitaq_dev_pass
      POSTGRES_DB: nitaq_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### متغيرات البيئة المطلوبة (3 بيئات منفصلة)

القالب الكامل في `.env.development.example` / `.env.staging.example` / `.env.production.example`.

**المتغيرات الأساسية (مطلوبة في كل بيئة):**
```env
# ─── Database (قاعدة بيانات منفصلة لكل بيئة) ─────────
DATABASE_URL=postgresql://user:pass@host:5432/db_name
# Development: localhost:5432/naqla_dev (Docker)
# Staging:     Coolify managed PostgreSQL / postgres DB
# Production:  Coolify managed PostgreSQL / naqla_prod DB

# ─── Redis (منفصل أيضاً) ──────────────────────────────
REDIS_URL=redis://default:pass@host:6379/0
REDIS_PASSWORD=...

# ─── JWT ─────────────────────────────────────────────
JWT_SECRET=...           # ≥ 32 chars dev / ≥ 64 chars staging+prod
JWT_REFRESH_SECRET=...   # يختلف عن SECRET في prod
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── MinIO ───────────────────────────────────────────
MINIO_ENDPOINT=...
MINIO_PORT=9000
MINIO_USE_SSL=false      # true في production
MINIO_ROOT_USER=...
MINIO_ROOT_PASSWORD=...
MINIO_BUCKET=nitaq-dev   # nitaq-staging / nitaq-prod
MINIO_PUBLIC_URL=http://localhost:9000

# ─── App ─────────────────────────────────────────────
NODE_ENV=development
PORT=4000
APP_DOMAIN=localhost     # nqlah.nx.sa في staging
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
FRONTEND_CLIENT_URL=http://localhost:3002
FRONTEND_CARRIER_URL=http://localhost:3003
FRONTEND_ADMIN_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003

# ─── Providers ───────────────────────────────────────
PAYMENT_PROVIDER=mock    # moyasar في production
SMS_PROVIDER=console     # unifonic في production

# ─── Security ────────────────────────────────────────
BCRYPT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# ─── Public (Next.js build-time) ─────────────────────
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3002
NEXT_PUBLIC_CARRIER_URL=http://localhost:3003
```

---

## قواعد الكود

### هيكل NestJS Module
كل feature تكون module مستقل:
```
modules/
  orders/
    orders.module.ts
    orders.controller.ts
    orders.service.ts
    orders.repository.ts
    dto/
      create-order.dto.ts
      update-order.dto.ts
      order-response.dto.ts
    guards/
    decorators/
```

### قواعد TypeScript
- `strict: true` دائماً
- لا استخدام `any` إلا عند الضرورة القصوى مع تعليق
- كل DTO يستخدم `class-validator`
- كل Response يكون typed
- استخدام `Zod` أو `class-validator` للتحقق

### معالجة الأخطاء
```typescript
// كل خطأ يرجع بهذا الشكل
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "الطلب غير موجود",
    "messageEn": "Order not found"
  }
}

// كل نجاح يرجع بهذا الشكل
{
  "success": true,
  "data": { ... },
  "meta": {           // للقوائم
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Pagination
كل قائمة تدعم:
```
GET /api/orders?page=1&limit=20&sort=createdAt&order=desc&search=...&status=...
```

---

## الأولويات وترتيب البناء

### المرحلة 1 — الأساس (الأهم)
1. إعداد المشروع (Monorepo + Docker)
2. قاعدة البيانات (Prisma Schema كاملة)
3. Authentication (تسجيل، دخول، JWT، OTP)
4. إدارة الشركات + KYC
5. نظام الطلبات الكامل
6. نظام العروض (Bidding)
7. نظام التتبع الأساسي
8. نظام المدفوعات (Escrow)
9. نظام الفواتير
10. الإشعارات

### المرحلة 2 — الواجهات
1. Admin Dashboard
2. Client Portal
3. Provider Portal
4. Landing Page

### المرحلة 3 — المتقدم
1. Realtime (Socket.io)
2. GPS Tracking
3. تتبع الموظف
4. تقارير متقدمة
5. API للتطبيقات المستقبلية (Mobile)

---

## ملاحظات مهمة لـ Claude Code

1. **ابنِ المشروع من الصفر** — لا ترث أي كود قديم
2. **الجودة أولاً** — كل module يكون مكتملاً ومختبراً قبل الانتقال
3. **الـ API يكون RESTful** ومنظم وموثق
4. **كل شيء يدعم العربية** — RTL، خط Tajawal، نصوص ثنائية اللغة
5. **لا تختصر في الـ Schema** — كل الجداول مطلوبة كما هي
6. **الأمان أولوية** — JWT، rate limiting، input validation، SQL injection protection
7. **الكود قابل للتوسع** — module-based، SOLID principles
8. **Docker من البداية** — كل شيء يعمل بـ docker compose up
9. **Variables البيئة** — لا أسرار مضمّنة في الكود
10. **الـ Migrations** — كل تغيير في DB يكون migration وليس reset

---

## معلومات الاتصال والنشر

```
اسم المنصة:   نيطاق (Nitaq Platform)
Domain:       nqlah.nx.sa
API:          api.nqlah.nx.sa
Admin:        admin.nqlah.nx.sa
Client:       app.nqlah.nx.sa
Provider:     provider.nqlah.nx.sa
Storage:      storage.nqlah.nx.sa

VPS:          187.124.218.110 (Ubuntu 24.04)
Deploy:       Coolify (Docker Compose)
DB:           Coolify managed PostgreSQL (per-environment)
Redis:        Coolify managed Redis (per-environment)
Storage:      MinIO on VPS

الهاتف:       +966 570009449
```

---

## Coolify Staging — البنية الحالية

**Project:** `nqlah-logistic`

| Resource | Domain | Port |
|---|---|---|
| `nitaq-api-staging` | `api.nqlah.nx.sa` | 4000 |
| `nitaq-landing-staging` | `nqlah.nx.sa` | 3000 |
| `nitaq-admin-staging` | `admin.nqlah.nx.sa` | 3001 |
| `nitaq-client-staging` | `app.nqlah.nx.sa` | 3002 |
| `nitaq-provider-staging` | `provider.nqlah.nx.sa` | 3003 |

**Build Variables (مشتركة لكل Next.js apps):**
```
NEXT_PUBLIC_API_URL=https://api.nqlah.nx.sa
NEXT_PUBLIC_WS_URL=wss://api.nqlah.nx.sa
NEXT_PUBLIC_LANDING_URL=https://nqlah.nx.sa
NEXT_PUBLIC_CLIENT_URL=https://app.nqlah.nx.sa
NEXT_PUBLIC_PROVIDER_URL=https://provider.nqlah.nx.sa
NEXT_PUBLIC_MINIO_URL=https://storage.nqlah.nx.sa
```

**Migration (في API container terminal):**
```
node -e "const{execSync}=require('child_process');execSync('npx prisma@5.22.0 migrate deploy --schema=/app/prisma/schema.prisma',{stdio:'inherit'})"
```

**Seed:**
```
node dist/prisma/seed.js
```

**API Health:** https://api.nqlah.nx.sa/health ✅ (يعمل منذ v0.9.8)

---

## قائمة النواقص المطلوب إصلاحها (Post-Deploy)

هذه العناصر مؤجَّلة لما بعد نجاح deploy كل الـ 5 تطبيقات:

1. **حذف عبارة "وضع تجريبي"** من كل الواجهات (admin/client/provider)
2. **الشعار الديناميكي** — يُدار من لوحة الأدمن (`/admin/settings`) ويتغيّر في كل مكان تلقائياً
3. **Resend للإيميلات** — تفعيل provider حقيقي لإرسال إشعارات / فواتير / دعوات الفريق
4. **Tap للمدفوعات** — استبدال `PAYMENT_PROVIDER=mock` بـ Tap Payment Gateway الحقيقي
5. **Auto Token Refresh** — الـ frontend يجدّد الـ access token تلقائياً باستخدام refresh token قبل انتهاء الجلسة، بدلاً من logout مفاجئ عند انتهاء الـ 15 دقيقة

6. **Direct Assignment بسعر ثابت:**
   في DIRECT mode أضف خيار "سعر متفق مسبقاً"

   - في `create-order.dto.ts`: أضف `agreedPriceUpfront?: number`
   - في واجهة إنشاء الطلب (`orders/new`):
     عند اختيار DIRECT يظهر:
     "هل عندك سعر متفق مسبقاً مع هذا المزوّد؟"
     [نعم - أدخل السعر] [لا - تفاوض عادي]
   - في `orders.service.ts`:
     إذا DIRECT + `agreedPriceUpfront` موجود
     → تجاوز مرحلة التفاوض
     → أسند مباشرة بالسعر المدخل

7. **نوع الحساب (INDIVIDUAL / COMPANY):**
   - نفس لوحة العميل الحالية (لا نظامين منفصلين)
   - INDIVIDUAL: واجهة مبسطة، دفع فوري
   - COMPANY: فريق، فواتير، تقارير، عقود
   - نفس الـ API — الواجهة تتكيّف حسب نوع الحساب
   - العميل الفرد = تطبيق موبايل فقط (يُطوَّر لاحقاً)

8. **Smart Availability Engine:**

   **أ) Availability Card:**
   - تظهر لمقدّم الخدمة/الموظف بعد تأكيد الإنجاز (بخيار، ليس تلقائي)
   - نافذة بسيطة: "هل أنت متاح لطلب جديد؟"
   - [نعم - انشر الآن] [لا]
   - عند نعم: `location` تلقائي، `suggestedPrice` مقترح
   - صلاحية 6 ساعات — Status: `ACTIVE → MATCHED → EXPIRED`

   **ب) Smart Matching Engine:**
   - عند availability جديدة:
     1. ابحث عن طلبات معلّقة مناسبة
     2. وجد → أرسل notification للعميل بسعر مخفض
     3. ما وجد → انشر على Load Board تلقائياً
   - عند طلب جديد:
     1. ابحث في Contracts أولاً
     2. ابحث في Availabilities النشطة
     3. ما وجد → انشر على Marketplace

   **ج) Load Board:**
   - صفحة عامة في Landing Page
   - بدون login للمشاهدة، تحتاج login للحجز
   - فلتر: مدينة + نوع الخدمة + وقت

9. **PWA لمقدّم الخدمة/الموظف:**
   - استلام مهام
   - تتبع GPS
   - إثبات الإنجاز (صورة + توقيع)
   - Availability Card بضغطة واحدة بعد الإنجاز

10. **PWA للعميل الفرد:**
   - طلب سريع
   - تتبع طلب الخدمة
   - Load Board مدمج
   - دفع فوري

11. **الترجمة الكاملة AR/EN** ← آخر شيء

12. **تطبيق الموبايل الموحّد (React Native / Expo)**

   التطبيق يخدم نوعين مختلفين من مقدّمي الخدمات:

   **أ) مقدّم الخدمة الشركة — موظّف (Employed Employee):**
   - يعمل لصالح شركة مقدّمة للخدمة مُسجَّلة في المنصة
   - تمنحه الشركة invite عبر `/employees/invite`
   - يرى فقط الطلبات المُسنَدة إليه من شركته
   - لا يرى السوق (Marketplace) ولا الأسعار
   - Flow: `إشعار بطلب جديد → قبول → تأكيد استلام → تحديث موقع → تأكيد تسليم + صورة + توقيع`

   **ب) مقدّم الخدمة الفرد (Individual Provider):**
   - شركته هو — يقدّم خدمة واحدة أو أكثر
   - يُسجَّل مستقلاً بدون دعوة
   - يرى سوق الطلبات كاملاً (Marketplace + Direct)
   - يتقدّم بعروض (Bids) مثل شركات مقدّمي الخدمات
   - يُسند الطلب إليه مباشرة (هو = شركته = موظّفه)

   **الـ API مشترك بين النوعين** — فارق الصلاحيات في roles:
   - Employed Employee: role = `EMPLOYEE` (يرى طلباته فقط)
   - Individual Provider: role = `PROVIDER_ADMIN` (يرى السوق)

   **الشاشات المشتركة:**
   - تفاصيل الطلب + Timeline
   - تحديث الموقع GPS (real-time)
   - إثبات الإنجاز: صورة + توقيع → `POST /orders/:id/tracking`
   - إشعارات Push

   **شاشات فريدة لمقدّم الخدمة الفرد:**
   - قائمة فرص (Marketplace) + فلترة
   - تقديم عرض (Bid) + `proposedDeliveryDate`
   - Availability Card بعد الإنجاز
   - محفظة + سجل المدفوعات

   **ملاحظات للتطوير:**
   - Endpoint المصادقة مشترك: `POST /auth/login`، role يُحدّد السلوك
   - `POST /orders/:id/tracking` مفتوح للـ EMPLOYEE role
   - استخدم `GET /orders?mine=true` للموظف المُسنَد
   - استخدم `GET /orders` (بدون mine) لمقدّم الخدمة الفرد لرؤية السوق

---

### قرارات معتمدة (مرجعية ثابتة)

- العميل الفرد = تطبيق موبايل فقط (ليس ويب)
- Availability Card = بخيار بعد الإنجاز (ليس تلقائي)
- نموذج موحد للعملاء (INDIVIDUAL/COMPANY) بدون نظامين منفصلين

---

## ملخص الأولوية القصوى

ابنِ منصة خدمات احترافية تماماً للسوق السعودي تجمع:
- **Marketplace** لطلبات الخدمات
- **Services Management** لإدارة مقدّمي الخدمات
- **Tracking** لتتبع تنفيذ الخدمات
- **Escrow** للمدفوعات الآمنة
- **3 واجهات** (Admin + Client + Provider)

التصميم يكون: احترافي، أخضر بترولي، يدعم Dark Mode، خط Tajawal عربي، RTL كامل.

---

## مرجع التصميم البصري — مستوحى من IBP

### المبادئ العامة للتصميم
بناءً على النماذج المرجعية، التصميم يكون:
- **Clean & Minimal** — مساحات بيضاء واسعة، لا ازدحام
- **Professional B2B** — ليس تطبيق مستهلك، بل أداة عمل
- **Data-Dense but Readable** — جداول وإحصائيات واضحة
- **Consistent** — نفس المكونات في كل مكان

---

### هيكل الصفحات (Layout)

```
┌─────────────────────────────────────────────────────┐
│  Topbar: Logo | Search | Lang | Notifications | User │  h-14 (56px)
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   Sidebar    │         Main Content                  │
│   w-[280px]  │         flex-1                        │
│              │                                       │
│  Logo        │  Page Header                          │
│  Nav Groups  │  ─────────────                        │
│  Nav Items   │  Stats Cards (4 cols)                 │
│              │  ─────────────                        │
│  [Settings]  │  Table / Content                      │
│              │                                       │
│  [User]      │                                       │
└──────────────┴──────────────────────────────────────┘
```

---

### Sidebar المفصّل

```tsx
// هيكل الـ Sidebar
<Sidebar>
  {/* Logo */}
  <SidebarHeader>
    <Logo />  {/* أيقونة + اسم المنصة */}
  </SidebarHeader>

  {/* Navigation Groups */}
  <SidebarContent>
    <SidebarGroup label="BROKER WORKSPACE">
      <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" href="/dashboard" />
      <SidebarItem icon={Building2} label="العملاء" href="/clients" />
      <SidebarItem icon={FileText} label="الطلبات" href="/orders" />
      <SidebarItem icon={Briefcase} label="مقدّمو الخدمات" href="/providers" />
      <SidebarItem icon={MapPin} label="التتبع" href="/tracking" />
      <SidebarItem icon={DollarSign} label="المدفوعات" href="/payments" badge="coming-soon" />
      <SidebarItem icon={FileCheck} label="الفواتير" href="/invoices" badge="coming-soon" />
      <SidebarItem icon={BarChart} label="التقارير" href="/reports" badge="coming-soon" />
    </SidebarGroup>

    <SidebarGroup label="SETTINGS">
      <SidebarItem icon={Building} label="الشركة" href="/settings/company" />
      <SidebarItem icon={Users} label="الموظفون" href="/settings/staff" badge="coming-soon" />
      <SidebarItem icon={Bell} label="الإشعارات" href="/settings/notifications" badge="coming-soon" />
    </SidebarGroup>
  </SidebarContent>

  {/* Footer */}
  <SidebarFooter>
    {/* Demo Mode Badge إن وجد */}
    <UserProfile />
  </SidebarFooter>
</Sidebar>
```

**تفاصيل Sidebar Item:**
```css
/* Normal state */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #4A6360;
  cursor: pointer;
  transition: all 0.15s;
}

/* Hover */
.sidebar-item:hover {
  background: #F0F5F4;
  color: #0A3D3A;
}

/* Active */
.sidebar-item.active {
  background: #EBF5F3;
  color: #0A3D3A;
  font-weight: 500;
}

/* "Coming Soon" badge */
.badge-coming-soon {
  font-size: 10px;
  padding: 2px 6px;
  background: #F3F4F6;
  color: #9CA3AF;
  border-radius: 4px;
  margin-left: auto;
}
```

---

### Topbar المفصّل

```tsx
<Topbar>
  {/* Search - يأخذ معظم المساحة */}
  <SearchInput 
    placeholder="ابحث عن عملاء، طلبات، خدمات..."
    className="w-[480px]"
  />
  
  <div className="flex items-center gap-3 ml-auto">
    {/* Language Toggle */}
    <Button variant="ghost" size="sm">
      <Globe className="w-4 h-4" />
      AR
    </Button>
    
    {/* Notifications */}
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="w-4 h-4" />
      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
    </Button>
    
    {/* User */}
    <UserButton name="وليد الحربي" role="مدير المنصة" />
  </div>
</Topbar>
```

---

### Stats Cards (بطاقات الإحصائيات)

```tsx
// 4 بطاقات في صف واحد
<div className="grid grid-cols-4 gap-4">
  <StatsCard
    label="إجمالي الطلبات"
    value="1,247"
    icon={<Package />}
    iconBg="bg-emerald-50"
    iconColor="text-emerald-600"
  />
  <StatsCard
    label="المدفوعات المستلمة"
    value="SAR 337,695"
    subLabel="78% من الإجمالي"
    icon={<Wallet />}
    iconBg="bg-blue-50"
    iconColor="text-blue-600"
  />
  <StatsCard
    label="في الانتظار"
    value="SAR 93,990"
    icon={<Clock />}
    iconBg="bg-amber-50"
    iconColor="text-amber-600"
  />
  <StatsCard
    label="فروقات"
    value="SAR 2,300"
    subLabel="تحتاج مراجعة"
    icon={<TrendingDown />}
    iconBg="bg-red-50"
    iconColor="text-red-500"
  />
</div>
```

**StatsCard Component:**
```tsx
// التصميم الداخلي
<div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
  <div className="flex items-start justify-between mb-3">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <div className={`p-2.5 rounded-xl ${iconBg}`}>
      <div className={`w-5 h-5 ${iconColor}`}>{icon}</div>
    </div>
  </div>
  <div className="text-2xl font-bold text-gray-900">{value}</div>
  {subLabel && <div className="text-xs text-gray-400 mt-1">{subLabel}</div>}
</div>
```

---

### Page Header

```tsx
<PageHeader>
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
  </div>
  <div className="flex gap-2 ml-auto">
    {actions}  {/* أزرار مثل Export, New Order */}
  </div>
</PageHeader>
```

---

### الجداول (Tables)

```tsx
// هيكل الجدول المثالي
<Table>
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        رقم الطلب
      </TableHead>
      <TableHead>العميل</TableHead>
      <TableHead>مقدّم الخدمة</TableHead>
      <TableHead>الحالة</TableHead>
      <TableHead>المبلغ</TableHead>
      <TableHead></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow 
        key={row.id}
        className="hover:bg-gray-50/50 cursor-pointer border-b border-gray-50"
      >
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**قواعد الجداول:**
- Header: خلفية `bg-gray-50`، نص `text-xs uppercase text-gray-400`
- Rows: `hover:bg-gray-50/50`، فاصل خفيف `border-gray-50`
- الأرقام المالية: `font-semibold` دائماً
- لا padding زائد — `py-3 px-4`

---

### Status Badges

```tsx
// الحالات المختلفة وألوانها
const statusConfig = {
  // طلبات
  DRAFT:       { label: 'مسودة',      bg: 'bg-gray-100',   text: 'text-gray-600' },
  PUBLISHED:   { label: 'منشور',      bg: 'bg-blue-50',    text: 'text-blue-600' },
  BIDDING:     { label: 'عروض',       bg: 'bg-purple-50',  text: 'text-purple-600' },
  ASSIGNED:    { label: 'مُسند',      bg: 'bg-amber-50',   text: 'text-amber-600' },
  IN_TRANSIT:  { label: 'في الطريق', bg: 'bg-blue-50',    text: 'text-blue-700' },
  DELIVERED:   { label: 'تم التسليم', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  COMPLETED:   { label: 'مكتمل',     bg: 'bg-green-50',   text: 'text-green-700' },
  CANCELLED:   { label: 'ملغى',      bg: 'bg-red-50',     text: 'text-red-600' },
  DISPUTED:    { label: 'نزاع',       bg: 'bg-orange-50',  text: 'text-orange-600' },
  
  // KYC
  COMPLETED:   { label: 'مكتمل',     bg: 'bg-green-50',   text: 'text-green-700' },
  IN_PROGRESS: { label: 'جارٍ',      bg: 'bg-amber-50',   text: 'text-amber-600' },
  EXPIRED:     { label: 'منتهي',     bg: 'bg-red-50',     text: 'text-red-600' },
  PENDING:     { label: 'انتظار',    bg: 'bg-gray-100',   text: 'text-gray-600' },
}

// Component
<span className={`
  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  ${statusConfig[status].bg} ${statusConfig[status].text}
`}>
  {statusConfig[status].label}
</span>
```

---

### Tabs للتصفية

```tsx
// مثل All clients | Corporate | Individual
<div className="flex gap-2 mb-4">
  <TabButton active={activeTab === 'all'} onClick={() => setTab('all')}>
    <Users className="w-4 h-4" />
    الكل
    <Badge>{totalCount}</Badge>
  </TabButton>
  <TabButton active={activeTab === 'corporate'}>
    <Building2 className="w-4 h-4" />
    شركات
    <Badge>{corporateCount}</Badge>
  </TabButton>
</div>

// TabButton Style
.tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.tab-button.active {
  background: #0A3D3A;
  color: white;
}

.tab-button:not(.active) {
  color: #4A6360;
  border-color: #E5E7EB;
}

.tab-button:not(.active):hover {
  background: #F0F5F4;
}

.tab-badge {
  background: rgba(255,255,255,0.2); /* on active */
  background: #F3F4F6;               /* on inactive */
  color: inherit;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 10px;
}
```

---

### الأزرار (Buttons)

```tsx
// Primary - أخضر بترولي
<Button className="bg-[#0A3D3A] hover:bg-[#0D5C56] text-white rounded-lg px-4 py-2 text-sm font-medium">
  <Plus className="w-4 h-4 ml-1.5" />
  طلب جديد
</Button>

// Secondary - خط فقط
<Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
  <Download className="w-4 h-4 ml-1.5" />
  تصدير
</Button>

// Ghost - بلا خلفية
<Button variant="ghost" className="text-gray-600 hover:bg-gray-100 rounded-lg">
  ...
</Button>

// Danger
<Button className="bg-red-500 hover:bg-red-600 text-white rounded-lg">
  حذف
</Button>
```

---

### Urgent Tasks / Priority Items

```tsx
// المهام العاجلة — مثل ما في Dashboard
<UrgentTaskItem
  type="renewal"      // تحدد لون الشريط الجانبي
  title="تجديد وثيقة"
  reference="ORD-2025-0150"
  company="شركة الجزيرة للطاقة"
  timing="اليوم"
  amount="SAR 1,437,500"
  onOpen={() => {}}
/>

// Style
.urgent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #F3F4F6;
  background: white;
  
  /* الشريط الجانبي اللوني */
  border-left: 3px solid {color};
}

/* ألوان حسب الأولوية */
critical:  #EF4444  /* أحمر */
high:      #F59E0B  /* أصفر */
medium:    #3B82F6  /* أزرق */
low:       #10B981  /* أخضر */
```

---

### Dark Mode

```css
/* كل المكونات تدعم Dark Mode */
@layer base {
  .dark {
    --bg: #0A1A18;
    --bg-card: #0F2420;
    --bg-elevated: #162E2A;
    --border: #1F3632;
    --text: #E8F0EF;
    --text-muted: #6B9B96;
  }
}

/* Sidebar Dark */
.dark .sidebar {
  background: #0F2420;
  border-right-color: #1F3632;
}

/* Cards Dark */
.dark .stats-card {
  background: #0F2420;
  border-color: #1F3632;
}

/* Table Dark */
.dark .table-header {
  background: #162E2A;
}
.dark .table-row:hover {
  background: #162E2A;
}
```

---

### Search Component

```tsx
// Search bar واسع في الـ Topbar
<div className="relative w-[480px]">
  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    className="
      w-full
      bg-gray-50 
      border border-gray-200 
      rounded-xl 
      py-2.5 pr-10 pl-4
      text-sm
      placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-[#0A3D3A]/20 focus:border-[#0A3D3A]
    "
    placeholder="ابحث عن طلبات، شركات، خدمات..."
  />
</div>
```

---

### Empty States

```tsx
// لما الجدول فارغ
<EmptyState
  icon={<Package className="w-12 h-12 text-gray-300" />}
  title="لا توجد طلبات"
  description="لم يتم إنشاء أي طلبات بعد. أنشئ طلبك الأول الآن."
  action={
    <Button>
      <Plus className="w-4 h-4 ml-1.5" />
      طلب جديد
    </Button>
  }
/>
```

---

### Typography Scale

```css
/* العناوين */
h1 { font-size: 24px; font-weight: 700; color: #111827; }  /* Page title */
h2 { font-size: 18px; font-weight: 600; color: #111827; }  /* Section title */
h3 { font-size: 16px; font-weight: 600; color: #374151; }  /* Card title */

/* النصوص */
.text-body  { font-size: 14px; color: #374151; }
.text-small { font-size: 12px; color: #6B7280; }
.text-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; }

/* الأرقام المالية */
.amount-large { font-size: 24px; font-weight: 700; font-family: 'Inter'; }
.amount-medium { font-size: 16px; font-weight: 600; font-family: 'Inter'; }
.amount-small { font-size: 14px; font-weight: 500; font-family: 'Inter'; }

/* الأرقام السالبة (فروقات) */
.amount-negative { color: #EF4444; }
.amount-positive { color: #10B981; }
```

---

### الـ Spacing والـ Radius

```css
/* الـ Border Radius */
--radius-sm:  6px;    /* badges, small elements */
--radius-md:  8px;    /* buttons, inputs */
--radius-lg:  12px;   /* cards, modals */
--radius-xl:  16px;   /* large cards */
--radius-2xl: 20px;   /* panels */

/* الـ Shadows */
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-elevated: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
--shadow-dropdown: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
```

---

### مكونات مهمة جداً لـ Claude Code

```
يجب بناء هذه المكونات كـ shared-ui:

1. StatsCard          - بطاقة إحصائية
2. DataTable          - جدول بيانات مع pagination وfilter
3. StatusBadge        - badge للحالة
4. PageHeader         - header الصفحة مع العنوان والأزرار
5. SidebarLayout      - الـ layout الرئيسي
6. SearchInput        - حقل البحث
7. TabsFilter         - tabs للتصفية
8. EmptyState         - حالة الفراغ
9. LoadingState       - حالة التحميل
10. UrgentTaskItem    - عنصر المهمة العاجلة
11. ConfirmDialog     - dialog التأكيد
12. FormField         - حقل النموذج مع label وerror
13. Avatar            - صورة المستخدم/الشركة
14. Breadcrumb        - مسار التنقل
15. DateRangePicker   - محدد نطاق التاريخ
```

---

### ملاحظة نهائية للتصميم

**الأولوية في التصميم:**
1. وضوح البيانات — المستخدم يقرأ الأرقام بسرعة
2. سهولة التنقل — الـ Sidebar ثابت وواضح
3. الاتساق — نفس المكونات في كل مكان
4. السرعة — لا animations ثقيلة
5. اللغة العربية — RTL حقيقي، ليس مجرد `dir="rtl"`

**لا تستخدم:**
- ألوان زاهية غير ضرورية
- shadows ثقيلة
- animations بطيئة
- gradients معقدة
- icons كبيرة جداً

**استخدم دائماً:**
- مساحات بيضاء كافية
- حدود خفيفة `border-gray-100`
- ألوان neutral للخلفيات
- اللون الأخضر البترولي للعناصر التفاعلية الرئيسية فقط
