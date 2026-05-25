# 🏛️ Architecture — نقلة لوجيستك

البنية التقنية الكاملة للمنصة: Monorepo، Services، قاعدة البيانات، Realtime، وWorkflows.

---

## 1. نظرة عامة

```
┌──────────────────────────────────────────────────────────────────┐
│                         العميل النهائي                            │
│  Landing  │   Admin   │   Client   │   Carrier   │   Mobile (TBD) │
│  :3000    │   :3001   │   :3002    │   :3003     │                │
└──────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS / WSS
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NestJS API Gateway (:4000)                    │
│                                                                  │
│  Auth · Users · Companies · Orders · Bids · Fleet · Payments    │
│  Invoices · Notifications · Admin · Tracking · Uploads · RT      │
└──────────────────────────────────────────────────────────────────┘
        │                │              │             │
        ▼                ▼              ▼             ▼
   ┌────────┐      ┌─────────┐    ┌──────────┐  ┌──────────┐
   │Postgres│      │  Redis  │    │  MinIO   │  │ External │
   │ :5432  │      │  :6379  │    │  :9000   │  │ Providers│
   │        │      │         │    │          │  │ Resend   │
   │ Prisma │      │ Cache + │    │ KYC docs │  │ SMS APIs │
   └────────┘      │ Throttle│    │ Images   │  └──────────┘
                   └─────────┘    └──────────┘
```

---

## 2. Monorepo Structure

```
naqla-platform/
│
├── apps/                                  # تطبيقات قابلة للنشر
│   ├── api/                               # NestJS Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma              # 21 model + 13 enum
│   │   │   └── seed.ts                    # بيانات seed
│   │   ├── src/
│   │   │   ├── common/                    # Guards, filters, interceptors, Prisma module
│   │   │   ├── modules/                   # 13 module
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── companies/
│   │   │   │   ├── orders/
│   │   │   │   ├── bids/
│   │   │   │   ├── fleet/
│   │   │   │   ├── payments/
│   │   │   │   ├── invoices/
│   │   │   │   ├── notifications/
│   │   │   │   ├── admin/
│   │   │   │   ├── tracking/
│   │   │   │   ├── uploads/
│   │   │   │   └── realtime/              # Socket.io gateway
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                               # 4 Next.js apps
│       ├── landing/                       # :3000 — تسويقية + قانونية
│       ├── admin/                         # :3001 — لوحة الأدمن
│       ├── client/                        # :3002 — تطبيق العميل
│       └── carrier/                       # :3003 — تطبيق الناقل
│
├── packages/                              # مكتبات مشتركة (workspace:*)
│   ├── shared-types/                      # TypeScript types
│   ├── shared-ui/                         # UI primitives (legacy)
│   └── shared-utils/                      # Mock data + helpers
│
├── docker/                                # Postgres init scripts + configs
├── docs/                                  # هذه الوثائق
├── docker-compose.yml                     # تطوير محلي
├── docker-compose.production.yml          # نشر
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## 3. Services & Modules

### 3.1 API Modules (NestJS)

| Module | Path | الغرض |
|---|---|---|
| **Auth** | `modules/auth` | تسجيل، دخول، تحديث Token، OTP عبر SMS، Refresh tokens |
| **Users** | `modules/users` | بروفايل المستخدم، تحديثه، Avatar |
| **Companies** | `modules/companies` | شركات العملاء والناقلين، KYC، اعتماد |
| **Orders** | `modules/orders` | إنشاء، نشر، تأكيد، إلغاء، تحديث حالة |
| **Bids** | `modules/bids` | تقديم عرض، قبول، رفض، سحب |
| **Fleet** | `modules/fleet` | شاحنات، سائقين، تحديث موقع |
| **Payments** | `modules/payments` | Escrow، تحويلات، إفراج، عمولات |
| **Invoices** | `modules/invoices` | إصدار فواتير، تتبّع، export |
| **Notifications** | `modules/notifications` | إرسال multi-channel، قوالب |
| **Admin** | `modules/admin` | dashboards، KYC queue، disputes، settings |
| **Tracking** | `modules/tracking` | location updates، history |
| **Uploads** | `modules/uploads` | presigned URLs لـ MinIO |
| **Realtime** | `modules/realtime` | Socket.io gateway للأحداث اللحظية |

### 3.2 Web Apps

| التطبيق | Port | Sidebar Sections | الصفحات |
|---|---|---|---|
| **Landing** | :3000 | — | `/`, `/about`, `/contact`, `/terms`, `/privacy`, `/transport`, `/login`, `/register` |
| **Admin** | :3001 | إدارة · الأسطول · المالية · النظام · القانوني · الإعدادات | 17 صفحة |
| **Client** | :3002 | منصة العميل · المالية · الدعم · الإعدادات | 10 صفحات |
| **Carrier** | :3003 | الناقل · الأسطول · المالية · الامتثال · الإعدادات | 14 صفحة |

### 3.3 Infrastructure Services

| الخدمة | الصورة | Port | الغرض |
|---|---|---|---|
| **PostgreSQL** | `postgres:16-alpine` | 5432 | DB الرئيسي |
| **Redis** | `redis:7-alpine` | 6379 | Cache + sessions + rate-limit (LRU 256MB) |
| **MinIO** | `minio/minio:latest` | 9000 / 9001 | S3-compatible storage |

---

## 4. قاعدة البيانات (Prisma Schema)

### 4.1 Models (21)

#### 👤 Users & Companies
- **`User`** — حسابات المستخدمين (admin/client/carrier/driver)
- **`Company`** — كيانات الشركات (عميل أو ناقل)
- **`KYCDocument`** — مستندات الاعتماد (CR/VAT/Zakat/تأمين/رخصة نقل)
- **`DriverProfile`** — بيانات السائقين (رخصة، حالة، تعيينات)
- **`RefreshToken`** — refresh tokens للـ JWT
- **`ApiKey`** — مفاتيح API لـ integrations مستقبلية

#### 🚚 Fleet
- **`Truck`** — الشاحنات (plate, type, capacity, status)

#### 📦 Orders & Bids
- **`Order`** — الطلبات (mode: OPEN/DIRECT، 9 حالات)
- **`Bid`** — العروض (price, days, notes, status)
- **`OrderTruck`** — ربط الشاحنة بالطلب
- **`OrderDriver`** — ربط السائق بالطلب

#### 📍 Tracking
- **`TrackingEvent`** — events الـ Timeline لكل طلب
- **`LocationHistory`** — تاريخ المواقع للشاحنات

#### 💰 Finance
- **`Payment`** — مدفوعات (Escrow states)
- **`Transaction`** — ledger entries للمحافظ
- **`Invoice`** — فواتير العميل

#### ⚖️ Disputes & Reviews
- **`Dispute`** — نزاعات (raisedBy CLIENT/CARRIER)
- **`Review`** — تقييمات بعد التسليم

#### 🔔 System
- **`Notification`** — إشعارات in-app
- **`AuditLog`** — سجل التدقيق
- **`Setting`** — إعدادات platform-wide

### 4.2 Enums (13)
`UserRole`, `CompanyType`, `CompanyStatus`, `KYCStatus`, `OrderStatus`, `TruckType`, `CargoType`, `BidStatus`, `PaymentStatus`, `InvoiceStatus`, `NotificationType`, `DisputeStatus`, `DriverStatus`

### 4.3 العلاقات الرئيسية (ER Summary)

```
User ──1:1── Company           # كل مستخدم ينتمي لشركة
Company ──1:N── KYCDocument
Company (carrier) ──1:N── Truck
Company (carrier) ──1:N── DriverProfile
Company (client) ──1:N── Order
Order ──N:1── Company (carrier, optional)
Order ──1:N── Bid
Order ──1:N── TrackingEvent
Order ──1:1── Payment
Order ──1:1── Invoice
Order ──1:N── Dispute
Truck ──1:N── LocationHistory
User ──1:N── Notification
User ──1:N── AuditLog
```

---

## 5. الـ Workflow الكامل للطلب

### 5.1 دورة حياة الطلب

```
[العميل]
    │
    ├─ ينشئ طلب → DRAFT
    │
    ├─ ينشره
    │   ├─ OPEN mode      → PUBLISHED → BIDDING
    │   └─ DIRECT mode    → PUBLISHED (مرسل لناقل محدد)
    │
[الناقلون]
    │
    ├─ يقدّمون عروض على OPEN orders
    │
[العميل]
    │
    ├─ يقارن العروض ويختار → ASSIGNED
    │   (باقي العروض REJECTED تلقائياً + Escrow حجز)
    │
[الناقل]
    │
    ├─ يؤكّد الجاهزية → CONFIRMED
    ├─ يبدأ التحميل → IN_TRANSIT
    │   (تتبع لحظي عبر Socket.io)
    ├─ يصل ويسلّم → DELIVERED
    │
[العميل]
    │
    ├─ يؤكّد الاستلام → COMPLETED
    │   (Escrow released → carrier wallet -عمولة -VAT)
    │
    OR
    │
    ├─ يفتح نزاع → DISPUTED → admin intervention
```

### 5.2 منطق رسوم الإلغاء

| الحالة | إلغاء العميل | إلغاء الناقل |
|---|---|---|
| `DRAFT`, `PUBLISHED`, `BIDDING` | مجاني | — |
| `ASSIGNED`, `CONFIRMED` | **رسوم 10%** للناقل | غرامة على تقييمه |
| `IN_TRANSIT` | غير مسموح → فتح نزاع | غير مسموح |
| `DELIVERED+` | غير مسموح | غير مسموح |

### 5.3 منطق Escrow

```
1. عميل يقبل عرض
   └─ يُحجز السعر الكامل في platform wallet (Escrow)

2. الناقل يسلّم
   └─ status = DELIVERED

3. العميل يؤكّد (أو 72 ساعة تمر)
   ├─ المنصة تخصم 8% عمولة
   ├─ تُحوّل (92% - VAT على العمولة) لمحفظة الناقل
   ├─ تُصدر فاتورة للعميل
   └─ Status = COMPLETED

4. الناقل يطلب سحب رصيد محفظته
   └─ الأدمن يعتمد التحويل البنكي للـ IBAN المسجّل
```

### 5.4 منطق التعويض (Compensation)

| الحالة | التعويض |
|---|---|
| تأخر الناقل > 4 ساعات عن موعد الاستلام | 5% خصم تلقائي للعميل |
| تلف البضاعة | نزاع → admin يقرّر النسبة |
| إلغاء الناقل بعد التأكيد | استرداد كامل + غرامة على الناقل |
| إلغاء العميل بعد ASSIGNED | 10% للناقل |

### 5.5 Workflow Engine ✅ مُطبَّق (v0.6.0)

كل قواعد الـ workflow في ملف واحد: **`packages/shared-utils/src/workflow-engine.ts`**. أي UI surface (client/carrier/admin) يستهلك الـ helpers بدل ما يعيد كتابة المنطق.

```ts
// Cancellation
cancellationPolicy(order)
  → { tier: 'FREE' | 'FEE_10_PERCENT' | 'DISPUTE_ONLY' | 'NOT_ALLOWED',
      feeRate, feeAmount, refundAmount, blockedReason?, suggestDispute }

// Escrow
escrowBreakdown(total)             → { total, commission, carrierAmount }
escrowAutoReleaseAt(deliveredAt)   → Date (72h ahead) | null
escrowMsRemaining(deliveredAt)     → number | null  (للـ live countdown)

// Constants
COMMISSION_RATE = 0.08             // 8%
ESCROW_AUTO_RELEASE_HOURS = 72     // 3 أيام

// State machine
TRANSITIONS[status]                → [{ to, actor }, ...]
canTransition(from, to, actor)     → boolean
```

**Notification Matrix** (10 أحداث × audiences متعدّدة):

| Event | Audiences | عدد الإشعارات |
|---|---|---|
| `ORDER_PUBLISHED` | carrier | 1 |
| `BID_SUBMITTED` | client | 1 |
| `BID_ACCEPTED` | carrier (winner+losers), admin | 3 |
| `ORDER_CONFIRMED` | client, admin | 2 |
| `ORDER_IN_TRANSIT` | client | 1 |
| `ORDER_DELIVERED` | client, admin | 2 |
| `ESCROW_RELEASED` | carrier, client | 2 |
| `ORDER_CANCELLED` | client, carrier, admin | 3 |
| `DISPUTE_OPENED` | admin, client, carrier | 3 |
| `DISPUTE_RESOLVED` | client, carrier | 2 |
| `KYC_SUBMITTED` | admin | 1 |
| `LARGE_TRANSACTION` (> 50k SAR) | admin | 1 |

`renderNotification(spec, vars)` يعمل substitution بـ `{placeholder}` للقيم الديناميكية.

### 5.6 EscrowCountdown UI ✅ (v0.6.0)

مكوّن لايف على الطلبات DELIVERED:
- **Client app** (`apps/web/client/src/components/escrow-countdown.tsx`):
  - HH:MM:SS countdown + progress bar
  - تاريخ الإفراج المتوقّع
  - تفصيل: إجمالي / عمولة 8% / صافي للناقل
  - زر "تأكيد الآن" للإفراج الفوري
- **Carrier app** (`apps/web/carrier/src/components/escrow-countdown.tsx`):
  - نفس الـ engine بصياغة "دفعتك قادمة"
  - يبرز "ما ستستلمه" بـ font أكبر

كلاهما يستهلك `escrowMsRemaining()` ويعيد render كل ثانية (`setInterval` على الـ component فقط، لا الصفحة كلها).

---

## 6. Realtime (Socket.io)

### 6.1 الـ Gateway

`apps/api/src/modules/realtime/` — يُنشئ Socket.io server يستمع على نفس port الـ API.

### 6.2 الأحداث (Events)

#### من Client/Carrier → Server
- `subscribe:order` — الاشتراك في تحديثات طلب
- `subscribe:tracking` — تتبّع شاحنة
- `unsubscribe:*` — إلغاء الاشتراك

#### من Server → Client
- `order:status_changed` — تغيّر حالة طلب
- `order:bid_received` — عرض جديد
- `order:assigned` — تم إسناد الطلب
- `tracking:location_update` — موقع جديد للشاحنة
- `notification:new` — إشعار جديد

### 6.3 الـ Rooms
- `order:{orderId}` — كل المشتركين في طلب معيّن
- `company:{companyId}` — إشعارات لشركة
- `user:{userId}` — إشعارات شخصية

---

## 7. Authentication Flow

```
[Register]
    Client ──POST /api/auth/register──> API
    API ──store user + send OTP──> Postgres + SMS Provider
    Client ──POST /api/auth/verify-phone──> API
    API ──return {accessToken, refreshToken}──> Client

[Login]
    Client ──POST /api/auth/login──> API
    API ──validate credentials──> bcrypt
    API ──return tokens──> Client

[Authenticated Request]
    Client ──GET /api/orders (Bearer accessToken)──> API
    API ──JwtAuthGuard validates──> Allow/Deny

[Token Refresh]
    Client ──POST /api/auth/refresh (refreshToken cookie)──> API
    API ──validate + rotate──> new tokens
```

- **Access Token**: JWT, ~15 min lifetime
- **Refresh Token**: stored hashed in DB + sent as httpOnly cookie
- **OTP**: 4 digits, 5 min validity, مخزّن في Redis

---

## 8. الـ Frontend State Management

### 8.1 Zustand stores (per app)

| Store | الموقع | الغرض | Persist |
|---|---|---|---|
| `useAuthStore` | `lib/auth-store.ts` | بيانات المستخدم الحالي | ✅ |
| `useBrandsStore` | `stores/brands-store.ts` | براندات وموديلات الشاحنات | ✅ |
| `useTruckTypesStore` | `stores/truck-types-store.ts` | أنواع الشاحنات + صورها | ✅ (versioned) |
| `useNotificationsStore` | `stores/notifications-store.ts` (admin) | providers + قوالب الإشعارات | ✅ |
| `useLegalStore` | `stores/legal-store.ts` (admin) | الصفحات القانونية + SEO config | ✅ |

### 8.2 SWR
- يُستخدم لاستدعاءات الـ API (orders, bids, fleet, ...)
- Cache + revalidation تلقائي

---

## 9. Security ✅ مُطبَّق (v0.2.0)

طبقة الأمان مُفعّلة وموثّقة كاملة في [`SECURITY.md`](./SECURITY.md).

### 9.1 الأطر الـ مُطبَّقة

| المحور | التنفيذ |
|---|---|
| **JWT** | Access 15min + Refresh 7d مع rotation + Redis blacklist (jti) + user cutoff |
| **Phone-first onboarding** | OTP عبر SMS (6 أرقام، 10 دقائق، single-use، 3/ساعة) — البريد اختياري بدون OTP |
| **Admin Auth منفصل** | `/api/admin/auth/login` — email+password فقط، lockout 5→30 دقيقة |
| **Login Lockout** | Redis per-identifier — user: 5→15min، admin: 5→30min |
| **Rate Limiting** | Global 100/min + `@Throttle` per-endpoint (login/register/OTP/uploads) |
| **Password** | `IsStrongPassword` — 8+ chars + upper + lower + digit + symbol — bcrypt 12 |
| **File Uploads** | Magic-byte validation (JPG/PNG/PDF/XLSX) + 10MB cap + filename sanitization |
| **CORS** | Allowlist صارمة (لا wildcard) — `localhost` للتطوير + `naqla.sa` و `*.naqla.sa` للإنتاج |
| **Helmet** | HSTS، CSP، X-Frame-Options=DENY، nosniff، Referrer-Policy، COOP/CORP |
| **Validation** | `whitelist + forbidNonWhitelisted + transform` على كل DTO |
| **Audit Log** | Decorator `@Audit` + Interceptor تلقائي، redaction للـ secrets |
| **PDPL** | `POST /users/me/export` + `DELETE /users/me` (soft + anonymise، احتفاظ 7 سنوات) |

### 9.2 الـ Layers

```
Request
   │
   ├─ Helmet headers + CORS check
   │
   ├─ ThrottlerGuard (global 100/min + @Throttle decorator)
   │
   ├─ JwtAuthGuard
   │   ├─ Verify signature
   │   ├─ Check jti not blacklisted (Redis)
   │   └─ Check iat ≥ user cutoff
   │
   ├─ RolesGuard (للـ admin endpoints)
   │
   ├─ ValidationPipe (whitelist + transform)
   │
   ├─ Controller handler
   │
   └─ AuditInterceptor (logs sensitive actions to DB)
       │
       └─ Response → client
```

### 9.3 الـ Files المرتبطة

```
apps/api/src/common/
├── audit/                  # Audit log service + decorator + interceptor
├── guards/                 # JwtAuthGuard (with blacklist), RolesGuard
├── redis/                  # Centralised ioredis client
├── security/
│   ├── file-validation.ts  # Magic byte validation
│   ├── login-attempt.service.ts  # Redis lockout
│   ├── otp.service.ts      # Phone-only OTP
│   └── token-blacklist.service.ts
└── validators/
    └── strong-password.validator.ts
```

### 9.4 لم يُطبَّق بعد

- [ ] **TOTP 2FA** للأدمن (Google Authenticator/Authy)
- [ ] **Column-level encryption** (`pgcrypto`) لـ IBAN، الهوية
- [ ] **CSRF tokens** للـ same-site flows
- [ ] **WAF** على مستوى الـ edge
- [ ] **Common-passwords blocklist** (HIBP API)

📄 **التفاصيل الكاملة**: [`SECURITY.md`](./SECURITY.md)

---

## 11. Internationalization (i18n) ✅ مُطبَّق (v0.3.0)

طبقة i18n متعدّدة اللغات مدعومة في كل تطبيقات الـ frontend الأربعة.

### 11.1 المعمارية على مستوى عالٍ

```
┌─────────────────────────────────────────────────────────┐
│                  Landing (URL-based)                    │
│   /ar/about · /en/about — middleware يفرض الـ prefix    │
│   Switcher في الـ navbar — يُحدّث URL                   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│        Admin / Client / Carrier (Cookie-based)          │
│   `naqla-locale` cookie + Accept-Language fallback     │
│   Switcher في /settings أو /company فقط                │
└─────────────────────────────────────────────────────────┘

       ↓ كلا النمطين يقرآن من ↓

   `messages/{ar|en}/*.json`  (10 files × 2 locales = 468 keys)
       │
       ├─ common · auth · orders · fleet · payments
       ├─ notifications · admin · client · carrier
       └─ landing
```

### 11.2 الـ Stack

| الأداة | الإصدار | الموقع |
|---|---|---|
| **next-intl** | 3.20.0 | كل التطبيقات الأربعة |
| **getRequestConfig** | server-side | `src/i18n.ts` |
| **NextIntlClientProvider** | client-side | `app/layout.tsx` |
| **createSharedPathnamesNavigation** | landing فقط | `src/navigation.ts` |
| **createMiddleware** | landing فقط | `src/middleware.ts` |

### 11.3 الـ Files

```
naqla-platform/
├── messages/
│   ├── ar/         # 10 ملفات JSON بالعربية
│   └── en/         # 10 ملفات JSON بالإنجليزية
├── scripts/
│   └── check-translations.ts        # CI validator
│
└── apps/web/<app>/
    ├── messages/                    # منسوخة لكل تطبيق (next-intl يقرأ منها)
    ├── next.config.mjs              # withNextIntl plugin
    ├── src/
    │   ├── i18n.ts                  # getRequestConfig + locale resolver
    │   ├── navigation.ts            # (landing only) Link, useRouter, ...
    │   ├── middleware.ts            # (landing only) createMiddleware
    │   ├── app/
    │   │   ├── layout.tsx           # NextIntlClientProvider + html lang/dir
    │   │   ├── actions/
    │   │   │   └── set-locale.ts    # Server action لتغيير الكوكي
    │   │   └── [locale]/            # (landing only) — كل المسارات
    │   └── components/
    │       ├── language-selector.tsx        # admin/client/carrier
    │       ├── locale-switcher.tsx          # (landing only) — navbar toggle
    │       └── onboarding-language-picker.tsx  # في صفحات /register
```

### 11.4 تدفّق Locale Resolution

#### Landing (URL-based)
```
1. Browser → GET /  
2. middleware (next-intl) → 307 redirect إلى /ar (default + Accept-Language)
3. Browser → GET /ar
4. RootLayout: getLocale() = 'ar' → set html lang="ar" dir="rtl"
5. NextIntlClientProvider يحقن الـ messages
6. LocaleSwitcher → router.replace(pathname, { locale: 'en' }) → /en
```

#### Admin / Client / Carrier (Cookie-based)
```
1. Browser → GET /settings
2. i18n.readLocaleFromHeaders():
     - cookies().get('naqla-locale') → 'en' (if set)
     - أو headers().get('accept-language') → 'ar' (default)
3. RootLayout: html lang="en" dir="ltr"
4. المستخدم في `/settings → عامة` يضغط 🇬🇧 English
5. `setLocaleAction('en')` server action:
     - cookies().set('naqla-locale', 'en', { maxAge: 1y })
     - revalidatePath('/', 'layout')
6. الصفحة تُعاد render بالإنجليزية
```

### 11.5 RTL/LTR + Fonts

```tsx
// كل تطبيق في layout.tsx
const locale = await getLocale();
const isRtl = locale === 'ar';
<html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={`${tajawal.variable} ${inter.variable}`}>
```

- Tajawal للعربية، Inter للإنجليزية والأرقام
- CSS تستخدم logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) لتعمل في الاتجاهين

### 11.6 Database

```prisma
model User {
  // ...
  preferredLanguage String @default("ar")     // ar | en
}

model Company {
  // ...
  defaultLanguage String @default("ar")        // company-wide default
}
```

Migration: `apps/api/prisma/migrations/20260516120000_add_language_preference/`

### 11.7 Translation Files

| File | Keys | الغرض |
|---|---|---|
| `common.json` | 50+ | أزرار، حالات، عملة، تحميل، فاليديشن |
| `auth.json` | 40+ | تسجيل، دخول، OTP، موافقات قانونية |
| `orders.json` | 60+ | حالات، حقول، أنواع البضائع، الإجراءات |
| `fleet.json` | 40+ | أنواع الشاحنات، السائقون، الوثائق |
| `payments.json` | 25+ | المحفظة، Escrow، أنواع المعاملات |
| `notifications.json` | 25+ | القنوات، الفئات، الأحداث |
| `admin.json` | 50+ | Sidebar، KYC، Settings tabs |
| `client.json` | 30+ | dashboard، addresses، tracking |
| `carrier.json` | 50+ | فرص، عروض، وثائق، أسطول |
| `landing.json` | 80+ | hero، features، how-it-works، CTA |

**المجموع: 468 مفتاحاً متطابقاً بين العربية والإنجليزية.**

### 11.8 CI Validation

```bash
pnpm check:i18n
# → ✅ Translations OK — 10 file(s), 468 key(s), 2 locales.
```

السكربت يتحقق من:
- ✅ مساواة قائمة الملفات بين `ar/` و `en/`
- ✅ مساواة كل المفاتيح nested بين اللغتين
- ✅ لا قيمة فارغة في أي مفتاح
- ✅ exit code 1 عند أي مشكلة (CI-friendly)

### 11.9 ما لم يُطبَّق بعد

- [ ] استبدال `t()` في كل صفحة (الحالي: البنية + المكوّنات المشتركة + Settings + Team فقط)
- [ ] ربط `setLocaleAction` بـ API لتحديث `User.preferredLanguage` في DB
- [ ] لغات إضافية (أوردو، هندي للسائقين الدوليين)

---

## 12. Team & Roles System ✅ مُطبَّق (v0.4.0)

### 12.1 لماذا؟

حسابات الشركات على المنصة (CLIENT و CARRIER) مشتركة بين أكثر من شخص: مالك، مديرون، مشرف عمليات، محاسب. كل واحد منهم يحتاج صلاحيات مختلفة. نظام الـ Team Members يتيح للشركة دعوة أعضاء، تعيين دور لكل واحد، وإيقاف/حذف من تشاء.

### 12.2 الأدوار (CompanyRole)

```prisma
enum CompanyRole {
  OWNER     // مالك (واحد فقط، محمي)
  ADMIN     // مدير كامل الصلاحيات عدا حذف المالك
  STAFF     // (عميل) — مشرف عمليات
  DISPATCH  // (ناقل) — مشرف أسطول
  FINANCE   // محاسب (قراءة فقط على المال + export)
}
```

| Role | للعميل | للناقل |
|---|:---:|:---:|
| OWNER    | ✅ | ✅ |
| ADMIN    | ✅ | ✅ |
| STAFF    | ✅ | — |
| DISPATCH | — | ✅ |
| FINANCE  | ✅ | ✅ |

### 12.3 Permissions Matrix

Source of truth: `packages/shared-utils/src/mock-data.ts` →
`CLIENT_ROLE_PERMISSIONS` و `CARRIER_ROLE_PERMISSIONS`.

#### للعميل (CLIENT)

| الصلاحية | OWNER | ADMIN | STAFF | FINANCE |
|---|:---:|:---:|:---:|:---:|
| إنشاء طلبات | ✅ | ✅ | ✅ | ❌ |
| إلغاء طلبات | ✅ | ✅ | ❌ | ❌ |
| متابعة وتتبّع الطلبات | ✅ | ✅ | ✅ | ✅ (R/O) |
| عرض الفواتير والمدفوعات | ✅ | ✅ | ✅ (R/O) | ✅ |
| تصدير كشف الحساب | ✅ | ✅ | ❌ | ✅ |
| إدارة الفريق (إضافة/تعديل) | ✅ | ✅ | ❌ | ❌ |
| تعديل بيانات الشركة | ✅ | ✅ | ❌ | ❌ |
| حذف المالك | ❌ | ❌ | ❌ | ❌ |

#### للناقل (CARRIER)

| الصلاحية | OWNER | ADMIN | DISPATCH | FINANCE |
|---|:---:|:---:|:---:|:---:|
| قبول/رفض الطلبات | ✅ | ✅ | ✅ | ❌ |
| إدارة الأسطول والسائقين | ✅ | ✅ | ✅ | ❌ |
| تحديث حالة الشحنات | ✅ | ✅ | ✅ | ❌ |
| عرض الأرباح والمدفوعات | ✅ | ✅ | ❌ | ✅ |
| تصدير كشف الحساب | ✅ | ✅ | ❌ | ✅ |
| إدارة الفريق | ✅ | ✅ | ❌ | ❌ |
| تعديل بيانات الشركة | ✅ | ✅ | ❌ | ❌ |
| حذف المالك | ❌ | ❌ | ❌ | ❌ |

### 12.4 الـ Stack

```
apps/api/src/
├── common/guards/
│   └── company-role.guard.ts          # @CompanyRoles(...) decorator + Guard
└── modules/companies/
    ├── dto/team-member.dto.ts         # InviteMemberDto, UpdateMemberDto
    ├── team-members.service.ts        # invite/list/update/remove + rules
    └── companies.controller.ts        # 4 endpoints under /:id/members
```

### 12.5 Backend Rules

| Rule | Code |
|---|---|
| المالك لا يُحذَف ولا يُعدَّل | `OWNER_PROTECTED` |
| المستخدم لا يُعدِّل/يحذف نفسه | `SELF_MODIFY_DENIED` / `SELF_DELETE_DENIED` |
| Manager فقط (OWNER+ADMIN) | `INSUFFICIENT_COMPANY_ROLE` |
| Manager لا يدير شركة غير شركته | `WRONG_COMPANY` |
| لا يمكن إضافة OWNER بدعوة | `IsIn` validator على DTO |
| كل إجراء يُسجَّل في AuditLog | `team.invite`, `team.update`, `team.remove` |
| دعوة عضو ترسل SMS | `OtpService.send(phone)` |

### 12.6 JWT Payload

الـ token الآن يحوي `companyRole`:

```ts
{
  sub: 'usr_...',
  role: 'CLIENT_ADMIN',       // platform-wide role
  companyId: 'CL-1001',
  companyRole: 'ADMIN',       // ← per-company role (NEW in v0.4.0)
  phone: '+9665...',
  jti: '...',
}
```

استخدامه في الـ guard:
```ts
@CompanyRoles('OWNER', 'ADMIN')
@UseGuards(CompanyRoleGuard)
@Put('settings')
update() { ... }
```

### 12.7 UI Wiring

| التطبيق | الموقع | الإمكانيات |
|---|---|---|
| **Client** | `/settings` → تبويب "الفريق" | CRUD كامل |
| **Carrier** | `/settings` → تبويب "الفريق" | CRUD كامل |
| **Admin** | `/companies/[id]` (قسم Team) | Read-only + Suspend/Remove فقط |

ملف `TeamTab` مكوّن مُعاد استخدامه في Client + Carrier:
`apps/web/{client,carrier}/src/components/settings/team-tab.tsx`

### 12.8 SMS Invite Flow

```
[Owner/Admin invites]
    POST /api/companies/:id/members
       { fullName, phone, email?, role: 'ADMIN'|'STAFF'|... }
                ↓
   TeamMembersService.invite:
     1. تحقق Manager + يدير شركته فقط
     2. تحقق phone/email غير مستخدم
     3. ينشئ User بـ:
          - isActive: false
          - passwordHash: null  ← سيُعيّن عند التفعيل
          - companyRole: <invited>
     4. OtpService.send(phone) → SMS بالرابط
     5. Audit: team.invite
     6. يُرجع { activationLink, smsSent: true }
                ↓
[Invitee opens link]
    → يضع كلمة مرور → isActive = true → يصبح ACTIVE
```

---

## 10. Environments ✅ مُطبَّق (v0.5.0)

ثلاث بيئات منفصلة بقوالب env منفصلة وتحقّق آلي عند الـ bootstrap.

### الـ Topology

```
┌─────────────────────────────────────────────────────────────┐
│  Development  →  .env.development  →  localhost:4000        │
│  Staging      →  .env.staging      →  api.staging.naqla.sa  │
│  Production   →  .env.production   →  api.naqla.sa          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         apps/api/src/config/env.validation.ts
         (يُشَغَّل عند كل bootstrap — يفشل سريعاً)
```

### Validation Layer

`ConfigModule.forRoot({ envFilePath: [.env.${NODE_ENV}, .env], validate })` — الـ validate function يفحص:

| المستوى | الفحص |
|---|---|
| **Required** | DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, MINIO_*, NODE_ENV, PORT, FRONTEND_URL, CORS_ORIGINS |
| **Format** | NODE_ENV ∈ {dev/staging/prod/test}, PORT integer 1..65535، JWT length ≥ env-specific min |
| **Provider whitelists** | `PAYMENT_PROVIDER ∈ {mock,moyasar,tap}` ، `SMS_PROVIDER ∈ {console,unifonic,msegat}` |
| **Production-only** | لا mock providers، CORS HTTPS-only، MINIO_USE_SSL=true، SENTRY_DSN إلزامي، JWT_SECRET ≠ REFRESH |

### Backup Strategy

`scripts/backup-db.sh` — pipeline واحد:
- `pg_dump` → `gzip -9` → MinIO upload (bucket per env)
- retention 30 يوم تلقائي
- جدولة عبر cron @ 02:00 UTC

📄 التفاصيل الكاملة: [`DEPLOYMENT.md § 1`](./DEPLOYMENT.md#1-البيئات-environments).

---

## 13. White Label Architecture ✅ مُطبَّق (v0.5.0)

النظام مصمَّم ليكون متعدّد الـ tenants بصرياً — كل deploy/instance يمكن تخصيصه بدون redeploy.

### الـ Settings كمصدر للتخصيص

جدول `Setting` (key/value/category) يحوي كل القيم القابلة للتخصيص. الـ seed يحمّل القيم الافتراضية، والأدمن يعدّلها لاحقاً عبر `/admin/settings`.

```
┌─ Setting ────────────────────┐
│  platform_name_ar    "نقلة"  │  ← اسم المنصة بالعربية
│  platform_name_en    "Naqla" │  ← اسم المنصة بالإنجليزية
│  platform_logo       "<url>" │  ← شعار (PNG/SVG)
│  default_locale      "ar"    │  ← اللغة الافتراضية
│  default_direction   "rtl"   │  ← اتجاه النص
│  default_currency    "SAR"   │  ← العملة
│  default_timezone    "..."   │  ← المنطقة الزمنية
│  default_date_format "..."   │  ← تنسيق التاريخ
│  commission_default_rate     │  ← عمولة المنصة
│  vat_rate                    │  ← ضريبة القيمة المضافة
└──────────────────────────────┘
```

### Frontend Flow

1. **Admin** يفتح `/admin/settings → تبويب "هوية المنصة"`
2. يرفع شعار أو يلصق URL، أو يعدّل الأسماء
3. التغيير يُحفظ في `usePlatformStore` (localStorage في الـ prototype)
4. مكوّن `<Logo>` يقرأ من الـ store ويعرض الشعار في كل صفحة فوراً
5. **TODO post-launch:** ربط الـ store بـ `GET /settings/branding` و `PUT /settings/branding` لينتشر التغيير لكل التطبيقات

### Admin Catalogs (Domain-Customizable Data)

أضيفت في v0.5.0 — جداول قابلة للتعديل من الأدمن دون نشر:

| Catalog | Tab | Default Seed | Use Case |
|---|---|---|---|
| **Cities** | `/admin/settings/cities` | 15 مدينة سعودية بإحداثيات | اختيار مواقع الاستلام/التسليم في الـ Wizard |
| **Cargo Types** | `/admin/settings/cargo-types` | 10 أنواع بـ emoji + flags | اختيار نوع البضاعة في الـ Wizard |
| **SMS Templates** | `/admin/settings/sms-templates` | 4 قوالب (invitation, OTP, order, bid) | نصوص الإشعارات الصادرة |
| **Truck Brands** | `/admin/settings/brands` | 5+ براندات | dropdown إضافة شاحنة في Carrier |

### Why Store-Based for Now?

في الـ prototype: `Zustand + persist` يكفي للديمو. عند ربط الـ backend، نستبدل كل store بـ React Query hook على `GET /catalogs/{name}` + mutations. الـ contract الموجود (`useCitiesStore.addCity`, إلخ) يبقى كما هو من ناحية الـ API السطحية، فالمكوّنات لا تتغيّر.

---

## 14. Geo Layer ✅ مُطبَّق (v0.6.0)

الواجهة تستهلك OpenStreetMap عبر Leaflet (لا يحتاج API key) + Nominatim للـ geocoding المجاني.

### Stack

| الطبقة | المكتبة | الاستخدام |
|---|---|---|
| **Tiles** | OpenStreetMap (`tile.openstreetmap.org`) | خرائط vector عامة |
| **Renderer** | `react-leaflet@4.2.1` + `leaflet@1.9.4` | rendering في React |
| **Geocoding** | `nominatim.openstreetmap.org` | تحويل عنوان → lat/lng (forward only) |
| **SSR** | `next/dynamic` + `ssr: false` | تفادي `window is not defined` |

### Components

- **`RouteMap`** (`apps/web/client/src/components/route-map.tsx`) — موجود من قبل، يعرض المسار origin→destination + truck progress
- **`MapAddressPicker`** (v0.6.0) — جديد، interactive picker مع pin قابل للسحب + Nominatim search:
  - Debounced search (350ms) باحتراماً لـ Nominatim TOS (≤ 1 req/sec)
  - `countrycodes=sa` لحصر النتائج بالسعودية
  - `Accept-Language: ar` للحصول على العربية
  - Click-to-place + drag-to-refine
  - Returns `{ lat, lng, address }` عبر `onChange`

### الاستخدام في New Order Wizard

```
Step 2 (المسار):
  ├─ TripType: SAME_CITY | INTER_CITY
  │
  ├─ SAME_CITY:
  │    └─ Select المدينة + خريطتان (pickup + delivery) داخلها
  │
  └─ INTER_CITY:
       └─ Selectان (مدينة الانطلاق + مدينة الوصول) + خريطتان لتحديد دقيق
```

### Rate Limit Strategy

لو زاد الاستخدام، البدائل:
- **Mapbox Geocoding** (50,000 req/شهر مجاناً) — بدّل `searchAddress` فقط
- **Self-hosted Nominatim** (docker image) — للسيطرة الكاملة على الـ throughput
- **Caching layer** في الـ API: store أول استعلام في Redis 24h

---

## 15. PWA Layer 🛑 مُلغى مؤقتاً (شُحن في v0.7.0 وأُزيل في v0.8.0)

PWA SW اللي شُحن في v0.7.0 كان يُسجَّل في dev mode، وعند أي transient fetch failure (dev server restart، slow network) كان يخدم `/offline` page → المنصّة تنبرك بالكامل حتى مع وجود إنترنت. القرار: حذف PWA كلياً واستبداله بـ kill-switch SW يلغي نفسه + يمسح caches، حتى نراجع PWA في v1.0+ بتصميم أنظف.

### الموجود حالياً

| Component | الحالة | الغرض |
|---|---|---|
| `<OnlineStatusBar>` | ✅ فعّال | banner أحمر/أخضر عند offline/recovery — لا علاقة له بـ SW |
| `public/sw.js` | 🟡 kill-switch | يُلغي تسجيل أي SW قديم + يمسح caches عند الـ activate (لإنقاذ المتصفّحات اللي عندها SW من v0.7.0) |
| `manifest.webmanifest` | ❌ محذوف | لا install prompt الآن |
| `/offline` route | ❌ محذوف | المتصفّح يعرض UI الخطأ الافتراضي عند offline |
| `icons/` | ❌ محذوف | favicon فقط (لا app icons) |

### العودة المخطّطة (v1.0+)

- **Workbox** أو **serwist** بدل sw.js يدوي
- **Production-only** registration (env guard + hostname check)
- **Feature flag** لتعطيل سريع لو حصلت أي مشكلة
- PWA install متروك للمتصفّح (ما نطلق `beforeinstallprompt` بأنفسنا)

---

## 16. Frontend ↔ Backend Adapter Layer ✅ مُطبَّق (v0.8.0)

عند ربط الـ UI (المكتوب على mock data shape) بالـ live API (Prisma shape)، اختلاف أسماء الحقول يسبب runtime crashes. الحلّ adapter منفصل في `shared-utils`.

### `normalizeOrder(input)` — مكان واحد للـ aliasing

```ts
// API/Prisma shape → mock shape
weight              → weightKg
requiredTruckType   → truckType
_count.bids         → bidCount
```

- **Idempotent**: لو passed object already-normalized، يعيد ضبط الـ aliases بنفس القيم
- **Defensive**: returns `null` لـ falsy input فيقدر الكول-سايت يكتب `?? fallback`
- **List variant** `normalizeOrderList`: يفك أي wrapper (array | `{items}` | `{data}`) ويطبّق `normalizeOrder` على كل عنصر

### Rules of Hooks — درس مستفاد

أي صفحة تستهلك `useSWR` لـ resource اختياري **يجب** تتبع:

```tsx
// ✅ Correct:
const { data } = useSWR(...);                  // hook
const [state] = useState(...);                 // hook
const memoized = useMemo(() => ..., [data]);   // hook — تتعامل مع undefined داخلياً
if (!data) return <NotFound />;                // ← Early return AFTER all hooks
```

```tsx
// ❌ Wrong (يفجّر Rules of Hooks):
const { data } = useSWR(...);
const [state] = useState(...);
if (!data) return <NotFound />;                // ← Early return BEFORE remaining hooks
const memoized = useMemo(() => ..., [data]);   // ← UNREACHABLE on first render
```

### Layered Defense

كل page detail يستخدم **3 طبقات حماية**:
1. **Adapter** (`normalizeOrder`): aliases الحقول
2. **Mock fallback** (`?? ORDERS.find(...)`): لو الـ API ما أرسل بعد
3. **Defensive accessors** (`?? 0` على `.toLocaleString`, `?? ''` على `.split`): يمنع undefined method calls حتى لو API أرسل شكل غريب

---

📄 راجع: [`DEPLOYMENT.md`](./DEPLOYMENT.md) للتفاصيل الإنتاجية.
