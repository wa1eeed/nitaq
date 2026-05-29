# Changelog — نيطاق

تتبع هذا الملف لكل التغييرات الجوهرية على المنصة وفق نمط [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) و[Semantic Versioning](https://semver.org/).

---

## [Unreleased] — قيد التطوير

### ✅ v0.9.18 — Platform Completion: Reviews, Finance API, Audit Logs, Password Reset (2026-05-29)

**سياق:** استكمال ربط الوظائف الجوهرية التي كانت تعمل بـ mock data فقط. الهدف: كل صفحة رئيسية تستهلك API حقيقي مع fallback تلقائي.

**Backend — وحدات جديدة:**
- `ReviewsModule` جديد: `POST /orders/:id/review` (تحقق من COMPLETED + منع الازدواجية)، `GET /orders/:id/reviews`، `GET /companies/:id/reviews` (مُقسَّم صفحات + متوسط التقييم)
- `GET /admin/audit-logs` — قائمة مُقسَّمة مع فلاتر `action`, `userId`, `resourceType`
- `GET /companies/:id/transactions` — كشف حساب الشركة مع `walletBalance`
- `POST /auth/forgot-password` — يُرسل OTP عبر OtpService
- `POST /auth/reset-password` — يتحقق من OTP، يُحدّث كلمة المرور، يُلغي جميع refresh tokens

**Frontend — بورتال العميل:**
- صفحة تفاصيل الطلب: بطاقة "قيّم المزوّد" (نجوم 1-5 + تعليق اختياري) تظهر بعد COMPLETED — تُرسل إلى `POST /orders/:id/review`
- صفحة الشؤون المالية: ربط بـ `GET /companies/:id/transactions` مع normalizer (`type→kind`, `balance→balanceAfter`, `createdAt→at`)
- صفحة تسجيل الدخول: إضافة رابط "نسيت كلمة المرور؟"
- صفحة جديدة `/forgot-password`: خطوتان (رقم الجوال → OTP + كلمة مرور جديدة)

**Frontend — بورتال المزوّد:**
- صفحة تفاصيل الطلب: بطاقة تقييم العميل بعد COMPLETED (نفس منطق العميل)
- صفحة الشؤون المالية: ربط بـ `GET /companies/:id/transactions` مع mock fallback
- صفحة المستندات: إعادة كتابة كاملة — تجلب `GET /companies/:id/kyc`، dialog رفع مستند جديد (نوع + URL → `POST /companies/:id/kyc`)
- تسجيل الدخول: رابط "نسيت كلمة المرور؟" + صفحة `/forgot-password`

**Frontend — بورتال الإدارة:**
- صفحة سجل التدقيق: ربط بـ `GET /admin/audit-logs` مع normalizer (`resourceType→category`, `user.role→actor`) + mock fallback
- تسجيل الدخول: رابط "نسيت كلمة المرور؟" + صفحة `/forgot-password`

**صفر أخطاء TypeScript** عبر جميع البورتالات الثلاثة بعد التعديلات.

---

### ✅ v0.9.17 — B2B UI Cleanup: Service Catalog + Portal Redesign (2026-05-26)

**سياق:** استكمال التحويل البصري الكامل من منصة لوجستيات إلى منصة خدمات B2B. جميع التغييرات UI/UX فقط — لا تعديل على business logic أو API.

**إعادة هيكلة المجلدات:**
- `apps/web/carrier` → `apps/web/provider` (إعادة تسمية المجلد)
- Dockerfile paths محدَّثة للمسار الجديد

**صفحة الموظفين (Provider Portal):**
- حذف صفحة السائقين، استبدالها بصفحة إدارة الموظفين (`/fleet/employees`)
- قائمة الموظفين، تفاصيل، إسناد مهام

**Landing Page — إعادة كتابة للـ B2B:**
- نصوص Hero/Features/Testimonials/Pricing محوَّلة كلياً من لوجستيات → خدمات B2B
- CTA: "ابدأ الشحن" → "ابدأ الآن"، "ناقل" → "مزوّد الخدمة"

**إصلاح الهوية البصرية (naqla → nitaq):**
- جميع ملفات الـ UI عبر البورتالات الأربعة: @naqla.sa → @nitaq.sa
- DEV_USERS في shared-utils: emails + roles (CARRIER_ADMIN→PROVIDER_ADMIN)
- seed.ts: شركات وبيانات تجريبية بهوية nitaq

**كتالوج الخدمات B2B:**
- `DEFAULT_SERVICE_TYPES` (10 أنواع): استشارات، تصميم، تركيب، صيانة، دعم تقني، تدريب، خدمات تقنية، لوجستيات، إدارة مشاريع، أخرى
- `DEFAULT_TRUCK_TYPES` محتفظ بها كـ deprecated alias للتوافق

**Provider Fleet Pages — إعادة كتابة كاملة:**
- قائمة الخدمات: بطاقات بأيقونات B2B، حالة الخدمة (متاح/مشغول)
- نموذج إضافة خدمة: name, serviceType, description, basePrice, coveredCities, maxConcurrentOrders, photos
- تفاصيل الخدمة: نوع الخدمة، وصف، سعر، "سجل المهام"

**Admin Settings — لوحة أنواع الخدمات:**
- عنوان "أنواع الخدمات"، أيقونات B2B، حذف حقل capacityKg
- حذف تبويب "البراندات والموديلات" بالكامل (BrandsPanel + BrandDetailPanel)

**إصلاح بيانات الدخول:**
- Admin: admin@nitaq.sa / Admin@1234
- Client: client@nitaq.sa / Client@1234
- Provider: provider@nitaq.sa / Carrier@1234

**إزالة الخريطة والتتبع الجغرافي (Client & Provider):**
- `orders/new/page.tsx` (client): حذف MapAddressPicker + RouteMapsBlock، استبدال حقلَي "من/إلى" بـ "موقع تنفيذ الخدمة" اختياري، حذف حقل الوزن، إعادة تسمية الخطوات (الشحنة→الخدمة / المسار→التوقيت)
- `orders/[id]/page.tsx` (client): حذف MapSection/RouteMap، حذف بطاقة المسار، تغيير "تفاصيل الشحنة"→"تفاصيل الطلب"، حذف صفوف الوزن/التبريد، استبدال SaudiPlate بعرض نوع الخدمة، السائق→الموظف
- `orders/page.tsx` (provider): تبويب "في الطريق"→"قيد التنفيذ"
- `orders/[id]/page.tsx` (provider): حذف MapSection/RouteMap، حذف بطاقة المسار، تغيير نصوص حالة التنفيذ، تحديث dialogs الإجراءات

---

### ✅ v0.9.16 — Platform Identity Transformation: Trucks → Services (2026-05-26)

**سياق:** نِطاق مشروع مستقل منسوخ من nqlah. هذا الإصدار يُكمل التحويل الرسمي من منصة نقل بضائع إلى منصة خدمات B2B متعددة التخصصات عبر 9 مراحل.

**المرحلة ١ — حذف تطبيق السائق:**
- حذف `apps/driver` بالكامل (سيُعاد بناؤه لاحقاً كـ Employee App)
- تغيير اللغة الافتراضية من `ar` إلى `en` في جميع البورتالات

**المرحلة ٢ — تحديث ملفات التوثيق:**
- `README.md`, `GETTING_STARTED.md`, `PENDING_WORK.md`, `CLAUDE_CODE_INSTRUCTIONS.md`
- `docs/ARCHITECTURE.md`, `docs/API.md`: مصطلحات carrier/truck/driver → provider/service/employee

**المرحلة ٣ — ملفات الترجمة (72 ملف):**
- fleet.json, carrier.json, admin.json, landing.json, orders.json, auth.json, settings.json, client.json, notifications.json
- جميع البورتالات الأربعة × لغتين (en/ar) — مصطلحات شاملة

**المرحلة ٤ — الحزم المشتركة:**
- `shared-types`: `TruckType` → `ServiceType`, `DriverStatus` → `EmployeeStatus`, `Truck` → `Service`, `Driver` → `Employee`
- `shared-types/entities`: `carrierId` → `providerId`, `carrierAmount` → `providerAmount` في الواجهات
- `shared-types/socket`: `DRIVER_LOCATION` → `EMPLOYEE_LOCATION`, payload fields updated
- `shared-utils/labels`: `truckTypeLabels` → `serviceTypeLabels`, `cargoTypeLabels` → `serviceCategoryLabels`
- `shared-utils/workflow-engine`: `CARRIER` actor → `PROVIDER`, `Audience` carrier → provider، قوالب الإشعارات
- `shared-utils/api-adapters`: `normalizeTruck` → `normalizeService`، mapping ثنائي carrier↔provider

**المرحلة ٥ — بورتال Carrier (carrier portal):**
- `normalizeTruckList/normalizeTruck` → `normalizeServiceList/normalizeService`
- `order.carrierAmount` → `order.providerAmount` في pages/reports/earnings
- `breakdown.carrierAmount` → `breakdown.providerAmount` (escrow countdown)
- `bid.carrierId ?? providerId` pattern لتوافق API

**المرحلة ٦ — بورتال Admin:**
- `CarrierInfoCard` removed, variables: `carrier` → `provider`, `trucks` → `services`
- `ApiDriver` → `ApiEmployee`, `persistTruckTypes` → `persistServiceTypes`

**المرحلة ٧ — بورتال Client:**
- `CarrierInfoCard` → `ProviderInfoCard`, `ApiCarrier` → `ApiProvider`
- `assignedTruck` → `assignedService`, `driver/driverInitials` → `employee/employeeInitials`
- Bid display: `embeddedCarrier/fallbackCarrier` → `embeddedProvider/fallbackProvider`

**المرحلة ٨ — Landing Page:**
- Brand: نقلة لوجيستك → نِطاق، Truck icon → Briefcase
- جميع النصوص: ناقلين → مقدّمي الخدمة، شحنات → طلبات
- Provider card، Pricing، CTA، About page كلها مُحدَّثة

**المرحلة ٩ — API (comments/error messages):**
- رسائل الخطأ بالعربية: الشاحنة/السائق/الناقل → الخدمة/الموظف/مزود الخدمة
- تعليقات الكود في fleet/orders/bids/payments services

**المرحلة ١٠ — Prisma Schema Migration (DB rename):**
- Migration SQL يعتمد `ALTER TYPE/TABLE RENAME` — لا حذف للبيانات
- Enums: `TruckType→ServiceType`، `DriverStatus→EmployeeStatus`، `ON_TRIP→ON_ASSIGNMENT`
- Enum values: `CompanyType.CARRIER→PROVIDER`، `UserRole.CARRIER_ADMIN→PROVIDER_ADMIN`، `UserRole.CARRIER_USER→PROVIDER_USER`، `UserRole.DRIVER→EMPLOYEE`
- Notification types: `SHIPMENT_STARTED→SERVICE_STARTED`، `SHIPMENT_DELIVERED→SERVICE_COMPLETED`
- Models: `Truck→Service`، `DriverProfile→EmployeeProfile`، `OrderTruck→OrderService`، `OrderDriver→OrderEmployee`
- Fields: `carrierId→providerId`، `carrierAmount→providerAmount`، `requiredTruckType→requiredServiceType`، `targetCarrierId→targetProviderId`، `driverId→employeeId`، `totalTrips→totalAssignments`، `currentDriverId→currentEmployeeId`
- جميع ملفات API محدَّثة (15 ملف) — صفر أخطاء TypeScript بعد `prisma generate`
- `shared-types/enums.ts`: قيم جديدة + deprecated aliases للتوافق مع الـ tokens الموجودة
- DTOs: `requiredServiceType`، `targetProviderId`، `providerId`، `employeeId`، `AssignEmployeeDto`

---

### 🚀 v0.9.15 — Landing Page Premium Redesign + Reports Tab Rename (2026-05-25)

**Landing Page (`apps/web/landing`) — إعادة كتابة كاملة:**
- تحويل من Server Component ثابت إلى `'use client'` تفاعلي كامل مع framer-motion
- **Hero**: خلفية gradient ديناميكية + بلوبات خضراء متحركة (motion.div animate) + dot grid + heading بتدرج لوني + خط تأكيد متحرك + CTA بـ glow on hover + floating dashboard mockup مع progress bars متحركة + شارتان طافيتان (AnimatePresence)
- **Navbar**: glassmorphism sticky (`backdrop-blur-xl`) + hamburger menu مع `AnimatePresence` slide-down على الجوال
- **Stats**: `StatCard` مكوّن منفصل — عداد رقمي `useCounter` يبدأ عند دخول العنصر الشاشة (`useInView once`)
- **Features**: `FeatureCard` مكوّن — `whileInView` stagger entrance + `whileHover` lift + icon `whileHover` rotate
- **كيف نعمل**: `StepCard` مع خط رابط متحرك بين الخطوات (`scaleX` animation)
- **Audiences**: بطاقتان بانتقال من الجانبين + provider card بـ gradient تيل
- **Testimonials**: `TestimonialsSection` — auto-slider كل 4.5 ثانية + dot indicators قابلة للنقر
- **Pricing**: 3 بطاقات، الوسطى بـ gradient + `whileHover` glow + scale
- **CTA**: shimmer overlay متحرك مستمر (`animate: x ['-100%', '200%']`)
- جميع العناصر responsive كاملاً (mobile-first، `sm:` breakpoints)

**Admin Reports — إعادة تسمية التبويب:**
- تبويب "المستثمرون" ← **"الملخص الاستراتيجي"** (محتواه: LTV + Cohort Retention + Network Effect + ملخص تنفيذي تلقائي)

---

### 🚀 v0.9.14 — Executive KPI Dashboard + Analytics API (2026-05-25)

**Backend — Admin Analytics API (6 endpoints جديدة):**
- `GET /admin/analytics/marketplace`: GMV، عدد الطلبات، متوسط قيمة الطلب، معدل إتمام الطلبات، حصة أعلى 5 شركات، trend يومي
- `GET /admin/analytics/financial`: إجمالي الإيرادات، صافي الإيرادات، هامش الربح، Take Rate، GMV مقارنةً بالفترة السابقة، توزيع المحافظ
- `GET /admin/analytics/operational`: معدل التسليم في الوقت المحدد (OTD)، متوسط وقت الرد على العروض، معدل قبول العروض، معدل النزاعات، نشاط KYC
- `GET /admin/analytics/growth`: GMV MoM، نمو الشركات الجديدة، معدل Retention للعملاء (Cohort)، معدل التكرار، معدل المشاركة
- `GET /admin/analytics/investor`: Network Effect Score، Supply Liquidity، نشاط المنصة، نسب مقارنة بين الفترات
- `GET /admin/analytics/summary`: ملخص تنفيذي يجمع جميع KPIs في استجابة واحدة

**Frontend — Admin Reports Page (`apps/web/admin`):**
- إعادة كتابة كاملة لـ `reports/page.tsx` بثيم Bloomberg Terminal (dark: #0F172A base, #1E293B cards)
- 5 تبويبات متحركة: السوق / المالية / التشغيل / النمو / الملخص الاستراتيجي
- `KpiCard` مع sparkline chart مصغر (mini LineChart) ومؤشر تغيير (↑↓)
- مخططات recharts: LineChart اتجاه يومي، BarChart توزيع إيرادات، PieChart حصص المحافظ
- `AnimatePresence mode="wait"` لانتقالات التبويبات + `layoutId="tab-indicator"` للمؤشر المتحرك
- Auto-refresh كل 5 دقائق (`refreshInterval: 300_000`)
- `Skel` — skeleton loaders بنمط dark مع نبض opacity

**PDF Export (Client-side):**
- `exportPDF(summary, period)` — تصدير 4 صفحات بدون خادم (jspdf + jspdf-autotable dynamic import)
- صفحة غلاف مع اسم المنصة + التاريخ + الفترة الزمنية
- جدول ملخص تنفيذي، جدول KPIs السوقية، جدول النمو والمستثمرين
- اسم الملف: `nitaq-report-{period}-{YYYY-MM-DD}.pdf`

---

### 🚀 v0.9.13 — Premium UI/UX Overhaul · Web Portals + Driver App (2026-05-25)

**Web Portals — Client & Provider (framer-motion v12):**

Design System:
- `globals.css`: متغيرات CSS جديدة — `--gradient-primary/mint/gold`، `--shadow-card/hover/primary`، `--radius: 1rem`، typography utilities (`.text-h1/h2/h3/body/caption`)
- `card.tsx`: variant `elevated` + ظلال محسّنة
- `button.tsx`: تدرجات لونية، `active:scale-[0.98]`، variant جديد `success`
- `badge.tsx`: `pulse` prop — نقطة متحركة للحالات النشطة

Components:
- `stats-card.tsx`: `AnimatedCounter` (0→value)، `motion.div` مع `whileInView` + `whileHover`، شريط تدرج ملوّن علوي
- `status-badge.tsx`: الحالات النشطة تحصل على `pulse={true}` تلقائياً
- `page-header.tsx`: حركة دخول + خط تدرج تحت العنوان
- `page-transition.tsx` (جديد): `PageTransition` + `FadeItem` — stagger container مشترك
- `skeleton-table.tsx` (جديد): صفوف جدول متحركة لحالة التحميل
- `empty-state.tsx` (جديد): EmptyState موحّد مع أيقونة + رسالة + CTA اختياري

Pages:
- `app/(app)/page.tsx` (dashboard): Hero gradient + SVG wave، Quick Actions 4-tile grid، Activity Feed timeline بخط زمني رأسي
- `app/login/page.tsx`: split-layout — لوحة branding يسارية مع framer-motion bullets + نموذج الدخول يميناً (mobile-responsive)
- `app/(app)/orders/page.tsx`: skeleton loading rows بدل spinner، `EmptyState` عند قائمة فارغة، `PageTransition`
- `app/(app)/invoices/page.tsx` + `finance/page.tsx` + `earnings/page.tsx` + `bids/page.tsx`: `PageTransition`

Sidebar:
- `app-sidebar.tsx`: `motion.div layoutId="sidebar-active"` — مؤشر نشط متحرك spring بين عناصر الـ nav

---

**Design System:**
- `constants/theme.ts`: إعادة كتابة كاملة — dark mode (#0F172A base), GRADIENTS, FONT_SIZE scale, SPACING scale, SHADOW variants (sm/md/lg/primary), STATUS_COLOR map

**New UI Components (`components/ui/`):**
- `ActionButton.tsx`: زر متعدد المتغيرات (primary/success/danger/outline/ghost) مع LinearGradient + Haptics + Ionicons icon
- `GradientCard.tsx`: بطاقة مع دخول MotiView + LinearGradient قابل للتخصيص
- `OrderProgressBar.tsx`: شريط تقدم 4 خطوات (ASSIGNED→CONFIRMED→IN_TRANSIT→DELIVERED) مع حلقة نبض على الخطوة النشطة
- `AnimatedStatusBadge.tsx`: شارة حالة مع حلقة نبض للحالات النشطة
- `SkeletonLoader.tsx`: SkeletonLine / SkeletonCard / SkeletonOrderList مع تحريك opacity
- `Toast.tsx` + `useToast()`: إشعارات داخل الشاشة مع دخول spring

**New Sheet Components (`components/sheets/`):**
- `BidBottomSheet.tsx`: ورقة تقديم العرض مع Slider (50% → 150% من السعر)، عمولة المنصة 5%، صافي متوقع
- `ConfirmSheet.tsx`: ورقة تأكيد عامة مع أيقونة + عنوان + وصف + زرا تأكيد/إلغاء

**Screen Rewrites:**
- `app/(auth)/login.tsx`: شاشة دخول مُحسّنة — logo bubble، حقل جوال مع شارة 🇸🇦+966، shake animation عند الخطأ، stagger entrance
- `app/(driver)/index.tsx`: خريطة MapView كاملة الشاشة (40%) مع markers مخصصة، بطاقة طلب نشط مع OrderProgressBar، empty state متحرك
- `app/(driver)/order/[id].tsx`: خريطة مع Polyline مسار، بطاقة تفاصيل متحركة، سجل تتبع، أزرار تنقل/تسليم
- `app/(provider)/index.tsx`: dashboard نشط مع ActiveOrderCard، stats row، pull-to-refresh، skeleton loading
- `app/(provider)/opportunities.tsx`: FlashList مع OpportunityCard gradient، filter chips، BidBottomSheet
- `app/(provider)/wallet.tsx`: FlashList للمعاملات، LinearGradient balance card، TransactionRow ملوّن
- `app/(provider)/profile.tsx` + `app/(employee)/profile.tsx`: avatar ring gradient، stats row، settings list مع SettingsRow
- `app/_layout.tsx`: إضافة GestureHandlerRootView (مطلوب لـ BottomSheet)، StatusBar light
- `app/(employee)/_layout.tsx` + `app/(provider)/_layout.tsx`: tab bar داكن مع Ionicons icons، ألوان نشط/غير نشط

---

### 🚀 v0.9.12 — Employee Visibility in Admin (2026-05-24)

**1. تفاصيل الطلب في الأدمن — Card "الموظف المُكلَّف":**
- `apps/web/admin/src/app/(app)/orders/[id]/page.tsx`: أُضيفت Card جديدة في sidebar تعرض اسم الموظف + جواله + تاريخ الإسناد + حالته الحالية (في مهمة / متاح)؛ إذا لا يوجد موظف: "لم يُسند موظف بعد"
- `apps/api/src/modules/orders/orders.service.ts` — `findById()`: أُضيف `orderEmployees` include مع بيانات الموظف والمستخدم

**2. صفحة الموظفين في الأدمن — ربط API حقيقي + عمود الطلب الحالي:**
- `apps/web/admin/src/app/(app)/employees/page.tsx`: مُعاد كتابتها لتجلب `GET /admin/employees` بدل `EMPLOYEES` mock
- أُضيف عمود "الطلب الحالي" لكل موظف (orderNumber + مسار + حالة) — link ينقل للطلب
- `apps/api/src/modules/admin/admin.service.ts`: `listEmployees()` — يُعيد كل الموظفين مع `user`, `company`, وآخر `orderEmployees` نشط
- `apps/api/src/modules/admin/admin.controller.ts`: `GET /admin/employees`

**3. Dashboard — إحصائية "موظفون نشطون الآن":**
- `apps/web/admin/src/app/(app)/page.tsx`: StatsCard خامسة + grid تحوّل لـ `xl:grid-cols-5`
- `apps/api/src/modules/admin/admin.service.ts` — `dashboardStats()`: أُضيف `activeEmployees` (count بحالة ON_ASSIGNMENT)
- Dashboard يدعم الآن الشكل الجديد `{ orders: { today, week, month }, revenue: { gmv, commission }, ... }` مع backward compat

---

### 🚀 v0.9.11 — Provider Order Controls + Employee Assignment (2026-05-24)

**1. أزرار التحكم في الطلب (provider portal):**
- `apps/web/provider/src/app/(app)/orders/[id]/page.tsx`: أُضيف status=`ASSIGNED` لـ `showActions` (كان مفقوداً)
- ASSIGNED: زر "تأكيد البدء" → `POST /orders/:id/confirm` (ASSIGNED→CONFIRMED) + زر "إسناد لموظف"
- CONFIRMED: زر "بدأت التنفيذ" → `POST /orders/:id/tracking` (PICKED_UP) → يُحوّل الحالة إلى IN_TRANSIT عبر `addTrackingEvent`
- الديالوجز مُحدَّثة: `confirmStartOpen` للـ ASSIGNED، `startExecutionOpen` جديد للـ CONFIRMED

**2. Employee Assignment:**
- `apps/api/src/modules/services/services.service.ts`: `getAvailableEmployees()` — يُعيد موظفي الشركة بحالة AVAILABLE غير مُسنَدين لطلب نشط
- `apps/api/src/modules/services/services.controller.ts`: `GET /employees/available` (قبل `:id` route)
- `apps/api/src/modules/orders/dto/create-order.dto.ts`: أُضيف `AssignEmployeeDto { employeeId }`
- `apps/api/src/modules/orders/orders.service.ts`: `assignEmployee()` — يتحقق من الصلاحيات + ينشئ `OrderEmployee` + يُحوّل الموظف إلى `ON_ASSIGNMENT`
- `apps/api/src/modules/orders/orders.controller.ts`: `POST /orders/:id/assign-employee`
- **Auto status reset**: `complete()` يُعيد الموظفين المُسنَدين إلى `AVAILABLE` تلقائياً عند اكتمال الطلب
- **Employee assignment modal** في provider portal: يجلب الموظفين المتاحين عبر SWR، اختيار موظف محدد + تأكيد

---

### 🚀 v0.9.10 — Real Provider List in New Order Wizard (2026-05-24)

- `apps/web/client/src/app/(app)/orders/new/page.tsx`: استبدل `COMPANIES` mock بـ `GET /companies?type=PROVIDER&status=ACTIVE&limit=100` عبر SWR — مقدّمو الخدمات من قاعدة البيانات الحقيقية
- أُزيلت حقول `rating` / `serviceCount` / `responseTimeMins` من بطاقة مقدّم الخدمة (غير موجودة في API)
- أُضيف loading state ("جارٍ التحميل...") وempty state ("لا يوجد مقدّمو خدمات مطابقون")
- سطر review step يجلب اسم مقدّم الخدمة من `providersRaw` بدلاً من mock
- Saved Addresses: migration `20260521043732_add_saved_addresses_and_national_id` تأكّد أنها طُبّقت منذ v0.9.3 (كانت PENDING_WORK.md قديمة)

---

### 🚀 v0.9.9 — Demo Mode Removal + Auto Token Refresh + Dynamic Logo + Direct Price (2026-05-24)

**1. حذف "وضع تجريبي" من كل الواجهات:**
- `apps/web/admin/src/app/login/page.tsx`: حُذف الـ Badge + imports (Badge, ShieldCheck)
- `apps/web/client/src/app/login/page.tsx`: نفس الإزالة
- `apps/web/carrier/src/app/login/page.tsx`: نفس الإزالة
- `apps/web/admin/src/components/app-sidebar.tsx`: حُذف block "Demo Mode" من footer

**2. Auto Token Refresh في client و provider:**
- `apps/web/client/src/lib/api.ts`: على 401 — يحاول refresh أولاً (`nitaq_client_refresh`) قبل redirect للـ login؛ يُعيد الـ request الأصلي بالتوكن الجديد تلقائياً
- `apps/web/provider/src/lib/api.ts`: نفس المنطق (`nitaq_provider_refresh`) — يطابق الـ admin الذي كان الوحيد يملك هذا السلوك

**3. الشعار الديناميكي — يتحكّم فيه الأدمن ويظهر في كل المنصات:**
- `apps/api/src/modules/settings/settings.controller.ts`: endpoint جديد عام `GET /settings/platform` يُعيد `logoUrl`, `nameAr`, `nameEn` من Settings table
- `apps/web/admin/src/components/settings/branding-panel.tsx`: عند حفظ URL الشعار أو اسم المنصة، يُرسل أيضاً `PUT /admin/settings` لحفظهما في DB (`platform.logoUrl`, `platform.nameAr`, `platform.nameEn`)
- `apps/web/client/src/components/app-sidebar.tsx`: يجلب `GET /settings/platform` عبر SWR، يعرض الشعار بـ `next/image` أو fallback Service icon
- `apps/web/provider/src/components/app-sidebar.tsx`: نفس المنطق

**4. Direct Assignment بسعر ثابت:**
- `apps/api/src/modules/orders/dto/create-order.dto.ts`: أُضيف `agreedPriceUpfront?: number`
- `apps/api/src/modules/orders/orders.service.ts` — `create()`: إذا DIRECT + `agreedPriceUpfront` → يُخزَّن `agreedPrice`, `commissionAmount` (8%), `providerAmount` في الـ order عند الإنشاء
- `apps/api/src/modules/orders/orders.service.ts` — `publish()`: إذا DIRECT + `agreedPrice` موجود + `targetProviderId` → يتجاوز PUBLISHED ويُسند مباشرة (`status: ASSIGNED`)
- `apps/web/client/src/app/(app)/orders/new/page.tsx`: Step 3 يعرض (بعد اختيار مقدّم الخدمة) toggle "هل لديك سعر متفق مسبقاً؟" [نعم / لا — تفاوض عادي] مع حقل إدخال السعر عند نعم

---

### 🚀 v0.9.8 — Docker Staging Fixes: All 5 Apps Deploy-Ready (2026-05-21)

سلسلة إصلاحات Docker بُنيت على staging الحقيقي (Coolify / nqlah.nx.sa). كل إصلاح نتج عن خطأ حقيقي في الـ build أو الـ runtime.

**API — Prisma Custom Output:**
- `apps/api/prisma/schema.prisma`: `output = "../src/generated/prisma"` بدلاً من المسار الافتراضي في pnpm store — يحل مشكلة symlinks بين الأجهزة
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` — Alpine Docker يحتاج musl binary
- 11 ملف: كل `@prisma/client` imports صارت `../../generated/prisma` (المسار المُولَّد الجديد)
- `apps/api/Dockerfile`: `RUN cp -r src/generated dist/src/` — الـ client المولَّد `.js+.d.ts` لا يُجمعه tsc تلقائياً

**API — Seed في Production:**
- `apps/api/prisma/seed.ts`: حذف `import 'dotenv/config'` (DATABASE_URL تأتي من Docker env)، وغيّر import من `@prisma/client` إلى `../src/generated/prisma`
- `apps/api/Dockerfile`: يجمّع `seed.ts` → `dist/prisma/seed.js` في builder (tsx devDependency — غير متاح في production)
- `apps/api/package.json` `db:seed`: صار `node dist/prisma/seed.js`

**Next.js — node_modules في builder:**
- كل Dockerfiles (admin/client/carrier/landing): أُضيف `COPY --from=deps /repo/apps/web/<app>/node_modules ./apps/web/<app>/node_modules` — بدونه `next` binary غير موجود في builder

**Next.js — date-fns resolution:**
- `apps/web/landing/next.config.mjs`: حُذف `@nitaq/shared-utils` من `transpilePackages` — كان يجعل webpack يعيد compile المصدر فيحاول resolve `date-fns` من root وليس من `shared-utils/node_modules`
- `packages/shared-utils/src/format.ts`: استُبدلت كل `date-fns` imports (`format`, `formatDistanceToNow`, locales) بـ `Intl.DateTimeFormat` و`Intl.RelativeTimeFormat` — لا dependencies خارجية بعد الآن
- `apps/web/landing/package.json`: أُضيف `date-fns: "^2.30.0"` كـ dependency مباشر (حل مؤقت قبل الإصلاح العميق)
- `apps/web/*/next.config.mjs` ×4: `webpack.resolve.modules` يُضيف `shared-utils/node_modules` للبحث

**All Next.js runners — wget للـ healthcheck:**
- `apps/web/*/Dockerfile` ×4: أُضيف `RUN apk add --no-cache wget` في runner stage — Alpine الافتراضي لا يحتوي wget وكان الـ healthcheck يفشل

**All Dockerfiles — workspace manifests:**
- كل Dockerfiles: يُنسخ جميع الـ 7 workspace manifests قبل `pnpm install` — بدونه `pnpm deploy` يفشل عند مواجهة packages لم يرَها install

**Infrastructure:**
- `.dockerignore`: أُضيف `apps/api/src/generated` — يمنع binary Darwin من إرسالها للـ build context (يُعاد توليدها بـ Linux binary داخل Alpine)
- `.gitignore`: أُضيف `apps/api/src/generated/` — الـ client مولَّد تلقائياً

**النتيجة:**
- ✅ `api.nqlah.nx.sa/health` → `{"status":"ok","database":"up"}`
- 🟡 landing/admin/client/carrier — قيد التحقق

---

### 🐳 v0.9.7 — Dockerfiles for All 5 Apps (2026-05-21)

**Dockerfiles جديدة/محدَّثة:**
- `apps/web/admin/Dockerfile` — multi-stage: deps → builder → runner (standalone, non-root, healthcheck)
- `apps/web/client/Dockerfile` — نفس البنية، port 3002
- `apps/web/provider/Dockerfile` — نفس البنية، port 3003
- `apps/web/landing/Dockerfile` — نفس البنية، port 3000 (بدون shared-types)
- `apps/api/Dockerfile` — أُضيف HEALTHCHECK على `/health` (كان غائباً)

**تغييرات مرافقة:**
- `apps/web/*/next.config.mjs` ×4: أُضيف `output: 'standalone'` — شرط Next.js Standalone mode
- `.dockerignore` أُنشئ: يستثني `node_modules`, `.next`, `dist`, `.env.*`, `.git` من build context
- `docs/DEPLOYMENT.md` Section 4: مكتمل بالكامل بجداول وأوامر البناء وتوضيح NEXT_PUBLIC build-args
- `README.md`: قسم Docker جديد بأوامر البناء السريع
- `GETTING_STARTED.md`: تعليمات Docker build مُضافة

**البنية المعتمدة:**
- 3 مراحل لكل Dockerfile: `deps` (install) → `builder` (compile) → `runner` (minimal image)
- `shared-utils` يُبنى في كل builder stage قبل التطبيق (CJS dist مطلوب)
- Non-root user `nextjs:nodejs` (uid/gid 1001) في كل runner
- Alpine base — صورة نهائية < 200MB لكل تطبيق

---

### 📖 v0.9.6 — Deployment Docs: Three Environments + DB Separation (2026-05-21)

**`docs/DEPLOYMENT.md`:**
- Section 1: جدول البيئات محدَّث — Staging يشير لـ Coolify VPS الفعلي (`nqlah.nx.sa`)
- Section 1.1: أُضيف جدول فصل قواعد البيانات (Development/Staging/Production — لكل بيئة host ومستخدم وDB منفصل)
- Section 1.2 → 1.3: جدول الفروقات موسَّع ليشمل `DATABASE_URL`, `REDIS_URL`, `APP_DOMAIN`, `MINIO_BUCKET`, روابط `FRONTEND_*`
- Section 1.4: checklist الـ deploy شامل الآن migrations (`prisma migrate deploy` لا `migrate dev`)
- Section 2.3: النطاقات محدَّثة من `naqla.sa` → `nqlah.nx.sa` مع ملاحظة تغيير الدومين عبر env فقط
- Section 3: مكتملة بالكامل — جداول بـ 27 متغيّر Backend + 6 متغيّر Frontend مقارَنة بين البيئات الثلاث
- Section 5: Coolify محدَّث بجداول البنية التحتية الفعلية (DB host، Redis host)، services، خطوات أوّل deploy

**`CLAUDE_CODE_INSTRUCTIONS.md`:**
- تصحيح الدومين: `naqla.nx.sa` → `nqlah.nx.sa`
- تحديث قسم متغيرات البيئة ليشمل `APP_DOMAIN`, `FRONTEND_*_URL`, `NEXT_PUBLIC_*` الجديدة مع توضيح فصل البيئات

---

### 🚀 v0.9.5 — Staging Environment File for Coolify (2026-05-21)

- أُنشئ `.env.staging` بقيم Coolify الحقيقية (DB + Redis + MinIO + JWT عشوائي).
- `JWT_SECRET` + `JWT_REFRESH_SECRET` مولَّدان بـ `openssl rand -hex 64` — غير مكررَّين بين البيئات.
- الملف محمي بـ `.gitignore` ولا يُرفع على GitHub مطلقاً.
- أُضيف `MINIO_PUBLIC_URL` + `BCRYPT_ROUNDS` + `THROTTLE_*` + `APP_NAME` (متغيرات ضرورية غاب ذكرها).

---

### 🔧 v0.9.4 — Domain-Agnostic: Replace All Hardcoded URLs with Env Vars (2026-05-21)

**المشكلة:** عدة مواضع في الكود تحتوي على `naqla.sa` أو `localhost:300x` hardcoded — تمنع التشغيل على أي دومين آخر.

**الإصلاحات:**

- `apps/api/src/main.ts`: `PROD_HOSTS` يقرأ من `APP_DOMAIN` بدل `['naqla.sa']` الثابت. CSP `connect-src` يستخدم نفس المتغير.
- `apps/api/src/modules/companies/team-members.service.ts`: رابط تفعيل الدعوة يستخدم `FRONTEND_CLIENT_URL` بدل `https://app.naqla.sa`.
- `apps/api/src/modules/auth/auth.service.ts`: fallback email يستخدم `APP_DOMAIN` بدل `phone.naqla.sa`.
- `apps/web/landing/[locale]/page.tsx`: 6 روابط `localhost:3002` → `NEXT_PUBLIC_CLIENT_URL`، 4 روابط `localhost:3003` → `NEXT_PUBLIC_CARRIER_URL`.
- `apps/web/landing/[locale]/about/page.tsx`: رابطا CTA يستخدمان `NEXT_PUBLIC_CLIENT_URL` / `NEXT_PUBLIC_CARRIER_URL`.
- `apps/web/client/register/page.tsx` + `apps/web/carrier/register/page.tsx`: 3 روابط الشروط/الخصوصية/النقل تستخدم `NEXT_PUBLIC_LANDING_URL`.
- `.env.staging.example` + `.env.development.example`: أُضيفت متغيرات `APP_DOMAIN`, `FRONTEND_CLIENT_URL`, `FRONTEND_CARRIER_URL`, `FRONTEND_ADMIN_URL`, `NEXT_PUBLIC_LANDING_URL`, `NEXT_PUBLIC_CLIENT_URL`, `NEXT_PUBLIC_CARRIER_URL` مع قيم افتراضية لكل بيئة.

**الدومين الحالي للـ Staging:** `nqlah.nx.sa`

**All 4 packages type-check clean.**

---

### ✨ v0.9.3 — Full Wiring Session: Catalogs + Uploads + Contact Info (2026-05-21)

**Dynamic Catalogs:**
- `GET /settings/catalogs` — new public endpoint (no auth) reads cities/cargoTypes/serviceTypes from Settings table; falls back to nulls so frontend uses static defaults until admin seeds data.
- Admin settings → CitiesPanel, CargoTypesPanel, ServiceTypesPanel: every mutation (add/edit/delete/toggle/reset) now auto-persists to DB via `PUT /admin/settings` with JSON-encoded catalog under keys `catalog.cities`, `catalog.cargo_types`, `catalog.service_types`.
- Admin settings page: on load, initializes all three Zustand stores from DB data so changes survive server deploys.
- Client wizard (`orders/new`): cities and service types now fetched via `useSWR('/settings/catalogs')` with static fallback — wizard remains functional when endpoint returns null (no data seeded yet).

**Service Photo Upload:**
- Provider services → Add Service form: photos are now uploaded via presigned URL flow before POSTing the service record; resulting URLs sent as `photos: string[]` in the service payload.

**Contact Info After Bid Acceptance:**
- Client order detail → ProviderInfoCard: provider data now read from API response (`order.provider`) instead of mock `companyById`. Phone number shown inline; اتصال button links to `tel:contactPhone`; إيميل button links to `mailto:contactEmail`.
- Accepted bid read from `order.bids` (API) with mock BIDS as fallback.

**Bug Fixes:**
- `client/settings` + `carrier/settings`: fixed `AxiosResponse` destructuring — added `.data` to presign result access (TS2339).
- `client/orders/[id]`: fixed `DirectProposalView` type errors — `proposal` optional chaining on all status accesses; removed non-existent `ProposalRound.bidId`.
- `api/prisma/schema.prisma`: added `nationalId String?` to User model (needed by `fleet/drivers/invite` endpoint added in v0.9.2).
- Ran `prisma generate` to regenerate client with `SavedAddress` model + `nationalId` field → API TypeScript clean.

**New files:**
- `apps/api/src/modules/settings/settings.controller.ts`
- `apps/api/src/modules/settings/settings.module.ts`

**All 4 packages type-check clean** (`@nitaq/api`, `@nitaq/admin`, `@nitaq/client`, `@nitaq/provider`).

---

### 🐛 v0.9.2 — ServiceType enum + Hooks order fix (2026-05-17)

**Bugs reported بعد v0.9.1:**
- `POST /api/services` يرجع `type must be one of the following values` — لم يمكن إضافة خدمة جديدة.
- صفحة تفاصيل الخدمة تكسر بـ `Rendered more hooks than during the previous render`.

**الأسباب الجوهرية:**

1. **Enum mismatch بين الـ catalog والـ Prisma**: الـ catalog (`DEFAULT_SERVICE_TYPES` في shared-utils) يستخدم IDs مثل `CONSULTING` و `MAINTENANCE` بينما Prisma `ServiceType` enum لم تكن تحتوي هذه القيم. الفورم يرسل القيمة من الـ catalog مباشرة → backend يرفض.
2. **Rules-of-Hooks violation**: في `services/[id]/page.tsx` كان `useServiceTypesStore(...)` بعد `if (!service) return`. أول render (serviceData=undefined) يأخذ الـ early-return path بدون استدعاء الـ hook، الـ render التالي (بعد ما SWR يحلّ) يمر للأسفل ويستدعي الـ hook → React يكتشف عدد hooks مختلف ويرمي.

**الإصلاحات:**

1. **ServiceType enum صار superset للـ catalog** في `apps/api/prisma/schema.prisma`:
   - أُضيفت كل القيم بحيث يقبل الـ backend أي قيمة من الفورم بدون mapping يدوي.
   - النوع كلّه الآن: `CONSULTING | DESIGN | DEVELOPMENT | MAINTENANCE | CLEANING | SECURITY | CATERING | OTHER`.
   - الـ `CreateServiceDto.SERVICES` const في `services/dto/services.dto.ts` صار يطابق + comment يربطه بالـ Prisma.
2. **Hooks before early-return**: نقلت `useServiceTypesStore((s) => s.types)` فوق `if (!service) return` في `services/[id]/page.tsx` مع comment يحذّر من الـ ordering.

**ملفات معدّلة (3):**
- `apps/api/prisma/schema.prisma` (+ enum values)
- `apps/api/src/modules/services/dto/services.dto.ts` (محاذاة const مع enum)
- `apps/web/provider/src/app/(app)/services/[id]/page.tsx` (hooks order)

**التحقّق:**
- ✅ `prisma db push` — enum مزامن
- ✅ Type-check API + provider نظيف

---

### 🐛 v0.9.1 — Field-Shape Adapters + Provider UX Cleanup (2026-05-17)

تدقيق مشاكل أبلغ عنها المستخدم بعد v0.9.0:
- صفحة الطلب لدى مقدّم الخدمة لا تشبه تصميم العميل بعد القبول.
- صفحة الفرص لدى مقدّم الخدمة تعرض زر "قدّم عرضاً" على طلبات أُسندت بالفعل لنفس مقدّم الخدمة.
- جدول الخدمات لا يعرض البيانات + عداد الخدمات غير دقيق.
- صفحة تفاصيل خدمة تظهر "الخدمة غير موجودة" حتى عند فتحها من القائمة.
- صفحة الأرباح تعرض IDs خام و `NaN`.

**الأسباب الجوهرية: اختلاف أسماء حقول Prisma vs الـ mock**

| الميزة | حقل الـ Mock | حقل الـ API (Prisma) |
|---|---|---|
| Service | `serviceType` | `type` |
| Service | `capacityKg` | `capacity` |
| Service | `modelYear` | `year` |
| Service | `lastInspection` | (غير موجود) |
| Payment | `state` | `status` |
| Payment | `amount` | `totalAmount` |
| Payment | `commission` | `commissionAmount` |
| Payment | `vat` | (غير موجود → كان ينتج `NaN` في حساب الصافي) |

**الإصلاحات:**

1. **`normalizeService` + `normalizeServiceList`** في `shared-utils/src/api-adapters.ts`:
   - يضيف aliases للحقول المفقودة (`serviceType` ← `type`، `capacityKg` ← `capacity × 1000`، `modelYear` ← `year`).
   - يستخدم `<T extends object>` ليقبل النوع الصارم للـ mock بدون TS noise.
2. **`normalizePayment` + `normalizePaymentList`**:
   - aliases لـ `state/amount/commission`، يصفّر `vat` (الـ API لا يحفظه) → لا مزيد من `NaN`.
   - يحافظ على `providerAmount` الذي يحسبه الـ backend مسبقاً.
3. **`/payments` API** الآن يرجع `order.client.nameAr` + `order.provider.nameAr` مع كل دفعة — صفحة الأرباح تستعرض اسم العميل من العلاقة المضمّنة بدل البحث في mock بالـ cuid.
4. **Provider `/opportunities`** يستثني الطلبات المُسندة لنفس مقدّم الخدمة (`order.providerId === myCompanyId && status >= ASSIGNED`). الـ backend list يبعث ٣ buckets معاً، فالـ filter صار على الـ frontend. الـ sidebar count يطبّق نفس الشرط.
5. **`services/page.tsx`** يستخدم `normalizeServiceList` + الـ counts الحقيقية (`all.length` بدل `SERVICES.length` الثابت).
6. **`services/[id]/page.tsx`** الآن `useSWR('/services/:id')` + `normalizeService` بدل البحث في mock SERVICES — صفحة التفاصيل تشتغل مع cuid حقيقي من DB.
7. **Provider order detail `RequestStatusCard`** يقبل `events` + `titles` ويرسم timeline الـ tracking داخل البطاقة (يطابق `RequestProgressCard` لدى العميل). البطاقة المستقلّة "سجل الأحداث" تُخفى تلقائياً عند ظهور البطاقة الموحّدة.

**ملفات معدّلة (8):**
- `packages/shared-utils/src/api-adapters.ts` (+ 4 normalizers جديدة)
- `apps/api/src/modules/payments/payments.service.ts` (إضافة client/provider relations للـ list response)
- `apps/web/provider/src/app/(app)/opportunities/page.tsx` (filter assigned)
- `apps/web/provider/src/components/app-sidebar.tsx` (نفس الـ filter)
- `apps/web/provider/src/app/(app)/services/{page.tsx, [id]/page.tsx}` (normalizer + defensive accessors)
- `apps/web/provider/src/app/(app)/earnings/page.tsx` (normalizer + embedded client.nameAr)
- `apps/web/provider/src/app/(app)/orders/[id]/page.tsx` (RequestStatusCard مع tracking inline)

**التحقّق:**
- ✅ Type-check نظيف على 5 packages: api، admin، client، provider، landing
- ✅ كل الخوادم تستجيب: 3000(307)، 3001/2/3(200)، 4000(NestJS up)
- ✅ shared-utils dist أُعيد بناؤه

---

### 🔌 v0.9.0 — Full System Wiring (Audit → Wire → Toast → Verify) (2026-05-17)

تدقيق شامل لكل صفحة في الواجهات الثلاث + ربط كل وظيفة بالـ API الحقيقي + إضافة 2 modules backend جديدين (Disputes، Support) + بنية toast موحّدة + استبدال كل `alert()` بـ toast + إضافة spinners و mutate().

**ما تم استثناؤه عمداً (يحتاج integration خارجي بعد deploy):**
- SMS provider مفعّل (SMS_PROVIDER=console يكتب على terminal)
- Resend / إيميل (غير مفعّل)
- بوابة دفع (PAYMENT_PROVIDER=mock)
- رفع صور الشاحنة (يحتاج presigned URL flow في uploads module)
- Manual wallet transactions (لا يوجد endpoint مخصّص — `notify.info` بدلاً من `alert()` لإعلام الأدمن)

#### الـ Backend — 2 modules جديدين + schema غيرين

**1. Disputes module** — `apps/api/src/modules/disputes/`
- `POST /api/disputes` — كل من العميل والناقل يقدر يفتح نزاع على طلب يكون طرف فيه. منع تكرار (`@@unique orderId`). يشترط `status` متقدّم (ASSIGNED+).
- `GET /api/disputes` — يرجع نزاعات scope على شركة المُتصِل.
- `GET /api/disputes/:id` — بنفس التحقّق.
- (الأدمن لا يزال يستخدم `/admin/disputes` للقائمة الكاملة + `PUT /admin/disputes/:id` للحل).

**2. Support Tickets module** — `apps/api/src/modules/support/`
- نموذج `SupportTicket` جديد في Prisma + enums `SupportTicketStatus` + `SupportTicketCategory`.
- `POST /api/support/tickets` — أي مستخدم.
- `GET /api/support/tickets` — يرجع تذاكر المُتصِل (admins يرون كل شيء).
- `PUT /api/support/tickets/:id` — Admin فقط: تحديث status/assignedTo/resolution.

#### الـ Frontend — wiring shared toast infrastructure

**Toast library**: ركّبت `sonner@1.4.41` على الثلاث portals + `<Toaster />` في كل root layout (RTL-aware). أضفت `lib/notify.ts` بـ helpers: `notify.success`, `notify.error`, `notify.info`, `notify.promise` — كل الصفحات تستخدمها بدل `alert()`.

#### الواجهات — كل alert() صار toast + كل form صار يستدعي API

**Admin (4 صفحات wired جديد):**
- `kyc/page.tsx` — approve/reject → `PUT /admin/companies/:id/status` (ACTIVE/REJECTED) + SWR live list + spinner + toasts
- `disputes/[id]/page.tsx` — assign + resolve → `PUT /admin/disputes/:id` + SWR mutate + spinners + toasts
- `wallets/[id]/page.tsx` — alert استبدل بـ `notify.info` صريح (لا endpoint للمعاملات اليدوية)
- `payments/page.tsx` — زر "إفراج" → `POST /payments/:id/release` + mutate + spinner + toasts

**Provider (5 صفحات wired جديد):**
- `services/new/page.tsx` — submit → `POST /services` بـ serviceCode compound + spinner + toasts
- `orders/[id]/page.tsx` — update location → `POST /orders/:id/tracking` + toast
- `opportunities/[id]/page.tsx` — DIRECT negotiation ACCEPT/COUNTER → `POST /orders/:id/bids` (DECLINE: notify.info لأنه لا backend)
- `disputes/page.tsx` — open dispute → `POST /disputes` + SWR mutate + spinner + toast (provider)
- `support/page.tsx` — create ticket → `POST /support/tickets` + SWR mutate + spinner + toast (provider)
- `notifications/page.tsx` — قائمة + mark-read mutations (provider)

**Client (3 صفحات wired جديد):**
- `disputes/page.tsx` — open dispute → `POST /disputes` + SWR mutate + spinner + toast
- `support/page.tsx` — create ticket → `POST /support/tickets` + SWR mutate + spinner + toast
- `notifications/page.tsx` — قائمة + mark-read mutations

#### الأنماط الموحّدة المطبّقة كل مكان

كل form mutation الآن:
- 🔄 `submitting` state يعطّل الزر ويعرض `<Loader2 className="animate-spin" />`
- 🟢 `notify.success(...)` بعد النجاح
- 🔴 `notify.error(err, fallback)` يستخرج رسالة الـ backend العربية تلقائياً
- 🔁 `mutate()` على الـ SWR cache بعد كل mutation — البيانات تتحدّث فوراً

كل قائمة الآن:
- ✅ `useSWR` كمصدر أول
- 🔁 Mock fallback عند عدم توفّر API (للـ demo بدون docker)

**ملفات معدّلة (22):**

Backend (8):
- `apps/api/prisma/schema.prisma` (+ SupportTicket model + 2 enums + Company relation)
- `apps/api/src/modules/disputes/{controller,service,module}.ts` (جديد)
- `apps/api/src/modules/support/{controller,service,module}.ts` (جديد)
- `apps/api/src/app.module.ts` (تسجيل المودولين)

Frontend (14):
- `apps/web/{admin,client,provider}/src/app/layout.tsx` — Toaster mounted
- `apps/web/{admin,client,provider}/src/lib/notify.ts` (جديد)
- `apps/web/admin/src/app/(app)/{kyc,disputes/[id],wallets/[id],payments,notifications}/page.tsx`
- `apps/web/client/src/app/(app)/{disputes,support,notifications}/page.tsx`
- `apps/web/provider/src/app/(app)/{services/new,orders/[id],opportunities/[id],disputes,support,notifications}/page.tsx`

**التحقّق:**
- ✅ `prisma db push` — Bid + SupportTicket synced
- ✅ Type-check نظيف على 5 packages: api, admin, client, provider, landing
- ✅ `pnpm check:i18n` — 11 files × 2 locales × 646 keys
- ✅ كل الخوادم تستجيب: 3000(307)، 3001/3002/3003(200)، 4000(NestJS up)

**Migration note للـ DB المنتجة:** schema changes idempotent (إضافة model SupportTicket + 2 enums). الـ `prisma db push` كافي للـ dev؛ في production نستخدم `prisma migrate`.

**ما تبقّى deferred (out of scope لهذا الـ pass):**
- 🟡 Client saved addresses (يحتاج model + endpoint جديدين)
- 🟡 Bid withdraw من واجهة الناقل (backend موجود `PUT /orders/:orderId/bids/:id`)
- 🟡 Dynamic catalogs (cities/cargo types) — حالياً hard-coded في wizard
- 🟡 DIRECT negotiation DECLINE — يحتاج endpoint مخصّص
- 🟡 Manual wallet transactions — يحتاج endpoint جديد

---

### 🎯 UX Hardening Pass — 6 concurrent fixes (2026-05-17)

أصلحنا 6 مشاكل تجربة مستخدم أبلغ عنها المستخدم في جلسة واحدة، تغطي عزل اللغة بين اللوحات، إصلاح الصوت، تكامل لوحة الأدمن، وضوح موعد التسليم المقترح، تبسيط نموذج العرض، وتفصيل صفحة الطلب بعد القبول.

**١. عزل اللغة بين اللوحات (Locale isolation)** 🌐
- **العَرَض**: تغيير اللغة في لوحة مقدّم الخدمة كان يغيّرها في لوحة العميل والأدمن.
- **السبب الجوهري**: كل اللوحات الثلاث كانت تستخدم cookie واحد بنفس الاسم (`nitaq-locale`) مع `path: '/'`. المتصفّحات تشارك الـ cookies بين البورتات على نفس الـ hostname.
- **الإصلاح**: cookie منفصل لكل لوحة: `nitaq-locale-admin` / `nitaq-locale-client` / `nitaq-locale-provider`.
- **الملفات**: `apps/web/{admin,client,provider}/src/i18n.ts:7`.

**٢. صوت الفرصة الجديدة لا يعمل عند كل دخول للصفحة** 🔔
- **العَرَض**: عند فتح `/opportunities` يصدر صوت "فرصة جديدة" حتى لو لم تكن هناك فرصة جديدة.
- **السبب الجوهري**: `useEffect` كان يشغّل الصوت على mount الأول إذا كان `opps.length > 0` بدلاً من اعتمادها على وصول إشعار جديد فعلاً.
- **الإصلاح**: حذفنا الـ effect بالكامل. الـ NotificationCenter (المركّب عالمياً في الـ topbar) عنده منطق صحيح بالفعل لتشغيل الصوت فقط عند زيادة `unreadCount`، وهو الـ SoT الآن.
- **الملف**: `apps/web/provider/src/app/(app)/opportunities/page.tsx`.

**٣. تكامل لوحة الأدمن مع تحديثات الطلب** 🛠️
- **العَرَض**: لوحة الأدمن لا تعكس تحديثات الطلب بنفس مستوى تفصيل العميل/الناقل، ولا تتحدّث تلقائياً.
- **الإصلاحات**:
  - SWR `revalidateOnFocus: true` + `refreshInterval: 15000` — الأدمن يشاهد تحوّلات الحالة بدون refresh يدوي.
  - `<AdminRequestStatus>` card تعكس نفس مؤشّر التقدّم (بدء → تنفيذ → إنجاز) بنفس مواعيد البدء والإنجاز المتفق عليها (مع التمييز إذا كان من عرض مقدّم الخدمة).
  - `<AdminEscrowSummary>` countdown 72 ساعة لما `status === 'DELIVERED'` — نفس المحرّك المستخدم في provider/العميل.
- **الملف**: `apps/web/admin/src/app/(app)/orders/[id]/page.tsx`.

**٤. وضوح موعد التسليم/الاستلام المقترح في صفحة العميل** 📅
- **العَرَض**: مقدّم الخدمة اقترح موعد بدء مختلف عن المحدّد من العميل، لكن العميل لا يراه واضحاً.
- **الإصلاحات**:
  - **Alert بارز** فوق صف العرض عند أي اختلاف: "موعد بدء آخر تم اقتراحه: X (بعد Y أيام من موعدك)" — وكذلك للإنجاز.
  - **زر "تفاصيل"** بجانب "قبول" يفتح `<Dialog>` فيها: بطاقة مقدّم الخدمة، السعر، صفّان للبدء والإنجاز مع badge "موعد بديل" + day-diff، ملاحظات مقدّم الخدمة، وثلاث أزرار في الـ footer: **قبول** / **رفض** / **إغلاق (X)**.
- **الملف**: `apps/web/client/src/app/(app)/orders/[id]/page.tsx`.

**٥. تبسيط نموذج العرض — `proposedDeliveryDate` بدل `days + hours`** 🧹
- **العَرَض**: حقول "المدة (أيام)" و"+ ساعات" مربكة وتلزم مقدّم الخدمة بحساب ذهني.
- **الإصلاح (Backend + Frontend متناسق)**:
  - Prisma `Bid.proposedDeliveryDate DateTime?` (الحقول القديمة `estimatedDays/Hours` باقية ك optional للـ back-compat، `estimatedDays` صار `@default(0)`).
  - DTO جديد يقبل `proposedDeliveryDate?: string` (estimatedDays صار optional).
  - `bids.service.create()` يمرّر القيمة الجديدة في الـ upsert (create + update).
  - واجهة مقدّم الخدمة: استبدلنا الـ grid (يومين + ساعات) بـ **حقل تاريخ واحد** (`<input type="date">`) مع `min` = موعد البدء، مع معاينة "الإنجاز: ...".
  - واجهة العميل: ETA card تستخدم `proposedDeliveryDate` كأول مصدر، fallback إلى `order.deliveryDate`، fallback إلى `estimateDeliveryDate(days, hours)` للعرض القديم.
  - الـ `Bid` interface في `shared-utils/src/mock-data.ts` أضافت `proposedDeliveryDate?: string`، وأُعيد بناء dist.
- **الملفات**: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/bids/{dto/bid.dto.ts, bids.service.ts}`, `apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx`, `apps/web/client/src/app/(app)/orders/[id]/page.tsx`, `packages/shared-utils/src/mock-data.ts`.

**٦. صفحة الطلب التفصيلية بعد القبول (Rich Assigned View)** 📋
- **العَرَض**: بعد قبول العميل للعرض، صفحة الطلب فقيرة في البيانات لدى كلا الطرفين.
- **الإصلاح**: مكوّن `<RequestProgressCard>` (في صفحة العميل) و`<RequestStatusCard>` (في صفحة مقدّم الخدمة) يظهر عند `status ∈ {ASSIGNED, CONFIRMED, IN_TRANSIT, DELIVERED, COMPLETED}`:
  - **Status header** مع helper text حسب الحالة.
  - **3-step progress** مرئي: البدء → التنفيذ → الإنجاز.
  - **بطاقتا التاريخ**: موعد البدء (effective من proposedPickupDate أو order.pickupDate) + موعد الإنجاز المتوقع (effective من proposedDeliveryDate أو order.deliveryDate)، مع badge "موعد بديل من مقدّم الخدمة" / "حسب عرضك" حسب من ينظر.
  - **سجل التتبّع** (في صفحة العميل) — events list ضمن الـ card نفسه.
  - صفحة العميل تحتفظ بـ `ProviderInfoCard` الموجود مسبقاً (مقدّم الخدمة + الخدمة + الموظف).
  - صفحة مقدّم الخدمة تحتفظ بـ execution actions + Escrow في الـ right rail.
- **الملفات**: `apps/web/client/src/app/(app)/orders/[id]/page.tsx`, `apps/web/provider/src/app/(app)/orders/[id]/page.tsx`.

**التحقّق:**
- ✅ `prisma db push` — Bid table يحتوي `proposedDeliveryDate timestamp` (تحقّقت بـ psql)
- ✅ Type-check نظيف على 4 packages: api, admin, client, provider
- ✅ كل الخوادم تستجيب: 3000 (307)، 3001/3002/3003 (200)، 4000 (NestJS up)
- ✅ shared-utils dist أُعيد بناؤه بعد تعديل `Bid` interface

**Migration note للـ DB المنتجة:**
- لا تحتاج migration scripted — الـ schema change idempotent (إضافة عمود nullable + جعل عمود قديم default).
- البيانات القديمة (`estimatedDays > 0` بدون `proposedDeliveryDate`) ستستمر تعمل عبر الـ fallback في الـ UI.

---

### 🐛 Fix: ALL tab still visible + قدم عرضاً still showing after bid (2026-05-17)

**ملاحظة المستخدم:** بعد التعديل السابق، لا تزال تاب "الكل" ظاهرة وزر "قدم عرضاً" لم يتغيّر للطلبات التي قُدّم عليها عرض.

**الأخطاء الجوهرية:**

1. **ALL tab لم تُحذف**: التعديل السابق احتفظ بـ "الكل" كتاب افتراضي. أزلته كلياً وجعلت الافتراضي `OPEN`.
2. **🔴 Root cause لـ "قدم عرضاً" المستمر**: الـ API endpoint `GET /api/orders` كان يرجع فقط `_count: { bids: true }` (عدد)، وليس مصفوفة `bids[]`. منطق الـ frontend `myBidStatus(o)` كان يقرأ `o.bids` التي لا تأتي أبداً → `null` دائماً → CTA يبقى "قدّم عرضاً" حتى بعد البِد.

**الإصلاحات:**

1. **API** — `apps/api/src/modules/orders/orders.service.ts.findAll()`: أضفت `bids: { select: { id, providerId, status, amount } }` إلى الـ include. حقول قليلة فقط (مش الـ body كاملاً) لتفادي bloat — كافية لمنطق الـ CTA. الـ NestJS watcher تعرّف على التغيير وأعاد البناء (تحقّقت من `dist/`).
2. **List page** — `apps/web/provider/src/app/(app)/opportunities/page.tsx`:
   - Tab union type: `'OPEN' | 'DIRECT'` (لا ALL)
   - الافتراضي: `'OPEN'`
   - حذفت `<TabsTrigger value="ALL">` و `totalCount` غير المستخدم
   - "مسح الفلاتر" يعيد للـ OPEN
   - `filtered` يفلتر بـ `o.mode === tab` مباشرة (لا حاجة لشرط ALL)

**سلسلة بيانات الـ CTA — تحقّق كامل:**
- ✅ API يرجع `bids: [{ id, providerId, status, amount }]` لكل طلب (تحقّقت بـ `grep` على الـ JS المبنيّ)
- ✅ `normalizeOrder` يحافظ على `bids[]` ويمرّر providerId/status (api-adapters.ts:47-55)
- ✅ `normalizeBid` يحافظ على `providerId` و `status` عبر `...b` spread
- ✅ List page يقرأ `myBidStatus(o)` ويبدّل CTA بـ `isPending` / `isRejected`

**ملفات معدّلة (2):**
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/web/provider/src/app/(app)/opportunities/page.tsx`

**التحقّق:**
- ✅ `pnpm --filter @nitaq/api exec tsc --noEmit` — clean
- ✅ `pnpm --filter @nitaq/provider exec tsc --noEmit` — clean
- ✅ كل الخوادم تستجيب: 3000 (307 redirect)، 3001/3002/3003 (200)، 4000 (NestJS up)
- ✅ `dist/src/modules/orders/orders.service.js` يحتوي `bids: { select: { id: true, providerId: true, status: true, amount: true } }`

---

### 🛠️ Drop AWAITING tab + simplify CTA + restart client server (2026-05-17)

**ملاحظات المستخدم:**
- إزالة تاب "بانتظار موافقة العميل"
- زر "قدم عرضاً" للطلبات التي قُدّم عليها عرض → استبدله بزر "تفاصيل"
- عند رفض العميل: نص الزر "إعادة تقديم" (بدل "إعادة تقديم عرض سعر")
- لوحة العميل لا تزال تظهر صفحة بيضاء على http://localhost:3002

**الإصلاحات:**

1. **AWAITING tab removed** من `provider/opportunities/page.tsx`:
   - Tab union type عاد لـ `'ALL' | 'OPEN' | 'DIRECT'` فقط
   - Counts عادت لـ openCount + directCount (لا awaitingCount)
   - الطلبات التي قدّم عليها مقدّم الخدمة عرضاً تظهر داخل OPEN/DIRECT بزر "تفاصيل" بدل CTA الإرسال

2. **CTA simplified**:
   - `PENDING` → "تفاصيل" (outline variant)
   - `REJECTED` → "إعادة تقديم"
   - بدون عرض → "قدّم عرضاً"

3. **Client blank page — root cause**: السبب الحقيقي أن next-dev process على port 3002 كان قد مات (لم يكن يستجيب). الـ layout defensiveness السابق صحيح لكنه لا يحلّ المشكلة لأن الـ server نفسه لم يكن يردّ. الحل: إعادة تشغيل `pnpm --filter @nitaq/client run dev`. تحقّقت أن `/` و `/login` يعيدان 200 OK مع HTML سليم (33KB+).

**ملفات معدّلة (2):**
- `apps/web/provider/src/app/(app)/opportunities/page.tsx` (tab removal + CTA labels)
- `apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx` (button text "إعادة تقديم")

**التحقّق:**
- ✅ `pnpm --filter @nitaq/provider exec tsc --noEmit` — clean
- ✅ Client app responding on 3002 (HTTP 200)

---

### 🛠️ Provider opportunities UX: status labels, tab renames, rejected-bid retry (2026-05-16)

**ملاحظات المستخدم:**
- لوحة العميل صفحة بيضاء على `http://localhost:3002`
- في provider/opportunities:
  - إزالة تاق "بانتظار عروض مقدّمي الخدمات" (نظهره فقط في حالات معينة)
  - استبدال تاق "قيد العروض" بـ "بإنتظار موافقة العميل"
  - إخفاء زر "قدم عرضاً" على الطلبات التي قدّم عليها مقدّم الخدمة عرضاً بالفعل
  - عند رفض العميل العرض: إضافة العرض المرفوض إلى سجل الطلب + زر "إعادة تقديم عرض سعر"
  - إعادة تسمية: "سوق مفتوح" → "طلبات السوق المفتوح"، "موجّه لشركتي" → "طلبات خاصة"

**الإصلاحات:**

1. **Client blank page**: `(app)/layout.tsx` يعالج `DEV_BYPASS_TOKEN` ك "غير مسجّل"، يمسح الـ tokens القديمة ويعيد التوجيه إلى `/login`
2. **Status labels** في `provider/status-badge.tsx`:
   - `PUBLISHED → "جديد"` (من منظور مقدّم الخدمة، الطلب المنشور هو فرصة جديدة)
   - `BIDDING → "بإنتظار موافقة العميل"`
   - (تم إعادة `admin` و `client` إلى "منشور" — التاق المخصّص للمقدّم فقط)
3. **List CTA branch**: في `opportunities/page.tsx`، الـ row يقرأ حالة عرض مقدّم الخدمة ويبدّل CTA:
   - `PENDING` → "عرض التفاصيل" (outline)
   - `REJECTED` → "إعادة تقديم عرض سعر"
   - لا يوجد عرض → "قدّم عرضاً"
4. **Rejected-bid retry**:
   - في `opportunities/[id]/page.tsx`: عند `myBid.status === 'REJECTED'` و الطلب لا يزال `PUBLISHED`/`BIDDING` → تظهر بطاقة "باب العروض ما زال مفتوحاً" + زر "إعادة تقديم عرض سعر"
   - الضغط على الزر يفتح نموذج التقديم بقيم العرض السابق معبأة + بانر يظهر العرض المرفوض السابق
   - الباك إند `bids.service.ts.create()` الآن يسمح بـ upsert من `REJECTED`/`WITHDRAWN`/`EXPIRED` → `PENDING` (سابقاً كان يقفل بعد PENDING). فقط `ACCEPTED` terminal.
5. **Tab renames**: "سوق مفتوح" → "طلبات السوق المفتوح"، "موجّه لشركتي" → "طلبات خاصة"

**ملفات معدّلة (5):**
- `apps/web/client/src/app/(app)/layout.tsx` + `apps/web/provider/src/app/(app)/layout.tsx`
- `apps/web/provider/src/components/status-badge.tsx`
- `apps/web/provider/src/app/(app)/opportunities/{page.tsx,[id]/page.tsx}`
- `apps/api/src/modules/bids/bids.service.ts`
- (revert) `apps/web/{admin,client}/src/components/status-badge.tsx` + `messages/{ar,en}/orders.json`

**التحقّق:**
- ✅ `pnpm --filter @nitaq/provider exec tsc --noEmit` — clean
- ✅ `pnpm --filter @nitaq/api exec tsc --noEmit` — clean

---

### 🛠️ User-reported issues batch — bid DTO, admin 404, counts, UX polish (2026-05-17)

**ملاحظات المستخدم:**
1. تواريخ ماضية في حقل تاريخ الاستلام
2. 🔴 `proposedPickupDate should not exist` عند تقديم العرض
3. 🔴 صفحة تفاصيل الطلب في الأدمن "الطلب غير موجود"
4. counts التابز في carrier opportunities غير دقيقة
5. count الـ sidebar = 3 لكن الصفحة 2 فقط
6. UI: حقل السعر يحتاج تمييز
7. (مؤجّل) معلومات تواصل الطرفين بعد القبول
8. "منشور" غير واضح → استبدله

**الإصلاحات:**

1. **min=today** على حقل التاريخ في الـ wizard + provider bid date input
2. **Bid DTO + schema**: أضفت `estimatedHours` + `proposedPickupDate` للـ Prisma Bid + CreateBidDto + service + `prisma db push`
3. **Admin order detail**: `useSWR + normalizeOrder` مع fallback إلى mock
4. **Counts accurate**: عرّفت `pool` = opps بعد city+search filter؛ كل counts من `pool` بدل `opps` الخام؛ الـ filtered tab content يستخدم `pool` كذلك → counts تطابق الواقع
5. **Sidebar count wired to SWR**: `useSWR('/orders')` + filter بـ JWT companyId — يطابق tabs الصفحة بالضبط
6. **Price input UX**: محاط بـ `border-2 border-primary/40 bg-primary/[0.04]`, `h-14 text-3xl font-bold`, autoFocus, preview للصافي
7. ⏳ مؤجَّل في TODO
8. **PUBLISHED → "بانتظار عروض مقدّمي الخدمات"**: في 3 `status-badge.tsx` + `messages/{ar,en}/orders.json`. (en: "Awaiting provider bids")

**ملفات معدّلة (10):**
- `apps/api/prisma/schema.prisma`, `apps/api/src/modules/bids/{dto/bid.dto.ts, bids.service.ts}`
- `apps/web/client/src/app/(app)/orders/new/page.tsx`
- `apps/web/provider/src/app/(app)/opportunities/{page.tsx,[id]/page.tsx}`
- `apps/web/provider/src/components/app-sidebar.tsx`
- `apps/web/admin/src/app/(app)/orders/[id]/page.tsx`
- `apps/web/{admin,client,provider}/src/components/status-badge.tsx`
- `messages/{ar,en}/orders.json`

**التحقّق:**
- ✅ `prisma db push` — schema in sync
- ✅ Type-check على 4 packages — نظيف
- ✅ i18n parity — 646 keys × 2 lang

**ما تبقّى من القائمة:**
- 🟡 #7 معلومات تواصل الطرفين بعد قبول العرض

---

### 🔐 Fix: "الجلسة غير صالحة" — DEV_BYPASS_TOKEN stuck in localStorage (2026-05-17)

**أعراض المستخدم:** بعد ربط الـ Backend، إنشاء طلب يرجع "فشل إنشاء الطلب: الجلسة غير صالحة".

**السبب:**
- المستخدم سجّل دخول قبل ما يُشغّل docker/API
- الـ login pages عندها fallback تلقائي: لو الـ API غير متاح وقت login، تحطّ `DEV_BYPASS_TOKEN` (السلسلة `"dev-bypass-token"`) في localStorage
- بعد ما الـ API صار شغّال، الـ axios interceptor كان يُرفِق هذا الـ token الوهمي → الـ API يرفضه (JWT verify يفشل) → 401
- لم يكن في آلية تنظيف تلقائي → المستخدم عالق

**الإصلاحات (3 ملفات: admin/client/provider `api.ts`):**

1. **Request interceptor يتجاهل `DEV_BYPASS_TOKEN`**: لو الـ token الوهمي في localStorage، لا يُرفَق في Authorization header → الـ API يرجع 401 طبيعي
2. **Response interceptor على 401 (لغير auth endpoints)** → `clearAuthAndRedirect()`: يمسح كل tokens + Zustand persist key، ثم `window.location.href = '/login'`
3. حماية: يستثني `/auth/*` endpoints (401 هناك = wrong password، ليس انتهاء جلسة) + يستثني المسار الحالي `/login` (تفادي infinite loop)

**للمستخدم — يحلّ تلقائياً عند المحاولة التالية:**
- أي عملية تطلب auth ستفعّل الـ flow الجديد: 401 → clear + redirect
- سجّل دخول من جديد بـ credentials حقيقية: `client@nitaq.sa` / `Client@1234`

**حلّ يدوي أسرع (لو ما اشتغل التلقائي):**
1. DevTools → Console: `localStorage.clear(); location.reload()`
2. سجّل دخول من جديد

**التحقّق:** ✅ Type-check على 3 web apps نظيف.

---

### 🔌 Backend Wiring Sweep — admin + client + carrier dashboards (2026-05-17)

ربط شامل لكل الصفحات الرئيسية بـ Backend API.

**Admin Portal:**
- 🔴 **CRITICAL**: `admin/auth-store.login()` كان يستدعي `/auth/login` بـ `phoneOrEmail` — الـ admin له endpoint منفصل: `/admin/auth/login` بـ `{ email, password }` فقط (DTO صارم). صار يستخدم الصحيح + logout على `/admin/auth/logout`.
- `/admin` (dashboard) → SWR على `/admin/dashboard/stats` + `/admin/orders`
- `/admin/companies` → SWR على `/admin/companies`
- `/admin/orders` → SWR على `/admin/orders` (مع `normalizeOrderList`)
- `/admin/disputes` → SWR على `/admin/disputes`
- `/admin/payments` → SWR على `/payments`

**Client Portal:**
- `/dashboard` → SWR على `/orders` + `/invoices`
- `/invoices` → SWR على `/invoices`

**Provider Portal:**
- `/dashboard` → SWR على `/orders` + `/orders?mine=true` + `/services` + `/payments`
- `/orders` → SWR على `/orders?mine=true`
- `/services` → SWR على `/services`
- `/employees` → SWR على `/employees`
- `/earnings` → SWR على `/payments`

**النمط الموحَّد:**
```tsx
const { data } = useSWR<unknown>('/path', fetcher);
const items = useMemo(() => {
  const arr = Array.isArray(data) ? data : (data?.items ?? []);
  return arr.length > 0 ? arr : MOCK_FALLBACK;
}, [data]);
```

Mock fallback يبقى للـ GETs (offline demo)؛ المutations تطرح خطأ حقيقي.

**ملفات معدّلة (13):**
- `apps/web/admin/src/lib/auth-store.ts` (endpoint fix)
- `apps/web/admin/src/app/(app)/page.tsx`, `/companies/page.tsx`, `/orders/page.tsx`, `/disputes/page.tsx`, `/payments/page.tsx`
- `apps/web/client/src/app/(app)/page.tsx`, `/invoices/page.tsx`
- `apps/web/provider/src/app/(app)/page.tsx`, `/orders/page.tsx`, `/services/page.tsx`, `/employees/page.tsx`, `/earnings/page.tsx`

**التحقّق:**
- ✅ Type-check على 6 packages — نظيف
- ✅ i18n parity — 646 keys × 2 lang × 11 files

**ما تبقى UI-only (للسلايس التالي):**
- Settings tabs mutations (admin/client/provider)
- صفحات الدعم
- Tracking events (live location)
- Disputes resolution actions
- Add Service mutation
- Saved addresses dropdown في الـ Wizard
- بيانات مقدّم الخدمة/الموظف + العميل بعد قبول العرض

---

### 🚨 CRITICAL: Mock fallback masked failed mutations + bid submit hang (2026-05-17)

**أعراض المستخدم:**
1. الطلب من العميل لا يظهر في لوحة مقدّم الخدمة (يبدو إنه أُرسل لكن في الحقيقة فشل ولم يُحفظ)
2. زر "إرسال العرض" يبقى عالقاً على "جاري الإرسال" بعد الضغط

**السبب الجذري:**

**Bug 1 — Mock fallback يخفي الفشل الحقيقي:**
- الـ axios interceptor كان يقبض **أي** خطأ (400 / 401 / 500 / network) ويرجع mock data بدل ما يرفض
- النتيجة: لو الـ API رفض الطلب (validation error مثلاً)، الـ wizard يستلم "نجاح وهمي" مع mock data
- الطلب ما يُنحفظ فعلياً في DB → مقدّم الخدمة ما يشوفه
- الـ user "يظن" إن الطلب أُرسل، لكن في الواقع mock interceptor "نجح" بدلاً منه

**Bug 2 — `setSubmitting(false)` في الـ catch فقط، مش في success أو finally:**
```tsx
// قبل (BUG):
setSubmitting(true);
try {
  await api.post('/orders/:id/bids', {...});
  await refetchOrder();
  // ← setSubmitting(false) ما يُنادى عند النجاح!
} catch (err) {
  setSubmitError(msg);
  setSubmitting(false);   // فقط هنا
}
```
الزر يبقى disabled مع "جاري الإرسال" حتى عند النجاح.

**الإصلاحات:**

**1. Mock fallback مقصور على GET فقط** (في كل من admin/client/provider `api.ts`):
- Mutations (POST/PUT/DELETE/PATCH) **تطرح خطأ حقيقي** عند الفشل
- Network errors: رسالة واضحة "الـ API غير متاح على {URL}. تأكّد أن الـ backend شغّال."
- Server errors (4xx/5xx): الـ message يستخرج من `response.data.error.message` أو `message` أو fallback `HTTP {status}`
- GETs تبقى تستخدم mock fallback عند الفشل (الـ demo mode + offline browsing يبقيان متاحين)

**2. Bid submit:** أضفت `finally` block:
```tsx
try { ... await refetchOrder(); }
catch (err) { setSubmitErr(msg); }
finally { setSubmitting(false); }   // ← يُنادى دائماً
```

**3. Order wizard publish error محرَّر من الـ silent swallow:**
- كان: `try { publish() } catch { /* non-fatal */ }` → الطلب ينحفظ DRAFT بدون نشر، ومقدّم الخدمة ما يشوفه
- الآن: لو فشل publish، تظهر رسالة واضحة "الطلب أُنشئ X لكن فشل نشره: Y" + يُعاد التوجيه لصفحة الطلب علشان المستخدم يحاول publish يدوياً

**ملفات معدّلة (5):**
- `apps/web/{admin,client,provider}/src/lib/api.ts` — GET-only mock fallback
- `apps/web/client/src/app/(app)/orders/new/page.tsx` — publish error visible
- `apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx` — finally block

**التحقّق:**
- ✅ Type-check على 3 web packages

**للمستخدم:**

بعد hard refresh (Cmd+Shift+R) في كل من العميل ومقدّم الخدمة:
1. أعد المحاولة لإنشاء طلب
2. **لو فشل**: راح تشوف رسالة خطأ واضحة بدل ما يبدو نجاح وهمي
3. **لو نجح**: الطلب راح يُنشأ + يُنشر فعلياً → الناقل يشوفه
4. زر إرسال العرض راح يرجع للحالة الطبيعية بعد الإرسال

**لو لازال فيه bug:** افتح DevTools → Network tab → شف الـ POST request للـ /orders ووش الـ status code والـ response body. مع رسالة الخطأ الجديدة الواضحة، نقدر نحدّد المشكلة في ثانية.

---

### 🛠️ Workflow UX fixes — bid visibility, "awaiting client" tab, city-bounded map (2026-05-17)

**أُبلِغت من المستخدم بعد smoke test أولي:**
- العميل لا يرى عرض الناقل في صفحة طلبه
- الناقل يرى الطلب بعد تقديم عرضه كأنه طلب جديد في "السوق المفتوح"
- الخريطة تسمح باختيار موقع خارج المدينة المختارة

**إصلاحات (5):**

**1. Client `/orders/[id]`** — يعرض عروض مقدّمي الخدمات فعلياً:
- كان يستخدم `bidsForOrder()` (mock array) → غيّرته ليستخدم `order.bids` المضمَّن من API
- API `findById()`: وسّعت الـ select على `bid.provider` ليشمل `nameEn, city, region, contactPhone`
- الصفحة تستخدم `bid.provider` المضمَّن (live) مع fallback إلى `companyById(providerId)` (mock)

**2. `shared-utils/api-adapters.ts`** — `normalizeBid()` جديدة:
- تحوّل API Bid (`amount`) إلى mock shape (`price`)
- `normalizeOrder` يطبّق `normalizeBid` على كل bid في `order.bids` تلقائياً

**3. Provider `/opportunities/[id]`** — يكتشف العرض الموجود ويعرض بطاقة بدل نموذج جديد:
- `myCompanyId` من `useAuthStore` (live JWT) أو `CURRENT_PROVIDER_ID` (mock)
- بحث في `order.bids` عن bid حيث `providerId === myCompanyId`
- بطاقة "عرضك على هذا الطلب" مع status badge (PENDING/ACCEPTED/REJECTED) + التفاصيل + ملاحظة "بانتظار قرار العميل"
- بعد التقديم: `refetchOrder()` يحوّل UI مباشرة للبطاقة بدل redirect

**4. Provider `/opportunities` (list)** — Tab جديد "⏳ بانتظار موافقة العميل":
- 4 tabs الآن: الكل / سوق مفتوح / موجّه لشركتي / **⏳ بانتظار موافقة العميل**
- `awaitingOpps` = الطلبات التي لمقدّم الخدمة bid بحالة `PENDING`
- Tabs الأخرى تستثني الـ awaiting → يحلّ الـ "ازدواجية" التي يراها مقدّم الخدمة
- PulsingBadge (amber) بعدد الـ awaiting

**5. Wizard map** — البحث محصور بالمدينة:
- `MapAddressPicker` يقبل `cityName` prop
- Nominatim query يضيف `viewbox` (~50km) + `bounded=1`
- Query bias بـ city name
- لو غيّر العميل المدينة، الخريطة + البحث ينتقلان فوراً

**التحقّق:**
- ✅ Type-check على 6 packages — نظيف

**باقي من قائمة المستخدم (TODO):**
- 🟡 **#7** بيانات مقدّم الخدمة/الموظف + بيانات العميل بعد قبول العرض
- 🟡 **#8** Filter الطلبات لمقدّمي الخدمات بحسب التخصص
- 🟡 **#9** العناوين المحفوظة كـ dropdown في الـ Wizard
- 🟢 **#1+#2** صفحات الدعم في admin/client/provider

---

### 🐛 CRITICAL Fix: Rules of Hooks violation في صفحة تفاصيل الطلب (2026-05-17)

**أعراض المستخدم:**
```
Unhandled Runtime Error
Error: Rendered more hooks than during the previous render.
Source: src/app/(app)/orders/[id]/page.tsx (94:30) @ ClientOrderDetail
  > 94 |   const sortedBids = useMemo(() => {
```

**السبب الجذري (مهم):**

في v0.8.0 Slice 1، أضفت `useSWR` و `normalizeOrder` فوق الـ early return `if (!order)`. لكن `useMemo(sortedBids)` ظلّ تحت الـ early return:

```tsx
// قبل الإصلاح — RULES OF HOOKS VIOLATION:
const { data: orderData } = useSWR(...)        // hook 1
const order = normalizeOrder(orderData) ?? ...  // ليس hook
const [sort] = useState(...)                    // hook 2
const [acceptBid] = useState(...)               // hook 3
// ... 4 more useState hooks (total: 7)

if (!order) {
  return <NotFound />;   // ← First render: order undefined → returns هنا
}                        // 7 hooks called

const bids = bidsForOrder(order.id);
const sortedBids = useMemo(() => {...}, [bids, sort]);  // ← hook 8 — UNREACHABLE on first render!
```

React يكتشف:
- **First render** (order = undefined): 7 hooks called
- **Second render** (order = defined from SWR): 8 hooks called → **"Rendered more hooks than during the previous render"** → error.tsx

هذا violation أساسي لـ React Rules of Hooks: كل hook يجب يُنادى نفس العدد ونفس الترتيب في كل render.

**الإصلاح:**

نقلت `useMemo` (و `bidsForOrder`/`timelineFor` بداخل `useMemo`s مع `order` كـ dependency) **فوق** الـ early return:

```tsx
// بعد الإصلاح — كل الـ hooks مُناداة دائماً بنفس الترتيب:
const { data: orderData } = useSWR(...)
const order = normalizeOrder(orderData) ?? ...
const [sort] = useState(...)
// ... 5 useState hooks (total: 6)

const bids = useMemo(() => (order ? bidsForOrder(order.id) : []), [order]);
const timeline = useMemo(() => (order ? timelineFor(order.id) : []), [order]);
const sortedBids = useMemo(() => {...}, [bids, sort]);
// total: 9 hooks — same every render ✓

if (!order) {
  return <NotFound />;   // ← Early return AFTER all hooks
}
```

**Audit الكامل لباقي الصفحات:**

شغّلت سكربت يكتشف نفس النمط في كل صفحات `[id]` المعدّلة:
- `client/orders/[id]` — ❌ كان فيه bug → **مُصلَح**
- `carrier/orders/[id]` — ✅ كل hooks فوق `if (!order)` (لم يكن فيه bug)
- `carrier/opportunities/[id]` — ✅ سليم
- `client/orders/page.tsx` (list) — ✅ سليم (لا early return)
- `carrier/opportunities/page.tsx` (list) — ✅ سليم

الـ child components (`DirectProposalView`، `BidActions`) عندها hooks بعد early returns لكن **كل function منها مكوّن مستقل** — hooks-ها هي own render context، فالقاعدة لا تنطبق عليها (false positives من السكربت).

**التحقّق:**
- ✅ Type-check على 6 packages
- ✅ Build على 5 packages (admin/client/provider/landing/api)
- ✅ `GET /orders/ord-1` → HTTP 200 (لا أخطاء SSR)
- ✅ `GET /orders/ORD-2025-0142` → HTTP 200
- ✅ `GET /orders` list → HTTP 200
- ✅ `GET /orders/new` wizard → HTTP 200

**ليش لا نرجع للنسخة الاحتياطية:**
الـ bug كان localized — 3 أسطر في موقع غلط. الـ rollback يفقد:
- كل شغل Slice 1 (workflow engine + escrow + Maps + Wizard time windows + cancellation fees + state transitions)
- v0.7.0 cleanup (PWA removal — وإلا يرجع الـ offline-trap)
- v0.6.0 wizard + maps + cargo types + cities admin
- v0.5.0 env validation + branding + admin catalogs + SMS templates

**للمستخدم:**

```bash
cd /Users/aa/nitaq
pkill -f "next dev"
rm -rf apps/web/*/.next
pnpm dev
```

ثم Cmd+Shift+R في المتصفّح وجرّب `/orders/ord-1` — **يجب يشتغل الآن**. الـ Rules of Hooks violation كانت السبب الحقيقي لكل الـ 500 errors على هذه الصفحة. الإصلاحات الدفاعية السابقة (normalizer + `?? 0` على undefined) صحيحة وتبقى، لكن الـ violation الأساسي ما كنت ألاحظه لأن SSR كان يخفيه (الـ user كانت تختبر unauthenticated، يرى "جارٍ التحويل..." بدل الـ page).

---

### 🐛 Defensive hardening — حماية order detail pages من undefined-method crashes (2026-05-17)

**أعراض المستخدم:** صفحة `/orders/ord-1` (أو أي ID غير موجود) تعرض error.tsx "حدث خطأ غير متوقع".

**السبب الجذري — الـ chain الكامل:**

١. **مسار الـ URL:** `/orders/ord-1` (lowercase) — لا يطابق أي ID في mock data (الأنماط `ORD-2025-XXXX`).  
٢. **`dev-mocks.getMockResponse('orders/ord-1')`** يدخل في branch الـ orders ويستخدم fallback: `ORDERS.find(o => o.id === id) ?? ORDERS[0]` → يرجع **ORDERS[0]** (أول order في mock).  
٣. **Normalizer** يأخذ ORDERS[0] (الذي عنده `weightKg/truckType` أصلاً) ويُعيد ضبط الـ aliases. النتيجة: order يحتوي `weightKg: 24000`، `truckType: 'LARGE_FLATBED'`. **يجب أن يعمل.**  
٤. **لكن الـ user كانت لديها bundle قديم في المتصفّح** قبل أن أبني الـ normalizer. الـ bundle القديم يحتاج `order.weightKg.toLocaleString()` على undefined.  
٥. حتى مع إعادة التحميل، الـ bundle الجديد يحتوي على نفس النمط الهشّ بدون defensive guards على بعض الأماكن (`carrier.nameAr.split`، `bid.price.toLocaleString`).

**الإصلاحات — هاردنينج دفاعي للـ undefined accesses:**

**`apps/web/client/src/app/(app)/orders/[id]/page.tsx`** (5 أماكن):
- `order.weightKg.toLocaleString` → `(order.weightKg ?? 0).toLocaleString`
- `bid.price.toLocaleString` → `(bid.price ?? 0).toLocaleString`
- `c.nameAr.split` → `(c.nameAr ?? '').split` + `w[0] ?? ''`
- `carrier?.nameAr.split` → `(carrier?.nameAr ?? '').split` + `w[0] ?? ''`
- `CARGO_LABELS[order.cargoType]` → `(order.cargoType && CARGO_LABELS[order.cargoType]) || order.cargoType || '—'`
- `TRUCK_LABELS[order.truckType]` → same pattern

**`apps/web/provider/src/app/(app)/orders/[id]/page.tsx`** (3 أماكن):
- `client.nameAr.split` → defensive
- `order.weightKg.toLocaleString` → defensive
- `km.toLocaleString` → defensive

**`apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx`** (3 أماكن):
- `client.nameAr.split` × 2 (تكرّر في الـ DIRECT proposal section)
- `order.weightKg.toLocaleString` × 2
- `SERVICE_LABELS[order.serviceType]` defensive

**التحقّق:**
- ✅ Type-check يمرّ على 6 packages
- ✅ Build (client + provider) نظيف
- ✅ كل الـ method calls على القيم المحتملة undefined صار محميّاً

**ملاحظة:**
الـ adapter pattern (`normalizeOrder`) يحمي من field-name mismatches بشكل صحيح. الـ defensive hardening هنا ضد سيناريوهات edge مختلفة (mock fallback لـ ID غير موجود، API يرجع شكل غير متوقّع، إلخ). الاثنان معاً = صفحات قويّة تتحمّل أي data shape.

**للمستخدم:**

```bash
pkill -f "next dev"
rm -rf apps/web/*/.next
pnpm dev
```

ثم Cmd+Shift+R في المتصفّح. لو لازال يحصل خطأ، **افتح DevTools Console**، خذ screenshot للـ stack trace، وأعطنيها — راح يدلّني على exact line.

---

### 🧹 Nuclear Cleanup — حذف PWA كلياً + إصلاح date-fns ESM trap (2026-05-17)

**أعراض المستخدم:** `Cannot find module './3245.js'` على الـ landing — webpack chunk corruption. باقي 500 errors متفرّقة. المنصّة هشّة.

**التحليل الجذري — سلسلة الأخطاء المتراكمة:**

١. **PWA SW (v0.7.0)** كان مصدر الـ offline-trap الأصلي → تخلّصنا منه لكن بقت آثار (manifest، icons، offline pages، PwaShell component)  
٢. **Mock vs API shape mismatch** (weightKg vs weight) → 500 على detail pages  
٣. **Node 25 + shared-utils source-main** → `ERR_MODULE_NOT_FOUND`  
٤. **date-fns 3.x ESM-only** + shared-utils compiled CJS → webpack interop failure على الـ landing  
٥. **`.next` cache corruption** بعد كل تغيير schema → chunks تختفي → 500

**القرار النهائي:** نظافة جذرية — **PWA يُحذف بالكامل** (يرجع بـ design أنظف في v1.0+ مع Workbox).

### الـ Cleanup الكامل

**ملفات محذوفة (28):**
- `apps/web/{admin,client,provider,landing}/public/manifest.webmanifest` (4)
- `apps/web/{admin,client,provider,landing}/public/icons/*` (12 SVG icons)
- `apps/web/{admin,client,provider,landing}/src/app/offline/` (4 page + 1 layout)
- `apps/web/{admin,client,provider,landing}/src/components/pwa-shell.tsx` (4)

**ملفات جديدة/مستبدلة (5):**
- `apps/web/{admin,client,provider,landing}/src/components/online-status-bar.tsx` — نسخة مبسّطة من PwaShell، تحتفظ فقط بـ:
  - banner الـ online/offline (UX مفيد، لا علاقة له بـ SW)
  - one-shot rescue path: unregister أي SW قديم + clear caches في الـ useEffect
- `apps/web/landing/src/app/not-found.tsx` — root 404 بـ `dynamic = 'force-dynamic'` (يحلّ مشكلة prerender + next-intl headers)

**ملفات معدّلة (5):**
- `apps/web/{admin,client,provider,landing}/src/app/layout.tsx` — حذفت `manifest`, `appleWebApp`, `icons`, `Viewport.themeColor` من metadata + استبدلت `<PwaShell />` بـ `<OnlineStatusBar />`
- `packages/shared-utils/src/format.ts` — رجعت إلى date-fns 2.x imports
- `packages/shared-utils/package.json` — date-fns: `^2.30.0`، exports مبسّطة (main + types فقط على dist/)

**ملفات محتفَظ بها كـ kill-switch:**
- `apps/web/{admin,client,provider,landing}/public/sw.js` — يُلغي تسجيل أي SW قديم + يمسح كل caches عند الـ activate (rescue path للمتصفّحات اللي ما زالت controlled من v0.7.0)

### إصلاح date-fns ESM trap

date-fns 3.x كان pure ESM، وعند تكوين shared-utils كـ CJS، الـ output كان يحتوي `require('date-fns')` — webpack رفضه كـ "ESM packages need to be imported".

**الحلّ:** downgrade إلى date-fns 2.30.0 (CJS-compatible + same API):
```ts
// قبل (v3 — ESM-only):
import { ar } from 'date-fns/locale/ar';

// بعد (v2 — CJS):
import ar from 'date-fns/locale/ar';   // default export
```

### التحقّق النهائي

- ✅ Type-check على **6 packages** — كلها نظيفة
- ✅ Build على **5 packages**:
  - admin: ƒ Dynamic
  - client: ƒ Dynamic
  - provider: ƒ Dynamic
  - landing: ● SSG + ƒ Dynamic (يبنى الآن بدون أخطاء)
  - api: nest build success
- ✅ `pnpm check:i18n` — 11 ملف × 646 مفتاح × 2 لغة
- ✅ لا references متبقّية لـ PwaShell أو `/manifest.webmanifest` أو `/icons/icon-` في الكود

### للمستخدم — كيف يستفيد من الـ cleanup

في الـ terminal:
```bash
cd /Users/aa/nitaq
pkill -f "next dev"     # أوقف dev القديم
rm -rf apps/web/*/.next # امسح caches
pnpm dev                # شغّل من جديد
```

في المتصفّح: **Cmd+Shift+R** (hard refresh). الـ `OnlineStatusBar` على mount يلغي أي SW قديم + يمسح cache من v0.7.0 تلقائياً.

### الخطوة التالية: إكمال Slice 1 smoke test

المنصّة الآن نظيفة. الـ workflow كله مربوط (orders/bids/escrow). راجع `GETTING_STARTED.md` للـ 12 خطوة.

---

### 🐛 Fix: 500 على صفحة تفاصيل الطلب — mock vs API shape mismatch (2026-05-17)

**أعراض المستخدم:** صفحة "تفاصيل الطلب" تعرض `حدث خطأ غير متوقع`.

**السبب الجذري:**
- الـ mock data في `shared-utils/mock-data.ts` تستخدم: `weightKg`, `truckType`, `bidCount`
- Prisma schema + API responses تستخدم: `weight`, `requiredTruckType`, `_count.bids`
- صفحات الـ UI كُتبت بالأصل على mock shape (`order.weightKg.toLocaleString()`)
- لمّا الـ SWR يجلب بيانات حقيقية، `order.weightKg` تكون `undefined` → استدعاء `.toLocaleString()` على undefined → crash → error.tsx يعرض الرسالة

**الحلّ — Adapter Layer:**
- ملف جديد: `packages/shared-utils/src/api-adapters.ts`
- **`normalizeOrder(input)`**: يأخذ API response (أو null/undefined) ويرجع mock-compatible Order:
  - `weightKg ← weight`
  - `truckType ← requiredTruckType`
  - `bidCount ← _count.bids || bids.length`
- **`normalizeOrderList(input)`**: يفك أي wrapper شائع (array | `{items}` | `{data}`) ويطبّق `normalizeOrder` على كل عنصر
- **Idempotent**: لو passed already-normalized object، الـ aliases تُعاد ضبطها بنفس القيم (no harm)
- صُدِّر من index.ts

**استُخدم في 4 ملفات:**
- `apps/web/client/src/app/(app)/orders/page.tsx` — list
- `apps/web/client/src/app/(app)/orders/[id]/page.tsx` — detail
- `apps/web/provider/src/app/(app)/opportunities/page.tsx` — list
- `apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx` — detail
- `apps/web/provider/src/app/(app)/orders/[id]/page.tsx` — detail

**التحقّق:**
- ✅ Type-check يمرّ على 6 packages
- ✅ `pnpm build` على client و provider — نظيف
- ✅ shared-utils dist/api-adapters.{js,d.ts} مُولَّد

**درس مستفاد:**
- لما يُربط mock UI بـ real API، **field-name differences** هي السبب الأكثر شيوعاً للـ crashes
- الـ adapter pattern يحلّها في مكان واحد — لا حاجة لتعديل 30 صفحة
- للـ slices القادمة: أبني الـ adapter قبل ما أربط أي page

---

### 🔧 Fix: API startup فشل بـ ERR_MODULE_NOT_FOUND (Node 25 + shared-utils) (2026-05-17)

**أعراض المستخدم:** API يفشل ببدء التشغيل مع:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'/Users/aa/nitaq/packages/shared-utils/src/format'
```

**السبب الجذري:**
- `packages/shared-utils/package.json` كان يشير: `"main": "./src/index.ts"` (ملف TypeScript مصدر)
- Node 25 (v25.6.0) لا يقدر يحمّل ملفات `.ts` مباشرة — يحتاج `.js` مبنية
- إضافة: `tsconfig` كان يبني بـ `"module": "ESNext"` بدون extensions، فحتى لو بنينا، الـ output ESM لا يشتغل مع Node 25 + CJS
- الـ API يطلب `require('@naqla/shared-utils')` (CJS) — لا يلقى أي ملف JS يطابق

**الحلّ:**
1. **`packages/shared-utils/tsconfig.json`** — حوّلت إلى `"module": "CommonJS"` + `"moduleResolution": "Node"` لإنتاج CJS صالح لـ Node 25
2. **`packages/shared-utils/package.json`** — حدّثت:
   - `"main": "./dist/index.js"` (بدل `./src/index.ts`)
   - `"types": "./dist/index.d.ts"`
   - `"exports"` field للـ subpath resolution
   - script `"dev": "tsc --watch --preserveWatchOutput"` للـ HMR في dev
3. **`turbo.json`** — أضفت `"dependsOn": ["@nitaq/shared-utils#build"]` لـ dev task → shared-utils تُبنى قبل أي app يبدأ
4. **`apps/api/src/app.module.ts`** — وسّعت `envFilePath` ليلاقي الـ env من cwd ومن monorepo root معاً (يدعم تشغيل من `apps/api/` أو من root)
5. **بنيت `dist/`** — مرة واحدة، أنتجت 32 ملف (.js + .d.ts + maps)

**التحقّق:**
- ✅ `tsc --noEmit` على 6 packages — نظيف
- ✅ `node dist/src/main.js` (من `apps/api`) — API يبدأ، يمرّ env validation، يحاول الاتصال بـ Postgres (يحتاج `pnpm docker:up`)
- ✅ لا أكثر `ERR_MODULE_NOT_FOUND`

**الخطوة المتبقية للمستخدم:**
لو ما عنده `.env.development`:
```bash
cp .env.development.example .env.development
```
(فعلتها له، الملف موجود الآن)

ثم تشغيل Postgres:
```bash
pnpm docker:up  # Postgres + Redis + MinIO
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

**درس مستفاد:**
- منصّات الـ monorepo بـ workspace packages **لازم** تبني الـ shared packages إلى dist/ أو تستخدم loader مخصّص — لا يكفي `"main": ".ts"` مع Node حديث
- `tsc --watch` parallel للـ dev workflow يحلّ مشكلة "هل ينعكس تعديل shared-utils تلقائياً في الـ API؟" نعم، لأن الـ API watch يكتشف dist/ يتغيّر

---

### 🛑 PWA Disabled Entirely + Kill-Switch SW (2026-05-17)

**القصة:** الإصلاح السابق (التحفّظ في `fetch`) لم يكفِ — المستخدم لازال محجوزاً بالـ SW القديم وكان يرى صفحة "أنت غير متصل بالإنترنت" على كل تنقّل. السبب: المتصفّح حتى لو حدّث الـ sw.js، الصفحات المفتوحة لازالت "controlled" من الـ SW القديم حتى تُغلق كلها.

**الحلّ الجذري (vs. patch):**
- **PWA registration مُلغى كلياً** في الـ PwaShell (سواء dev أو prod) حتى نراجع الـ feature في v1.0+ بـ design أنظف
- **`sw.js` صار kill-switch**: يلغي تسجيل نفسه + يمسح كل الـ caches + يُجبر reload لكل tab مفتوح، على الـ install/activate
- **PwaShell** يبقى مفيد للـ OnlineStatusBar (red/green banner عند انقطاع/استعادة الاتصال) ويُنظّف SW + caches كلّ mount كـ rescue path للمتصفّحات اللي ما تكتشف تحديث sw.js تلقائياً

**كيف يعمل الـ rescue تلقائياً:**
1. المستخدم يفتح أي صفحة localhost (حتى لو "offline" مُعلّقة)
2. المتصفّح يفحص `/sw.js` تلقائياً (هذا الـ fetch لا يمرّ عبر SW أبداً، direct إلى server)
3. يلاحظ تغيُّر المحتوى → install للـ kill-switch
4. الـ kill-switch ينفّذ `skipWaiting()` + يأخذ control فوراً
5. على `activate`:
   - `caches.delete()` لكل cache
   - `registration.unregister()`
   - `clients.matchAll()` + `client.navigate(url)` لكل tab → يُعاد تحميلها بدون SW
6. النتيجة: المستخدم يرى الصفحة الحقيقية بدون أي خطوة يدوية ✅

**الملفات (8):**
- `apps/web/{admin,client,provider,landing}/public/sw.js` — kill-switch
- `apps/web/{admin,client,provider,landing}/src/components/pwa-shell.tsx` — no SW registration

**Verification:**
- ✅ Type-check يمرّ على الأربعة apps
- ✅ Dev server يخدم الصفحات (HTTP 200) + يخدم `/sw.js` بالمحتوى الجديد
- ✅ `caches`/SW يُمسحان تلقائياً للمستخدمين العالقين

**ملاحظة قبل ما نرجع لـ PWA لاحقاً:**
- لا نسجّل SW في dev mode أبداً
- نستخدم `serwist` أو Workbox (مكتبة ناضجة) بدل sw.js يدوي
- نسجّل فقط في production + خلف feature flag
- نستخدم `Cache-Control: max-age=0` للـ sw.js نفسه (المتصفّحات تفعل افتراضياً، لكن نوثّقها)

---

### 🚨 CRITICAL Fix: PWA Service Worker كان يبرك المنصة في dev mode (2026-05-17)

**أعراض المستخدم:** "الآن المنصة كاملة لا تعمل ويظهر لي أنت غير متصل بالإنترنت"

**السبب الجذري:**
- الـ service worker اللي أُضيف في v0.7.0 كان يُسجَّل دائماً (dev و prod)
- في dev mode، dev server يُعاد تشغيله بكثرة (HMR، manual restarts، route changes، Prisma regenerate)
- كل restart = transient fetch failure
- الـ SW القديم كان يفسّر أي fetch failure كـ "offline" → يخدم `/offline` page لكل navigation
- النتيجة: المستخدم عالق على صفحة offline حتى لو لازال متصلاً بالإنترنت

**الإصلاحات (5 طبقات):**

1. **`PwaShell` لا يُسجِّل SW في dev mode:**
   - الـ component يكتشف dev mode عبر `process.env.NODE_ENV !== 'production'` أو `localhost`/`127.0.0.1`/`*.local`
   - في prod فقط يُسجَّل الـ SW

2. **Rescue path للمستخدمين العالقين:**
   - عند تشغيل الـ PwaShell الجديدة في dev، تستدعي `navigator.serviceWorker.getRegistrations()` وتُلغي تسجيل أي SW قديم
   - تنظّف جميع الـ caches عبر `caches.keys().delete(...)`
   - reload واحد بعد deploy الإصلاح = حلّ آلي بدون تدخّل المستخدم

3. **الـ SW نفسه أصبح أكثر تحفّظاً (لـ production):**
   - لا يخدم `/offline` إلا إذا `navigator.onLine === false` فعلاً
   - أي failure آخر (HTTP 500، slow network، etc.) → re-throw → المتصفّح يعرض UI الخطأ الافتراضي ويترك المستخدم يعمل refresh يدوياً
   - يتجاهل تماماً `/api/` و `/socket.io/` (لا caching للـ realtime)
   - `Promise.allSettled` للـ shell assets — لو asset واحد فشل cache، الـ install ما يفشل
   - الـ cache version زاد إلى `v2` (يُجبر invalidation للـ caches القديمة)

4. **الـ files المعدّلة (8):**
   - `apps/web/{admin,client,provider,landing}/src/components/pwa-shell.tsx` (×4)
   - `apps/web/{admin,client,provider,landing}/public/sw.js` (×4)

5. **Type-check + builds:** ✅ كلها تمرّ على الأربعة + API.

**كيف يستعيد المستخدم نفسه:**
1. أعد تحميل الصفحة (Cmd+Shift+R) — الـ PwaShell الجديد يلغي الـ SW القديم تلقائياً
2. **لو لازال عالقاً** (الـ SW القديم لا يسمح بـ refresh):
   - افتح DevTools (Cmd+Option+I)
   - **Application** tab → **Service Workers** → اضغط "Unregister" لكل SW
   - **Application** tab → **Storage** → "Clear site data"
   - Cmd+Shift+R

---

### 🐛 Fix: Landing `/offline` + `/_not-found` build failure + stale-cache 500s (2026-05-17)

**أعراض المستخدم:** بعض الصفحات تعرض 500 بعد إعادة التحميل في تطبيقات client/provider.

**التشخيص الذي أجريته:**
- ✅ `tsc --noEmit` يمرّ على كل الـ 6 packages — لا أخطاء كومبايل
- ✅ `pnpm build` على admin/client/provider/api — كلها نظيفة (ƒ Dynamic لكل الصفحات)
- ❌ `pnpm build` على **landing** — يفشل في `/offline` + `_not-found`
- ✅ Probed 50+ صفحة عبر curl على dev servers (admin: 18، client: 16، provider: 22، landing: 8) → كلها 200/307
- ✅ بحثت عن error content في HTML — لا inline errors

**السبب الجذري للـ build failure (landing فقط):**
- `app/layout.tsx` في landing يستدعي `getLocale()` من `next-intl/server` (يقرأ cookies عبر `headers()`)
- `next-intl` (v3) في Next.js 14 App Router لا يدعم static prerendering في server components التي تستخدم `getLocale()` بدون `unstable_setRequestLocale`
- النتيجة: عند build، Next.js يحاول prerender `/offline` و `_not-found` (افتراضياً static) لكنه يصطدم بالـ root layout الـ dynamic → فشل
- Admin/Client/Carrier ليس لديها هذه المشكلة لأنها بلا `[locale]` route segment، فكل الـ routes فيها dynamic أصلاً

**السبب المحتمل للـ 500 الذي رآه المستخدم:**
- **Stale `.next` cache** من قبل تعديلات v0.8.0 Slice 1 (تغيير schema + إضافة workflow fields + الـ Prisma client بحاجة regenerate)
- لو الـ dev server كان شغّال قبل، الكاش القديم يحتوي على bundles لا تتطابق مع الـ types الجديدة → runtime crash

**الإصلاحات:**

1. **`apps/web/landing/src/app/offline/layout.tsx`** — جديد:
   - Server-component layout يفرض `export const dynamic = 'force-dynamic'` على route segment
   - السبب: Next.js لا يحترم route-segment config في `'use client'` modules — يجب وضعه في server component في الـ tree
   - النتيجة: `/offline` يُرَنْدَر on-demand بدل prerender

2. **`apps/web/landing/src/app/not-found.tsx`** — جديد:
   - Root-level 404 يحلّ محل الـ default الذي يولّده Next.js (الذي كان يحاول prerender ويفشل)
   - مع `export const dynamic = 'force-dynamic'`
   - يغطي URLs خارج `[locale]` prefix (مثل `/foo` بدل `/ar/foo`)

3. **مسح `.next` caches** لكل التطبيقات الأربعة كإجراء وقائي

**التحقق:**
- ✅ `pnpm --filter @nitaq/landing build` يمرّ
- ✅ كل الـ 5 packages تبني نظيفة (admin/client/provider/landing/api)
- ✅ كل الـ 6 packages type-check نظيفة
- ✅ `pnpm check:i18n` — 646 key × 2 lang
- ✅ probed 50+ صفحة في dev mode → كلها 200

**للمستخدم — لو ظهرت 500 مرة ثانية:**
```bash
# clean state recovery
pkill -f "next dev" 2>/dev/null   # كل dev servers
rm -rf apps/web/*/.next             # امسح cache كل الـ apps
pnpm db:generate                    # regenerate Prisma client
pnpm db:migrate                     # طبّق أي migrations جديدة
pnpm dev                            # شغّل من جديد
```

ثم في المتصفح: **Cmd+Shift+R** (hard refresh) لمسح browser cache.

---

### v0.8.0 Slice 1 — OPEN Order Happy Path Wired End-to-End 🟢 (مكتمل)

**الهدف:** تفعيل: عميل ينشر طلب → مقدّم الخدمة يقدّم عرض → عميل يقبل → مقدّم الخدمة يُنجز → escrow يُفرَج. كل خطوة فعلية على DB حقيقية، لا mock.

#### Backend (apps/api)
- **Prisma schema** — `Order` model امتدّ بـ:
  - `mode: String` (OPEN/DIRECT، default OPEN)
  - `tripType: String` (SAME_CITY/INTER_CITY، default INTER_CITY)
  - `pickupWindow: String` (MORNING/EVENING/ALL_DAY، default ALL_DAY)
  - `targetProviderId: String?` + FK relation `TargetProviderOrders`
- **Migration:** `20260517000000_add_order_workflow_fields/migration.sql` — آمنة (defaults للحقول الجديدة) ومتوافقة مع البيانات الحالية
- **`CreateOrderDto`** يستقبل الحقول الجديدة (كل اختياري، validated بـ `@IsEnum`)
- **`orders.service.create()`** يكتب الحقول الجديدة، مع fallback ذكي: لو `tripType` غير مرسل، يُستنتج من `originCity === destinationCity`
- **`orders.service.list()`** لمقدّمي الخدمات معاد كتابتها: ثلاث buckets معاً (OPEN marketplace + DIRECT-to-this-provider + assigned-to-me)
- **`bids.service.accept()`** — مُحسَّن: بعد قبول العرض، **يُنشئ Payment row بحالة HELD** تلقائياً (upsert على orderId الـ unique) مع breakdown صحيح (8% عمولة)
- **Endpoints جديدة:**
  - `POST /api/orders/:id/deliver` — مقدّم الخدمة يضع DELIVERED (CONFIRMED/IN_TRANSIT → DELIVERED، يسجّل `actualDeliveryAt`)
  - `POST /api/orders/:id/complete` — العميل يؤكّد (DELIVERED → COMPLETED + Payment HELD → RELEASED في transaction)

#### Frontend (apps/web)
- **`apps/web/client/src/app/(app)/orders/new/page.tsx`** — الـ wizard submit صار async:
  - يحوّل form state إلى `CreateOrderDto` كامل (مع region من DEFAULT_CITIES، coordinates من الـ map pins)
  - يستدعي `POST /orders` ثم immediately `POST /orders/:id/publish`
  - معالجة أخطاء واضحة + loading state
- **`apps/web/client/src/app/(app)/orders/page.tsx`** — list يستخدم `useSWR('/orders')` بدل `ordersForClient()` mock
- **`apps/web/client/src/app/(app)/orders/[id]/page.tsx`** — detail يستخدم `useSWR('/orders/:id')`:
  - زر "قبول العرض" → `POST /orders/:id/bids/:bidId/accept` (atomic: accept + reject others + Payment HELD)
  - dialog الإلغاء → `POST /orders/:id/cancel`
  - dialog تأكيد الاستلام → `POST /orders/:id/complete`
  - كل بعدها `mutate()` للـ SWR لتحديث الصفحة
- **`apps/web/provider/src/app/(app)/opportunities/page.tsx`** — list من SWR بدل mock
- **`apps/web/provider/src/app/(app)/opportunities/[id]/page.tsx`** — bid submit:
  - زر "إرسال العرض" → `POST /orders/:orderId/bids` مع payload كامل (amount + estimatedDays + estimatedHours + proposedPickupDate + notes)
- **`apps/web/provider/src/app/(app)/orders/[id]/page.tsx`** — detail من SWR:
  - زر "تأكيد البدء" → `POST /orders/:id/confirm`
  - زر "تأكيد الإنجاز" → `POST /orders/:id/deliver`

#### Graceful Degradation
- الـ api client (`apps/web/*/src/lib/api.ts`) عنده interceptor فيه `getMockResponse(url)` fallback. النتيجة:
  - **مع API شغّال:** كل شيء على DB حقيقي
  - **بدون API:** الصفحات تعرض mock data كما السابق — لا تنهار

#### Smoke Test Walkthrough

> 🧪 **اختبر الـ workflow كامل بنفسك:**

```bash
# 1. شغّل البنية التحتية
pnpm docker:up                         # Postgres + Redis + MinIO
pnpm db:generate                       # Prisma client
pnpm db:migrate                        # تطبق migration الجديدة
pnpm db:seed                           # 3 حسابات + شركتين

# 2. شغّل كل التطبيقات
pnpm dev
```

ثم في المتصفح:

| الخطوة | الواجهة | الإجراء | المتوقّع |
|---|---|---|---|
| 1 | http://localhost:3002/login | Client login (`client@nitaq.sa` / `Client@1234`) | redirect إلى dashboard |
| 2 | /orders/new | املأ wizard (الخطوات الخمس)، submit | redirect إلى `/orders/<id>` بحالة PUBLISHED |
| 3 | http://localhost:3003/login | Provider login (`provider@nitaq.sa` / `Provider@1234`) | dashboard |
| 4 | /opportunities | الطلب الجديد يظهر في القائمة | ✓ |
| 5 | /opportunities/<id> | أدخل سعر + أيام + اضغط "إرسال العرض" | redirect إلى `/opportunities` |
| 6 | (client) /orders/<id> | يظهر العرض في "العروض المستلمة" مع badge ETA كامل | ✓ |
| 7 | (client) اضغط "قبول هذا العرض" + أكّد | order → ASSIGNED، Payment HELD ينشأ في DB | ✓ |
| 8 | (provider) /orders/<id> | الطلب الآن في "طلباتي" | ✓ |
| 9 | (provider) اضغط "تأكيد البدء" | order → CONFIRMED | ✓ |
| 10 | (provider) اضغط "تأكيد الإنجاز" | order → DELIVERED + actualDeliveryAt | ✓ |
| 11 | (client) /orders/<id> | يظهر `EscrowCountdown` بعدّاد 72:00:00 | ✓ |
| 12 | (client) اضغط "تأكيد الاستلام" | order → COMPLETED + Payment → RELEASED | ✓ |

**Verify في الـ DB:**
```bash
docker exec -it nitaq-postgres psql -U nitaq -d nitaq_dev -c \
  'SELECT id, "orderNumber", status, "agreedPrice" FROM "Order" ORDER BY "createdAt" DESC LIMIT 5;'

docker exec -it nitaq-postgres psql -U nitaq -d nitaq_dev -c \
  'SELECT "orderId", status, "totalAmount", "providerAmount", "releasedAt" FROM "Payment" ORDER BY "createdAt" DESC LIMIT 5;'
```

#### ما زال mock في هذا الـ slice (يكتمل في slices لاحقة)
- 🟡 الـ admin pages (companies/disputes/payments) — لم تُربط بعد
- 🟡 Cancellation flow على مقدّم الخدمة
- 🟡 DIRECT mode negotiation rounds (accept/counter/decline) — UI كامل، لكن backend غير مربوط
- 🟡 Notifications real-time — Gateway موجود لكن لا frontend listener
- 🟡 Tracking events (live location)
- 🟡 Disputes lifecycle

### v0.6.0 — Workflow & Maps ✅ (4/4 بنود مكتملة، في انتظار release)

**1. ✅ Order Workflow Engine + Escrow Countdown** (مكتمل)
- ملف جديد `packages/shared-utils/src/workflow-engine.ts` — مرجع وحيد لكل قواعد الـ workflow:
  - `cancellationPolicy(order)` → tier (FREE/10%/DISPUTE_ONLY/NOT_ALLOWED) + breakdown
  - `escrowBreakdown(total)` → split (8% عمولة + 92% لمقدّم الخدمة)
  - `escrowAutoReleaseAt(deliveredAt)` + `escrowMsRemaining()` — لحساب وقت الإفراج التلقائي (72 ساعة)
  - `TRANSITIONS` — جدول الـ state machine الكامل: من→إلى مع الـ actor (CLIENT/PROVIDER/ADMIN/SYSTEM)
  - `canTransition(from, to, actor)` — guard للـ transitions
  - `NOTIFICATION_MATRIX` — 10 أحداث workflow × audiences متعدّدة = ~25 إشعار موصَّف
  - `renderNotification(spec, vars)` — templating بـ `{placeholders}`
- مكوّن `<EscrowCountdown>` في الـ Client app — يُعرض على الطلبات DELIVERED:
  - عدّاد لايف للـ 72 ساعة (HH:MM:SS مع leading zeros)
  - progress bar
  - تاريخ الإفراج المتوقّع
  - تفصيل توزيع المبلغ (إجمالي / عمولة 8% / صافي لمقدّم الخدمة)
  - زر "تأكيد الآن" للإفراج الفوري
- مكوّن مرآة في الـ Provider app — نفس المنطق لكن بصياغة "دفعتك قادمة"
- `CancelOrderDialog` معاد هيكلته ليستخدم `cancellationPolicy()` بدل المنطق الـ inline
- `pnpm tsc --noEmit` يمرّ على الأربعة تطبيقات

**2. ✅ Time Windows + Provider ETA** (مكتمل)
- نوع جديد `PickupWindow = 'MORNING' | 'EVENING' | 'ALL_DAY'` في mock-data + Order interface
- helpers في workflow-engine: `PICKUP_WINDOWS` constant + `pickupWindowLabel(window, locale)` + `estimateDeliveryDate(pickupDate, days, hours)`
- **New Order Wizard** (Client): الـ Step 2 تغيّر:
  - حقل `pickupDate` صار `type="date"` (بدل `datetime-local`)
  - حقل جديد للنافذة الزمنية: صباحاً 🌅 / مساءً 🌇 / طوال اليوم ☀️
  - hint: "مقدّم الخدمة سيؤكّد الوقت الدقيق داخل النافذة عند قبول العرض"
- **Bid form** (Provider opportunity detail):
  - حقل المدة انقسم إلى أيام + ساعات
  - بطاقة جديدة "موعد البدء": زرّان كبيران (أؤكّد الموعد / أقترح موعداً آخر)
  - في حالة الاقتراح: حقل تاريخ بديل
  - معاينة لايف للـ "الإنجاز المتوقّع" تُحسب تلقائياً (pickup + days + hours)
- **Bid comparison** (Client order detail): كل عرض يعرض الآن:
  - 📅 تاريخ البدء (مع badge "معدّل" لو مقدّم الخدمة اقترح موعداً مختلفاً)
  - ⏱ المدة المتوقعة (أيام + ساعات)
  - 📦 تاريخ الإنجاز المتوقّع
- إضافة حقول `estimatedHours`, `proposedPickupDate`, `estimatedDeliveryDate` للـ Bid interface (كلها optional)
- type-check يمرّ على الأربعة تطبيقات

**3. ✅ Same/Inter-City + Leaflet + Nominatim** (مكتمل)
- مكوّن `MapAddressPicker` جديد (`apps/web/client/src/components/`):
  - Wrapper مع `next/dynamic` + `ssr: false` لتجنّب `window is not defined` في الـ SSR
  - Leaflet + react-leaflet (مثبَّت سابقاً)
  - Pin قابل للسحب (drag-to-place) + click-to-place
  - Search input داخلي يستهلك **Nominatim API** (`countrycodes=sa`، `Accept-Language: ar`)
  - Debounce 350ms قبل كل request احتراماً لـ Nominatim TOS (1 req/sec)
  - Dropdown نتائج البحث مع line-clamp
  - Live readout للـ coords (lat, lng) أسفل الخريطة
- نوع جديد `TripType = 'SAME_CITY' | 'INTER_CITY'` في الـ wizard
- **Wizard Step 2** أُعيدت هيكلته بالكامل:
  - بطاقتا اختيار في الأعلى: 🏙️ داخل المدينة / 🛣️ بين المدن
  - **SAME_CITY**: select واحد للمدينة + خريطتان (موقع الاستلام + موقع التسليم) داخل نفس المدينة
  - **INTER_CITY**: selectان للمدينتين + خريطتان لتحديد نقاط دقيقة (اختياري)
  - عند سحب الـ pin → الـ address text field يتحدّث تلقائياً بـ display_name من Nominatim
  - المدن تُجلب من `DEFAULT_CITIES` (15 مدينة سعودية بإحداثيات) — لا hardcoded
- إضافة `originPin: MapPoint | null` + `destinationPin: MapPoint | null` للـ FormState
- `MapPoint` shape: `{ lat: number, lng: number, address: string }`
- helpers RouteMapsBlock لتغليف الـ layout
- type-check يمرّ

**4. ✅ Individual Provider Onboarding** (مكتمل)
- **حال السابق:** flow مقدّم الخدمة الفرد كان موجوداً أصلاً في `apps/web/provider/src/app/register/page.tsx`:
  - `AccountType = 'COMPANY' | 'INDIVIDUAL'` في step 1 (اختيار نوع الحساب)
  - `COMPANY_DOCS` (CR + VAT + Zakat + license + insurance) vs `INDIVIDUAL_DOCS` (national ID + specialty license + insurance + VAT optional)
  - `docsFor(accountType, vatChoice)` helper يعرض القائمة المناسبة
- **ما أُضيف في v0.6.0:**
  - مكوّن `CompliancePanel` جديد في `/admin/settings → tab الامتثال`:
    - قسمان منفصلان جنباً إلى جنب (grid lg:grid-cols-2):
      - 🏢 **متطلبات شركات مقدّمي الخدمات** — CR، Zakat، VAT، license، insurance، articles، bank
      - 👤 **متطلبات مقدّم الخدمة الفرد** — هوية وطنية، شهادة خبرة، صورة شخصية، تأمين، شهادات تخصص
    - CRUD كامل لكل قائمة (add/edit/delete + toggle required)
    - Dialog إضافة/تعديل بحقول: اسم المستند + checkbox "إلزامي"
  - الـ admin يقدر ينظّم متطلبات كل نوع حساب من نفس الصفحة بدون تعديل كود
- استبدلت القائمة القديمة المسطّحة في `/admin/settings → kyc` بالـ `<CompliancePanel />`
- type-check يمرّ

### ✅ v0.6.0 مكتمل (4/4)

### v0.7.0 — PWA ✅ (مكتمل)

**نهج اختير عمداً:** PWA يدوي (بدون `next-pwa`) لتوافق أنظف مع Next.js 14 App Router + لتفادي تبعية build إضافية.

**ما أُنجز على الـ 4 تطبيقات (admin/client/provider/landing):**
- **`public/manifest.webmanifest`** لكل تطبيق — name + short_name + theme (#0A3D3A) + icons + lang/dir
- **`public/icons/`** — `icon-192.svg`, `icon-512.svg`, `apple-touch-icon.svg` (شعار المنصة على خلفية البراند، 3 أحجام)
- **`public/sw.js`** — service worker بسيط:
  - install: pre-cache للشيل (`/offline` + icons + manifest)
  - navigation requests: network-first → `/offline` fallback عند الفشل
  - assets: stale-while-revalidate في runtime cache
- **`<PwaShell>` component** (في components/ لكل تطبيق) يدمج 3 وظائف:
  1. **SW registration** — مؤجَّل لـ `window.load` كي لا ينافس first-paint
  2. **`OnlineStatusBar`** — banner ثابت أعلى الشاشة:
     - 🔴 أحمر عند offline
     - 🟢 أخضر مؤقّت (3 ثوان) عند العودة للاتصال
     - يستخدم `online/offline` window events
  3. **`InstallPrompt`** — bottom-right banner يظهر بعد 30 ثانية:
     - يستهلك `beforeinstallprompt` event
     - 3 مزايا: إشعارات / يعمل بدون إنترنت / وصول سريع
     - زرّان "ثبّت الآن" + "لاحقاً" (مع sessionStorage لتذكّر الرفض)
- **صفحة `/offline`** لكل تطبيق — fallback عند انقطاع الاتصال:
  - بطاقة مركزية مع WifiOff icon
  - زر "إعادة المحاولة" يستدعي `router.refresh()`
- **Layout metadata** لكل تطبيق:
  - `manifest: '/manifest.webmanifest'`
  - `appleWebApp` capable + title
  - `icons` (regular + apple)
  - `Viewport.themeColor: '#0A3D3A'`
- type-check يمرّ على الأربعة + i18n parity 646 مفتاح

**📝 تطوير مستقبلي:**
- استبدال الـ SVG icons بـ PNG حقيقية مولّدة (مثلاً عبر sharp script)
- استبدال الـ SW اليدوي بـ Workbox/serwist عند الحاجة لـ caching strategies أعقد
- ربط Push Notifications API (يتطلّب VAPID keys + endpoint في الـ backend)

---

## [0.5.0] — 2026-05-16 (Foundation: Environments + White Label + Admin Catalogs)

### 🔐 Three Environments + Validation + Backup
- ✅ ملفات بيئة محدّدة لكل مرحلة:
  - `.env.development.example` — تطوير محلي (mock providers، secrets قصيرة)
  - `.env.staging.example` — staging (HTTPS، secrets ≥ 64 char، Sentry مفعّل)
  - `.env.production.example` — production (live providers، MinIO SSL، CORS HTTPS-only)
- ✅ `apps/api/src/config/env.validation.ts` — تحقّق صارم عند الـ bootstrap:
  - وجود المتغيرات المطلوبة (DATABASE_URL، JWT، MinIO، CORS، PORT)
  - NODE_ENV ∈ {development, staging, production, test}
  - JWT secrets ≥ 32 chars (dev) / ≥ 64 chars (prod)، ولا تتطابق في production
  - PAYMENT/SMS providers ∈ القيم المعروفة
  - تشديد production: لا `mock` providers، CORS HTTPS-only، MINIO_USE_SSL=true، SENTRY_DSN إلزامي
  - يفشل عند الـ startup مع رسالة واضحة بكل الأخطاء معاً
- ✅ `ConfigModule.forRoot({ envFilePath: [.env.${NODE_ENV}, .env], validate })` — يحمل ملف البيئة المناسب تلقائياً
- ✅ `scripts/backup-db.sh` — backup يومي قابل للجدولة عبر cron:
  - `pg_dump` → `gzip` → MinIO upload في pipeline واحد
  - retention 30 يوم (قابل للتعديل عبر `BACKUP_RETENTION_DAYS`)
  - namespace بحسب بيئة التشغيل (`nitaq-${NODE_ENV}-${timestamp}.sql.gz`)
  - executable + موثّق
- ✅ `.gitignore` يستثني `.env.development/staging/production` ويسمح فقط بالـ `.example` files

### 🎨 White Label Branding (Logo + Names)
- ✅ تبويب جديد "هوية المنصة" في `/admin/settings`:
  - رفع شعار من الجهاز (PNG / SVG / JPG / WebP، حد أقصى 2MB)
  - أو إدخال رابط URL مباشر
  - معاينة مباشرة للشعار الحالي
  - تعديل اسم المنصة بالعربية والإنجليزية
  - زر إزالة الشعار + استرجاع الافتراضي
- ✅ مكوّن `<Logo>` مشترك في الـ Admin:
  - يقرأ من `usePlatformStore` (localStorage-backed)
  - يعرض الصورة المرفوعة إن وُجدت، وإلا يعود لأيقونة Truck الافتراضية
  - مقاسان: `compact` (36px) و `lg` (44px)
- ✅ Sidebar الـ Admin يستخدم `<Logo>` بدل أيقونة Truck الثابتة، واسم المنصة يُقرأ من الـ store
- ✅ مفاتيح Setting في DB seed: `platform_name_ar/en`, `platform_logo`, `default_locale/direction/currency/timezone/date_format`
- 📝 **TODO (post-launch):** ربط `usePlatformStore` بـ API endpoint يقرأ من `Setting` table بدل localStorage، علشان الشعار ينتشر تلقائياً لكل التطبيقات

### 🏙️ Cities Admin Management
- ✅ تبويب "المدن" في `/admin/settings` — CRUD كامل:
  - جدول: اسم عربي/إنجليزي، المنطقة، الإحداثيات، الحالة (نشطة/موقوفة)
  - Dialog إضافة/تعديل مع validation
  - Toggle مباشر للحالة من الجدول
  - حذف مع dialog تأكيد
  - استرجاع المدن الافتراضية الـ 15
- ✅ `DEFAULT_CITIES` في `shared-utils/mock-data.ts` — 15 مدينة مع إحداثيات WGS-84:
  الرياض، جدة، الدمام، مكة، المدينة، الطائف، أبها، تبوك، الجبيل، ينبع، حائل، القصيم، نجران، الباحة، الجوف
- ✅ Type-safe: `interface City { id, nameAr, nameEn, region, lat, lng, active }`
- ✅ `useCitiesStore` (Zustand + persist) في الـ Admin
- 📝 **TODO (post-launch):** ربط بـ `New Order Wizard` (سيتم في v0.6.0 مع نظام Same/Inter-City)

### 📦 Cargo Types Admin Management
- ✅ تبويب "أنواع البضائع" في `/admin/settings` — CRUD كامل:
  - جدول: emoji + اسم عربي/إنجليزي + flags (تبريد/خطر) + الحالة
  - Dialog إضافة/تعديل مع checkboxes للـ flags
  - أيقونات: Snowflake (أزرق) للتبريد، TriangleAlert (كهرماني) للخطر
- ✅ `DEFAULT_CARGO_TYPES` في `shared-utils/mock-data.ts` — 10 أنواع بحقول غنية:
  بضائع عامة 📦، مواد غذائية 🍎 (تبريد)، إلكترونيات 💻، أثاث 🛋️، مواد بناء 🧱، قطع سيارات 🔧، مستلزمات طبية 💊 (تبريد)، مواد كيميائية 🧪 (خطر)، مواد خطرة ☢️ (خطر)، هشة 🍷
- ✅ Type-safe: `interface CargoTypeDef { id, nameAr, nameEn, icon, requiresRefrigeration, hazardous, active }`
- ✅ ملاحظة تقنية: الـ enum القديم `CargoType` ما زال موجوداً للـ Order schema؛ النظام الجديد للأدمن يستخدم الـ record الأغنى
- 📝 **TODO (post-launch):** ربط بـ `New Order Wizard` (يستهلك من الـ store بدل hardcoded)

### 📨 SMS Templates + /join Activation Page
- ✅ تبويب "قوالب SMS" في `/admin/settings`:
  - جدول قوالب مع: اسم القالب، القناة (SMS/EMAIL/PUSH)، الحالة، المتغيرات
  - Dialog إضافة/تعديل مع:
    - حقول subject (للـ EMAIL فقط)
    - bodyAr + bodyEn (textareas منفصلة)
    - chips للمتغيرات (إضافة عبر Enter، حذف بـ ×)
  - عرض المحتوى بالعربية والإنجليزية جنباً إلى جنب
- ✅ `DEFAULT_SMS_TEMPLATES` — 4 قوالب مُهيَّأة:
  - `team_member_invitation` ← يستهلكه `TeamMembersService.invite()`
  - `otp_verification`
  - `order_published`
  - `bid_accepted`
- ✅ صفحة `/join?token=xxx` في كل من Provider و Client apps:
  - تقرأ token + memberName + companyName + roleName من query string
  - نموذج: كلمة مرور جديدة + تأكيد (≥ 8 أحرف، مع toggle visibility)
  - حالة الخطأ: رمز مفقود، رمز منتهي الصلاحية
  - حالة النجاح: card مع CheckCircle + رابط إلى /login
  - mock activation حالياً، جاهز لربط بـ `POST /auth/activate` لاحقاً
- 📝 **TODO (post-launch):** wire-up مع `tempActivationToken` الذي ينتجه `TeamMembersService` الحالي، وإرسال SMS فعلي عند الإضافة

### 🌍 i18n
- ✅ 100 مفتاح ترجمة جديد (admin + auth namespaces): branding (15)، cities (16)، cargoTypes (18)، smsTemplates (13)، join (15)، tabs (4 إضافية)، +misc
- ✅ الإجمالي: **646 مفتاح × 2 لغة** (من 546)
- ✅ كل الـ panels الجديدة تستخدم `useTranslations()` من البداية (تطبيق القاعدة في v0.4.0)
- ✅ `pnpm check:i18n` يمرّ
- ✅ `tsc --noEmit` يمرّ على الأربعة تطبيقات + API

### 📌 قرار استراتيجي: تأجيل إكمال الإنجليزية إلى ما بعد الإطلاق (2026-05-16)

**الوضع الحالي:**
- البنية التحتية للـ i18n مكتملة ومُختبَرة (next-intl، cookie، server actions، refresh، RTL/LTR).
- المُترجَم فعلياً بـ `t()`: Sidebars (admin + client + carrier) + كل صفحات `/settings` بتبويباتها الأربع + نظام الفريق + اللاندينج (Hero/Features/Pricing/FAQ) + بطاقة `OnboardingLanguagePicker`.
- المتبقّي (سلاسل عربية ثابتة في JSX): ~40-50 صفحة (PageHeaders، أعمدة الجداول، Dialogs، شارات الحالة، Empty states) في `admin`, `client`, `provider`.

**القرار:**
السوق المستهدف للإطلاق عربي (السعودية)، فالأولوية لميزات الأعمال لا لترجمة سلاسل لن يستخدمها أحد قبل أن يأتي عميل دولي. نُطلق بالعربية الكاملة + الإنجليزية الجزئية، ونُكمل الإنجليزية عند الحاجة الفعلية.

**القاعدة الإلزامية لتفادي تراكم الدَين التقني:**
> **أي صفحة أو مكوّن جديد يُكتب من اليوم (2026-05-16 فما بعد) يجب أن يستخدم `useTranslations()` من البداية. ممنوع إضافة سلاسل عربية ثابتة في JSX جديد.**
- المفاتيح تُضاف في `messages/ar/<file>.json` و `messages/en/<file>.json` معاً.
- `pnpm check:i18n` لا بد أن يمرّ قبل كل commit.
- مراجعو الـ PR ملزَمون برفض أي JSX يحتوي على نص عربي مباشر بدلاً من `t('key')`.

**متى نُكمل الإنجليزية في الصفحات القديمة:**
- عند وجود عميل دولي فعلي يطلبها.
- عند توسّع لسوق غير عربي (الإمارات، قطر، إلخ).
- عند انضمام شريك/مستثمر أجنبي يحتاج الوصول للوحات.

**التكلفة التقديرية عند الإكمال لاحقاً:** ~3-5 جلسات عمل مركّزة (مع البنية الحالية الناضجة، التحدّي هو الـ JSX فقط لا التصميم).

### 🌍 إصلاحات i18n (متابعة 0.4.0)
- ✅ **إصلاح Bug: تحويل اللغة كان يتطلّب تحديث الصفحة يدوياً** — `<html dir>` و `<html lang>` ما كانا يتحدّثان بعد كتابة الـ cookie لأن `revalidatePath` وحده لا يجبر إعادة تنفيذ الـ Server Components.
  - الحل: استدعاء `router.refresh()` من `next/navigation` بعد `setLocaleAction`
  - الملفات المعدّلة (6):
    - `apps/web/admin/src/components/language-selector.tsx`
    - `apps/web/client/src/components/language-selector.tsx`
    - `apps/web/provider/src/components/language-selector.tsx`
    - `apps/web/client/src/components/onboarding-language-picker.tsx`
    - `apps/web/provider/src/components/onboarding-language-picker.tsx`
    - `apps/web/landing/src/components/locale-switcher.tsx` (يستخدم `nextRouter.refresh()` بعد `router.replace`)
- ✅ **ترجمة الـ Sidebars الثلاثة فعلياً عبر `useTranslations()`** — قبل ذلك كانت السلاسل مكتوبة بالعربية مباشرةً في الـ JSX رغم وجود مفاتيح الترجمة في `messages/`.
  - `apps/web/admin/src/components/app-sidebar.tsx` — 6 مجموعات × 18 رابط، اسم التطبيق، شارة "قريباً"
  - `apps/web/provider/src/components/app-sidebar.tsx` — 5 مجموعات × 14 رابط
  - `apps/web/client/src/components/app-sidebar.tsx` — 4 مجموعات × 10 روابط
  - النمط: `NAV` يستخدم `titleKey`/`labelKey` ثم الـ JSX يحلّ القيم عبر `` t(`groups.${titleKey}`) `` و `` t(`nav.${labelKey}`) ``
- ✅ مفاتيح جديدة (3): `common.comingSoon`، `provider.nav.settings`، `client.nav.settings` → الإجمالي **546 مفتاحاً** × 2 لغة
- ✅ `pnpm check:i18n` يمرّ

### يُكمل لاحقاً
- [ ] 2FA للأدمن (TOTP + backup codes)
- [ ] Column-level encryption (pgcrypto) للحقول الحساسة (IBAN، الهوية)
- [ ] Sentry + UptimeRobot integration
- [ ] Executive Dashboard + Investor PDF export
- [ ] Production Docker images + Coolify deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] E2E tests (Playwright)
- [ ] CSRF tokens للـ same-site flows
- [ ] Common-passwords blocklist (HIBP API)
- [ ] استكمال t() في باقي الصفحات (PageHeaders + الجداول + اللاندينج) — الحالي: البنية + اللغة + Sidebars + Settings + Team
- [ ] DIRECT workflow: state machine في الـ backend (الحالي: UI كامل + mock state)
- [ ] إرسال SMS فعلي للأعضاء الجدد (الحالي: stub via OtpService)

---

## [0.4.0] — 2026-05-16 (Team Members + Settings Refactor)

### 🏗️ إعادة هيكلة الإعدادات
- ✅ تغيير المسارات:
  - `/client/company` → **`/client/settings`** (Sidebar: "إعدادات الشركة" مع أيقونة Settings)
  - `/provider/company` → **`/provider/settings`** (Sidebar: "إعدادات الشركة" مع أيقونة Settings)
- ✅ تصميم بـ **4 تبويبات** (بدلاً من Sections):
  - **بيانات الشركة** (Company Info) — كل الحقول + ملخص النشاط
  - **الفريق** (Team) — جديد، كامل CRUD
  - **الإعدادات** (Preferences) — اللغة وتفضيلات العرض
  - **المستندات** (KYC Documents)
- ✅ الصفحات الجديدة مترجمة 100% عبر `useTranslations('settings')` ← `messages/{ar,en}/settings.json` (75 مفتاحاً جديداً، إجمالي 11 ملف × 2 لغة = 543 مفتاحاً)

### 👥 نظام أعضاء الفريق (Team Members)

#### طبقة البيانات (`shared-utils/mock-data.ts`)
- `CompanyRole` — `OWNER | ADMIN | STAFF | DISPATCH | FINANCE`
- `TeamMember` type + `TeamMemberStatus` (`ACTIVE | SUSPENDED | PENDING_ACTIVATION`)
- **Permissions matrix** — مصدر الحقيقة الواحد:
  - `CLIENT_ROLE_PERMISSIONS` (للعملاء): OWNER / ADMIN / STAFF / FINANCE
  - `PROVIDER_ROLE_PERMISSIONS` (لمقدّمي الخدمات): OWNER / ADMIN / DISPATCH / FINANCE
- لكل دور: `can[]` + `cannot[]` (تُعرض كقائمتين في بطاقات الأدوار)
- Seed: 10 أعضاء (5 لـ CL-1001 + 5 لـ CR-2001) بحالات/أدوار متنوعة
- Helpers: `teamMembersFor`, `memberById`, `permissionsFor`, `availableRolesFor`

#### واجهة الفريق (Client + Provider)
- ✅ **قائمة الأعضاء** كجدول: avatar، اسم، جوال، إيميل، الدور (badge ملوّن)، الحالة، تاريخ الإضافة
- ✅ شارة `Crown` 👑 للمالك + حماية: لا يمكن حذف/تعديل المالك
- ✅ **زر إضافة عضو** يفتح Dialog كبير مع:
  - الاسم + الجوال (إلزامي) + الإيميل (اختياري)
  - **Radio cards للأدوار**: لكل دور بطاقة كاملة بـ icon + label + قائمة `can` (✓) + قائمة `cannot` (✗)
  - تنبيه "سيُرسل SMS للعضو" أسفل الـ Dialog
- ✅ Dropdown إجراءات على كل صف: تعديل الدور / إيقاف / تنشيط / حذف
- ✅ **Guard على مستوى الـ UI**: إذا الـ currentRole ≠ OWNER/ADMIN → رسالة "ليس لديك صلاحية"

#### في لوحة الأدمن (`/companies/[id]`)
- ✅ قسم Team جديد read-only (لا إضافة، فقط suspend/remove)
- ✅ يعرض كل عضو مع: avatar، اسم، جوال، إيميل، دور (badge)، الـ permissions الأربعة الأولى تحت كل صف
- ✅ Dropdown actions: Suspend / Activate / Remove
- ✅ المالك محمي بالكامل (لا تظهر له dropdown)

### 🛢️ Backend — Team Members API

#### Prisma
- ✅ `enum CompanyRole` جديد في schema
- ✅ `User.companyRole CompanyRole @default(STAFF)`
- ✅ Migration: `20260516180000_add_company_role`

#### Endpoints (`/api/companies/:id/members/...`)
- ✅ `GET    /:id/members` — قائمة الفريق (Manager only)
- ✅ `POST   /:id/members` — دعوة عضو جديد (Manager only)
- ✅ `PUT    /:id/members/:userId` — تعديل الدور أو الحالة
- ✅ `DELETE /:id/members/:userId` — إزالة من الفريق

#### Rules مُنفّذة في `TeamMembersService`
- ✅ المالك لا يمكن حذفه ولا تغيير دوره (`OWNER_PROTECTED`)
- ✅ المستخدم لا يمكنه تعديل/حذف نفسه (`SELF_MODIFY_DENIED`)
- ✅ فقط OWNER + ADMIN يديرون الفريق (`INSUFFICIENT_COMPANY_ROLE`)
- ✅ Manager لا يدير شركة أخرى (`WRONG_COMPANY`)
- ✅ عند الدعوة: يُرسَل SMS للعضو (best-effort عبر `OtpService`)
- ✅ كل إجراء يُسجَّل في AuditLog: `team.invite`, `team.update`, `team.remove`

#### الـ Guard على مستوى الـ Route
- ✅ `CompanyRoleGuard` + `@CompanyRoles(...)` decorator
- ✅ `JwtAuthGuard` محدّث ليُضمّن `companyRole` في `req.user`
- ✅ JWT payload الآن يحتوي `companyRole` (تُصدَر في `auth.service.issueTokens`)
- ✅ المؤسّس (founder) يُسجَّل كـ `OWNER` تلقائياً عند `register`

### 🌍 i18n — مفاتيح جديدة
- ✅ ملف `messages/{ar,en}/settings.json` بـ 75 مفتاحاً يشمل:
  - `title`, `subtitle`, `tabs.*` (company/team/settings/kyc)
  - `company.*` (info, fields, badges)
  - `team.*` (title, addMember, fields, roles, permissions, actions, dialogs)
  - `team.roles.{OWNER,ADMIN,STAFF,DISPATCH,FINANCE}.{label,icon,description}`
  - `preferences.*`
  - `kyc.*`

### 📚 Documentation
- ✅ `README.md` — قسم Team Roles في Features
- ✅ `docs/ARCHITECTURE.md` — قسم 12 (Team & Roles System) كامل بـ permissions matrix
- ✅ `docs/API.md` — endpoints الفريق
- ✅ `GETTING_STARTED.md` — شرح نظام الأدوار + كيف يُضيف الـ Owner أعضاء

### 📌 ملاحظات

> هذا الإصدار **لا يحوي** هجرة كاملة للترجمة على كل الـ ~50 صفحة الموجودة. التركيز كان على:
> 1. كل المحتوى **الجديد** في v0.4.0 (Settings + Team) → مترجم 100% عبر `t()`
> 2. الـ Sidebars + المكوّنات المشتركة → مترجمة (من v0.3.0)
> 3. الصفحات القديمة (Orders, Fleet, Payments, ...) ما زالت بنصوص عربية ثابتة — الـ infrastructure مهيّأة، الاستبدال تدريجي.

---

## [0.3.0] — 2026-05-16 (Multilingual — i18n)

### 🌍 Stack
- ✅ **next-intl v3.20.0** مُثبّت في كل التطبيقات الأربعة
- ✅ **لغتان مدعومتان**: `ar` (افتراضية، RTL) + `en` (LTR)
- ✅ **10 ملفات ترجمة لكل لغة** = **468 مفتاحاً** كاملاً في اللغتين

### 📁 ملفات الترجمة
- `messages/ar/*.json` + `messages/en/*.json` على الـ root + منسوخة لكل تطبيق
- الفئات: `common`, `auth`, `orders`, `services`, `payments`, `notifications`, `admin`, `client`, `provider`, `landing`

### 🌐 Landing — URL-based locale
- middleware يعيد توجيه `/` → `/ar` (وفق Accept-Language)
- كل المسارات تحت `app/[locale]/...`: `/ar/about`, `/en/terms`, ...
- `LocaleSwitcher` في navbar — toggle عربي/English بنقرة
- `<html lang>` و `dir` يُحدّدان ديناميكياً بحسب الـ locale
- `localePrefix: 'always'` — كل URL يحتوي على prefix

### 🍪 Admin/Client/Provider — Cookie-based locale
- `nitaq-locale` cookie + Accept-Language fallback
- Server action `setLocaleAction` يحدّث الكوكي + `revalidatePath`
- `LanguageSelector` component في:
  - Admin: `/settings` → تبويب "عامة" → بطاقة "تفضيلات العرض"
  - Client: `/company` → بطاقة "الإعدادات الشخصية"
  - Provider: `/company` → بطاقة "الإعدادات الشخصية"
- **لا switcher في Topbar** (حسب المواصفة)

### 🚀 Onboarding
- `OnboardingLanguagePicker` component في أعلى صفحات `/register`
- بطاقتان 🇸🇦/🇬🇧 يختار المستخدم لغته قبل ملء النموذج
- يُحفظ في الكوكي + (سيُحفظ مستقبلاً في `User.preferredLanguage`)

### 🗄️ Prisma Schema
- ✅ `User.preferredLanguage  String @default("ar")`
- ✅ `Company.defaultLanguage String @default("ar")`
- ✅ Migration: `20260516120000_add_language_preference/migration.sql`

### 🔤 RTL/LTR + Fonts
- Layout كل تطبيق يقرأ `getLocale()` server-side
- `<html lang="{locale}" dir="rtl|ltr">` تلقائياً
- خطوط: Tajawal للعربية + Inter للأرقام والـ Latin
- `NextIntlClientProvider` يلفّ كل التطبيقات

### ✅ Validation Script
- `scripts/check-translations.ts` — يقارن ar/en نمطياً
- يكتشف: مفاتيح مفقودة، ملفات مفقودة، قيم فارغة
- ينتج تقرير + يفشل بـ exit code 1 (CI-friendly)
- يُستدعى بـ `pnpm check:i18n`
- نتيجة الـ run الأول: `✅ 10 file(s), 468 key(s), 2 locales`

### 📦 Dependencies
- `next-intl@3.20.0` في كل التطبيقات الأربعة
- `tsx@^4.7.0` في الـ root devDeps (لتشغيل scripts TS)

### 📌 ملاحظات
- البنية كاملة + كل المكوّنات المشتركة (sidebars/topbars/switchers/onboarding) تعمل بـ `t()`
- استبدال الـ hardcoded strings في كل الـ ~50 صفحة سيكون تدريجياً
- المسارات الموجودة مفتاحياً متطابقة بين اللغتين ولا تتطلّب URL تغيير
- في الإنتاج: server action يجب أن يُحدّث `User.preferredLanguage` في DB أيضاً

### 📚 Documentation
- `README.md` — قسم 🌍 Languages
- `docs/ARCHITECTURE.md` — قسم 11 (Internationalization)
- `GETTING_STARTED.md` — تعليمات إضافية لـ i18n

---

## [0.2.0] — 2026-05-16 (Security Layer)

### 🛡️ Authentication
- ✅ **JWT rotation** على كل refresh مع كشف **replay** تلقائي (سرقة token → revoke كل جلسات المستخدم)
- ✅ **Token blacklist** في Redis بـ `jti` per token + TTL مساوي لعمر الـ token (لا cleanup يدوي)
- ✅ **User-level cutoff** (`revokeAllForUser`) لإنهاء كل الجلسات عند تغيير كلمة المرور أو revoke الأدمن
- ✅ `JwtAuthGuard` يفحص الـ blacklist + الـ cutoff على كل request

### 🔐 Onboarding — Phone-First
- ✅ **رقم الجوال إلزامي** (السعودي `+966 5XX XXXXXXX`) — البريد **اختياري** كلياً
- ✅ **OTP عبر SMS فقط** (6 أرقام، 10 دقائق، single-use، 3 إرسالات / ساعة / رقم)
- ✅ **لا OTP عبر البريد أبداً** — البريد، إن وُجد، لا يُفعَّل بـ OTP
- ✅ **3 checkboxes للموافقة القانونية** إلزامية في الـ DTO (terms/privacy/transport)
- ✅ تسجيل الموافقة في AuditLog مع IP + User-Agent
- ✅ Strong password validator: 8+ chars، upper، lower، digit، symbol — رسائل خطأ عربية مفصّلة

### 👮 Admin Authentication المنفصلة
- ✅ نقطة دخول مستقلة `POST /api/admin/auth/login`
- ✅ **email + password فقط** (لا OTP/SMS)
- ✅ يقبل فقط الأدوار `ADMIN` / `SUPER_ADMIN`
- ✅ المستخدم العادي يحاول دخول حساب أدمن من `/api/auth/login` → يُرفض بـ `USE_ADMIN_LOGIN` (يمنع leak)
- ✅ token يحمل `isAdmin: true` flag للـ frontend

### 🚦 Rate Limiting
- ✅ Global: **100 request / دقيقة / IP** (ThrottlerGuard)
- ✅ Per-endpoint (`@Throttle` decorator):
  - `POST /auth/login`: **5 / 15 دقيقة**
  - `POST /auth/register`: **3 / ساعة**
  - `POST /auth/send-otp`: **3 / ساعة**
  - `POST /auth/verify-phone`: **10 / ساعة**
  - `POST /admin/auth/login`: **5 / 30 دقيقة**
  - `POST /uploads/presign`: **10 / دقيقة**
- ✅ **Login lockout** (Redis-backed، per-identifier):
  - User: 5 محاولات → **15 دقيقة block**
  - Admin: 5 محاولات → **30 دقيقة block**

### 🛡️ Helmet + Security Headers
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Strict-Transport-Security` (production فقط، 1 سنة + preload + includeSubDomains)
- ✅ `Content-Security-Policy` صارمة في production
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Cross-Origin-Opener-Policy: same-origin`

### 🌐 CORS Allowlist
- ✅ **لا wildcard `*` أبداً**
- ✅ مسموح: `localhost:{3000,3001,3002,3003}` + `nitaq.sa` + `*.nitaq.sa` (https فقط في production)
- ✅ env `CORS_ORIGINS` لإضافة origins موثوقة
- ✅ origin محظور → console warning + رفض الـ preflight

### ✅ ValidationPipe Global
- ✅ `whitelist: true` — حذف الحقول غير المعرّفة
- ✅ `forbidNonWhitelisted: true` — رفض حقول إضافية
- ✅ `transform: true` + `enableImplicitConversion`
- ✅ `stopAtFirstError: false` — كل الأخطاء في رسالة واحدة

### 📁 File Upload Validation
- ✅ Magic bytes check لـ: **JPG, JPEG, PNG, PDF, XLSX**
- ✅ حد أقصى: **10 MB** (`MAX_UPLOAD_BYTES`)
- ✅ MIME validation عند الـ presign + Magic bytes verification بعد الرفع
- ✅ Filename sanitization (`[^\w.\-]` → `_`)
- ✅ Bucket private بصلاحية presigned URL 5 دقائق فقط

### 📝 Audit Logs الموسّع
- ✅ `AuditLogService` + `AuditInterceptor` + `@Audit()` decorator
- ✅ تسجيل تلقائي لكل: userId، action، resourceType، resourceId، ipAddress، userAgent، metadata (مع redaction للـ password/token/otp/secret/apiKey)
- ✅ مُطبّق على: **register, login, logout, refresh, replay detection** + **order create/publish/assign/confirm/cancel** + **payment.release** + **kyc.submit/review** + **admin.company.status_change, admin.dispute.update, admin.settings.update** + **upload.presign** + **user.profile.update** + **pdpl.export/delete**

### 🇸🇦 PDPL Compliance
- ✅ **Right to access** — `POST /api/users/me/export` يُرجع JSON كامل (شخصي + شركة + KYC + إشعارات + audit log)
- ✅ **Right to erasure** — `DELETE /api/users/me`:
  - soft delete + anonymisation (الاسم → "حساب محذوف"، البريد → null، الهاتف → masked)
  - revoke كل refresh tokens + user cutoff في Redis
  - يرفض الحذف لو فيه طلبات نشطة (PUBLISHED → IN_TRANSIT)
  - السجلات المالية تبقى 7 سنوات (متطلب الزكاة والضريبة)
  - تسجيل في AuditLog
- ✅ **Consent recording** — موافقات Terms/Privacy/Transport محفوظة مع IP والوقت

### 🏗️ Infrastructure
- ✅ `RedisModule` global (lazy connect، retry strategy، graceful shutdown)
- ✅ `AuditModule` global
- ✅ Swagger يُعطَّل في production
- ✅ Bootstrap message: `🛡 Security: helmet ✓  CORS allowlist ✓  validation ✓  audit ✓`

### 📚 Documentation
- ✅ `docs/SECURITY.md` مُعاد كتابته بالكامل بـ 12 قسم + جداول + روابط للملفات الفعلية
- ✅ `docs/ARCHITECTURE.md` — قسم Security محدّث ليعكس ما طُبّق

---

## [0.1.0] — 2026-05-16 (الإصدار التأسيسي)

### 🏗️ البنية التحتية والـ Monorepo
- ✅ إعداد Monorepo بـ **pnpm workspaces** + **Turbo** orchestration
- ✅ 4 تطبيقات Next.js منفصلة (Landing/Admin/Client/Provider) + API واحد
- ✅ 3 packages مشتركة (`shared-types`, `shared-ui`, `shared-utils`)
- ✅ Docker Compose للبنية التحتية المحلية (Postgres 16 + Redis 7 + MinIO)
- ✅ TypeScript 5 موحّد + ESLint + Prettier

### 🔧 Backend (NestJS)
- ✅ **NestJS 10** + Prisma 5 ORM
- ✅ **Prisma schema** — 21 model + 13 enum:
  - **Users & Companies**: `User`, `Company`, `KYCDocument`, `EmployeeProfile`
  - **Services**: `Service`
  - **Orders**: `Order`, `Bid`, `OrderService`, `OrderEmployee`
  - **Tracking**: `TrackingEvent`, `LocationHistory`
  - **Finance**: `Payment`, `Transaction`, `Invoice`
  - **Disputes & Reviews**: `Dispute`, `Review`
  - **System**: `Notification`, `AuditLog`, `RefreshToken`, `ApiKey`, `Setting`
- ✅ **13 module** في NestJS: `auth`, `users`, `companies`, `orders`, `bids`, `services`, `payments`, `invoices`, `notifications`, `admin`, `tracking`, `uploads`, `realtime`
- ✅ **Authentication** — JWT (access + refresh tokens) + OTP (phone verification)
- ✅ **Swagger / OpenAPI** docs على `/docs`
- ✅ **Throttling** الافتراضي (100 req/min)
- ✅ Helmet + Compression + Cookie-parser

### 🎨 Design System
- ✅ **shadcn/ui** مثبّت محلياً في كل تطبيق (Card, Dialog, Sheet, Select, Tabs, Avatar, Badge, Button, Input, Switch, Table, Toast, Dropdown, Form, Label, Separator, Textarea)
- ✅ HSL CSS variables — light + dark mode في كل التطبيقات
- ✅ Tailwind tokens مخصّصة (primary `#0A3D3A`, mint `#00C9A7`, gold `#F0C040`)
- ✅ خطوط **Tajawal** (عربي) + **Inter** (أرقام)
- ✅ RTL كامل + `dir="rtl"` على `<html>`

### 🌍 الواجهات الأربع
- ✅ **Landing** — Hero, Features, How-it-works, Testimonials, Footer + روابط قانونية
- ✅ **Admin Dashboard** — 17 صفحة (لوحة، شركات، KYC، طلبات، نزاعات، خدمات، موظفون، مدفوعات، محافظ، تقارير، دعم، إشعارات، Promotions، Audit، إعدادات، Legal، SEO)
- ✅ **Client App** — 10 صفحات (لوحة، طلبات + new + detail، تتبع، عناوين، مالية، فواتير، نزاعات، دعم، شركة)
- ✅ **Provider App** — 14 صفحة (لوحة، فرص، طلبات، عروض، خدمات، موظفون، إضافة خدمة + detail، أرباح، مالية، تقارير، وثائق، نزاعات، دعم، شركة)

### 🔐 Authentication & Onboarding
- ✅ صفحات Login لكل دور (3 صفحات)
- ✅ **Client Registration Wizard** — 4-5 خطوات (نوع الحساب، أساسيات، شركة، تحقّق OTP، تفضيلات + موافقة قانونية)
- ✅ **Provider Registration Wizard** — 6 خطوات (مسؤول، شركة، خدمات، وثائق، حساب بنكي IBAN، تحقّق + موافقة)
- ✅ Password strength meter
- ✅ OTP input (4 digits) مع auto-focus
- ✅ Legal consent (3 checkboxes) قبل إتمام التسجيل
- ✅ تسجيل تاريخ الموافقة + النسخة + الـ IP (placeholder)

### 📦 Orders Workflow الكامل
- ✅ دورة حياة كاملة: `DRAFT → PUBLISHED → BIDDING → ASSIGNED → CONFIRMED → IN_TRANSIT → DELIVERED → COMPLETED`
- ✅ طريقتان للإسناد: **Open Marketplace** + **Direct Request**
- ✅ صفحة إنشاء طلب (نموذج متكامل)
- ✅ صفحة تفاصيل العميل: مقارنة العروض، قبول مع Dialog تأكيد، إلغاء برسوم متدرّجة، تأكيد الإنجاز، فتح نزاع
- ✅ صفحة تفاصيل مقدّم الخدمة: تأكيد البدء، بدء التنفيذ، تحديث الموقع، تأكيد الإنجاز
- ✅ **بطاقة معلومات مقدّم الخدمة** تظهر للعميل عند قبول العرض (الشركة + الخدمة + الموظف + Escrow)
- ✅ **منطق رسوم الإلغاء**:
  - قبل `ASSIGNED` → مجاني
  - بعد `ASSIGNED` وقبل `IN_TRANSIT` → 10%
  - بعد `IN_TRANSIT` → غير مسموح (يجب فتح نزاع)
- ✅ **Timeline أحداث** لكل طلب

### 💰 Bids System
- ✅ Provider opportunities marketplace
- ✅ نموذج تقديم عرض (سعر، مدة، خدمة، ملاحظات)
- ✅ حساب صافي العائد بعد العمولة + VAT تلقائياً
- ✅ سجل العروض لمقدّم الخدمة مع نسبة الفوز
- ✅ Dialog تأكيد قبول العرض من العميل

### 🛠️ Services Management
- ✅ صفحة الخدمات مع البحث والفلترة
- ✅ صفحة إضافة خدمة (Wizard):
  - 8 أنواع خدمات (يديرها الأدمن): CONSULTING, DESIGN, DEVELOPMENT, MAINTENANCE, CLEANING, SECURITY, CATERING, OTHER
  - **معاينة الصورة التوصيفية** للنوع
  - حقول التخصص، الشهادات، التوافر، صور (حتى 5)
- ✅ صفحة تفاصيل الخدمة مع الصورة التوصيفية + سجل الطلبات
- ✅ صفحة الموظفين

### 💼 أنواع الشاحنات (يديرها الأدمن)
- ✅ 8 أنواع افتراضية (فان، صندوقي، مسطح ×2، مبرّد، صهريج، لوبد، حاوية)
- ✅ كل نوع: اسم AR/EN + سعة (كجم) + وصف + صورة + emoji + active flag
- ✅ Admin CRUD في `/settings` → تبويب أنواع الشاحنات
- ✅ **رفع الصورة من الجهاز (Data URL)** أو **رابط خارجي**
- ✅ Drag & drop للملفات + معاينة فورية
- ✅ Zustand store + persist + version migration

### 🏷️ البراندات والموديلات
- ✅ 8 براندات افتراضية (مرسيدس بنز، فولفو، مان، سكانيا، إيفيكو، إيسوزو، هينو، DAF) مع موديلاتها
- ✅ Admin CRUD master-detail
- ✅ يقرأ منها نموذج إضافة الخدمة عند مقدّم الخدمة

### 💸 Wallet System + Escrow
- ✅ 3 محافظ: Admin platform wallet + Client wallet + Provider wallet
- ✅ Transactions seed (إيداع، سحب، Escrow، إفراج، عمولة)
- ✅ صفحة محافظ الشركات للأدمن
- ✅ صفحة Finance للعميل (3 tabs)
- ✅ صفحة Finance + Earnings لمقدّم الخدمة
- ✅ Escrow flow: دفع عند القبول → احتجاز → إفراج عند التسليم

### 🗺️ Maps & Tracking (Leaflet + OpenStreetMap)
- ✅ مكوّن `RouteMap` بـ SSR-safe wrapper (`next/dynamic`)
- ✅ Custom SVG pins (origin أخضر، destination أحمر)
- ✅ خط مسار بين النقطتين
- ✅ مؤشّر progress أثناء الرحلة
- ✅ **15 مدينة سعودية** مع إحداثياتها
- ✅ حساب المسافة (haversine) + مدّة تقديرية + الطريق الرئيسي
- ✅ صفحة Tracking للعميل (قائمة طلبات نشطة + خريطة كبيرة + شارة "مباشر")
- ✅ خرائط في تفاصيل كل طلب (3 تطبيقات)

### 📜 Legal System
- ✅ **3 صفحات قانونية كاملة** (شروط الاستخدام، سياسة الخصوصية، شروط النقل)
- ✅ محتوى متوافق مع الأنظمة السعودية + نظام حماية البيانات
- ✅ Admin Legal Manager (`/legal`) — تحرير Markdown + معاينة + إصدارات + مسودّات
- ✅ Toolbar للـ Markdown (H1/H2/H3, bold, italic, list, link, quote, code)
- ✅ Landing pages: `/terms`, `/privacy`, `/transport`
- ✅ صفحة `/about` (عن المنصة) + `/contact` (تواصل + form + قنوات)
- ✅ Footer محدّث بكل الروابط القانونية
- ✅ Onboarding consent: 3 checkboxes قبل إكمال التسجيل

### ⚖️ Disputes Management
- ✅ نوعا dispute: من العميل / من مقدّم الخدمة
- ✅ صفحة `/disputes` للعميل ومقدّم الخدمة (إنشاء + قائمة)
- ✅ Dialog فتح نزاع مع dropdown أسباب + وصف
- ✅ **صفحة تفاصيل النزاع للأدمن** مع:
  - أطراف النزاع (party cards)
  - Timeline مراسلات + إدخال رد
  - 4 خيارات حل (refund client / pay carrier / split / dismiss)
  - مؤشّر SLA (24 ساعة)
  - تعيين فاحص

### 🔔 Notifications System
- ✅ **NotificationCenter** في topbar كل تطبيق (dropdown مع unread count)
- ✅ صفحة `/notifications` مستقلّة في كل تطبيق
- ✅ نظام providers في الأدمن:
  - **Email** — Resend.com (API key, from email, reply-to, test send)
  - **SMS** — 5 مزوّدين سعوديين/دوليين (Taqnyat, Unifonic, Mobily, mSegat, Twilio)
  - **عام** — rate limit, retry, sandbox mode
- ✅ **25 قالب إشعار قابل للتحرير** يغطّي:
  - OTP & Auth (4): تأكيد بريد، تأكيد جوال، استعادة كلمة مرور، 2FA
  - Client (8): نشر، عرض جديد، تأكيد، استلام، تسليم، فاتورة، فاتورة متأخرة، حل نزاع
  - Carrier (7): فرصة، طلب مباشر، قبول/رفض عرض، إفراج Escrow، KYC، وثيقة منتهية
  - Driver (1): رحلة جديدة
  - Admin (4): KYC جديد، نزاع، تذكرة عاجلة، دفعة متنازع عليها
- ✅ لكل قالب: 3 قنوات (email/sms/inApp) مع توجل لكل قناة
- ✅ Variables placeholder (`{{name}}`, `{{orderNumber}}`, ...) مع أزرار إدراج
- ✅ معاينة حيّة لكل قناة (email card / SMS bubble / in-app notification)
- ✅ عدّاد أحرف SMS (تنبيه عند تجاوز 160)

### 🔍 SEO Admin Panel
- ✅ صفحة `/seo` بـ 5 تبويبات:
  - **عام**: title, description, keywords, canonical, robots
  - **Open Graph + Twitter**: OG image, twitter handle, theme color + معاينة بطاقة
  - **Structured**: organization JSON-LD
  - **Verification**: Google Search Console, Bing, GA, Meta Pixel
  - **SERP Preview**: معاينة Google + 4 score cards

### 🛡️ KYC & Compliance
- ✅ صفحة `/kyc` للأدمن — طابور اعتماد الشركات
- ✅ Dialog مراجعة مع 5 مستندات مطلوبة (CR, Zakat, VAT, تأمين، رخصة نقل)
- ✅ اعتماد / رفض مع سبب
- ✅ صفحة Documents للناقل — 6 أنواع مستندات + حالات (سارية/تنتهي قريباً/منتهية/مفقودة)

### 📊 Reports & Analytics
- ✅ **Admin Reports** — GMV, عمولات, VAT, طلبات (7 أيام), أعلى ناقلين, أكثر مسارات
- ✅ **Carrier Reports** — إيراد شهري, نسبة فوز, استخدام الأسطول, أعلى مسارات, أفضل سائقين

### 🎟️ Support Tickets
- ✅ صفحات `/support` في الـ3 تطبيقات
- ✅ Admin inbox مع filters (status, priority, category)
- ✅ Client/Carrier: تذاكر شخصية + قنوات تواصل + FAQ

### 📋 Audit Log
- ✅ صفحة `/audit` للأدمن
- ✅ Timeline لكل الإجراءات الحسّاسة (KYC, Payment, Settings, Auth, Dispute, ...)
- ✅ تصفية بالفئة والـ actor

### 🎁 Promotions
- ✅ صفحة `/promotions` للأدمن
- ✅ 3 أنواع: نسبة خصم / مبلغ ثابت / إعفاء عمولة
- ✅ نسخ الكود بنقرة + شريط progress للاستخدام

### ⚡ Realtime (Socket.io)
- ✅ Realtime module في الـ API
- ✅ بنية الـ events جاهزة (سيتم تفعيل WebSocket clients في الـ frontends لاحقاً)

### 🐛 Error Pages
- ✅ `not-found.tsx` (404) + `error.tsx` (500) في كل التطبيقات الأربعة
- ✅ زر إعادة المحاولة + رابط الرئيسية + عرض digest للخطأ

### 🧪 Mock Data Layer
- ✅ `packages/shared-utils/src/mock-data.ts` — أكثر من **30 entity** مع seed كامل:
  - Companies (10), Orders (15+), Bids, Trucks, Drivers
  - Payments, Invoices, Disputes, Wallets, Transactions
  - Notifications (3 audiences), Tickets (7), Audit Events (10)
  - Saved Addresses, Carrier Docs, Promotions
  - Truck Brands (8) + Models (~25), Truck Types (8)
  - Legal Documents (3), SEO Config, Notification Templates (25)
- ✅ Helpers جاهزة: `companyById`, `bidsForOrder`, `ordersForClient`, `ticketsFor`, إلخ

### 🔧 إصلاحات بصرية وتقنية
- ✅ إصلاح RTL في توسيط الـ Dialog (`start-1/2` → `left-1/2`)
- ✅ خلفية متدرّجة (slate gradient) لعرض الـ PNGs الشفافة للشاحنات
- ✅ `drop-shadow` للصور لإعطاء حس عمق
- ✅ Persist version migration للـ stores عند تحديث الـ seed

---

## نسق هذا الـ Changelog

- 📋 كل إصدار يُدرج بـ `[Major.Minor.Patch]` + التاريخ
- 🏷️ التصنيفات: `Added` (جديد), `Changed` (تغيير), `Deprecated`, `Removed`, `Fixed`, `Security`
- 🔗 يُربط كل إصدار بـ tag على Git عند الإصدار الرسمي
