# 🌐 API Reference — Nitaq Platform

REST API مبني على **NestJS 10** يعمل على `http://localhost:4000` محلياً.

📚 **Swagger UI تفاعلي**: http://localhost:4000/docs

---

## 1. الأساسيات

### Base URL
- **Local**: `http://localhost:4000/api`
- **Production**: TBD

### Content-Type
كل الطلبات والاستجابات بـ `application/json`.

### Authentication
معظم الـ endpoints تتطلّب `Authorization: Bearer <accessToken>` في الـ header.
الاستثناءات: `/auth/login`, `/auth/register`, `/auth/refresh`, `/health`.

### Global response shape
```jsonc
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "الطلب غير موجود",
    "details": { ... }    // optional
  }
}
```

### Headers مشتركة
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Request-ID: <uuid>           # optional, للـ tracing
```

---

## 2. Authentication Flow

### 2.1 التسجيل (Register)

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "محمد العتيبي",
  "email": "user@example.sa",
  "phone": "+966551234567",
  "password": "StrongPass@1234",
  "role": "CLIENT",                    // CLIENT | PROVIDER
  "companyNameAr": "شركة الجزيرة",     // إذا role=PROVIDER أو كان حساب شركة
  "crNumber": "1010000000",            // للشركات
  "acceptedTerms": true,
  "acceptedPrivacy": true,
  "acceptedTransport": true
}
```

**Response (201)**:
```jsonc
{
  "success": true,
  "data": {
    "userId": "usr_...",
    "verificationRequired": true,
    "verificationChannels": ["email", "sms"]
  }
}
```

### 2.2 إرسال OTP

```http
POST /api/auth/send-otp
{ "channel": "sms", "destination": "+966551234567" }
```

### 2.3 التحقّق

```http
POST /api/auth/verify-phone
{ "userId": "usr_...", "otp": "1234" }
```

### 2.4 تسجيل الدخول

```http
POST /api/auth/login
{
  "identifier": "user@example.sa",     // email أو phone
  "password": "StrongPass@1234"
}
```

**Response (200)**:
```jsonc
{
  "success": true,
  "data": {
    "user": { "id": "usr_...", "fullName": "...", "role": "CLIENT", ... },
    "accessToken": "eyJ...",         // ~15 min lifetime
    "refreshToken": "eyJ..."          // 7 days, also set as httpOnly cookie
  }
}
```

### 2.5 تحديث الـ Token

```http
POST /api/auth/refresh
# يستخدم cookie أو body: { "refreshToken": "..." }
```

### 2.6 تسجيل الخروج

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

---

## 3. Endpoints

> الإشارة `🔒` = يتطلّب مصادقة. `👮` = للأدمن فقط.

### 3.1 Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | تسجيل مستخدم جديد |
| `POST` | `/auth/login` | تسجيل دخول |
| `POST` | `/auth/logout` 🔒 | تسجيل خروج (يبطل refresh token) |
| `POST` | `/auth/refresh` | تحديث الـ access token |
| `POST` | `/auth/send-otp` | إرسال رمز OTP |
| `POST` | `/auth/verify-phone` | التحقّق من OTP الجوال |

### 3.2 Users — `/api/users`

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/me` 🔒 | بيانات المستخدم الحالي |
| `PATCH` | `/users/me` 🔒 | تحديث البروفايل |

### 3.3 Companies — `/api/companies`

| Method | Path | Description |
|---|---|---|
| `GET` | `/companies` 🔒 | قائمة الشركات (مع filters) |
| `GET` | `/companies/:id` 🔒 | تفاصيل شركة |
| `PUT` | `/companies/:id` 🔒 | تحديث شركة |
| `GET` | `/companies/:id/kyc` 🔒 | مستندات KYC |
| `POST` | `/companies/:id/kyc` 🔒 | رفع مستند KYC |
| `PUT` | `/companies/:id/kyc/:docId/status` 🔒👮 | اعتماد/رفض مستند |
| `GET` | `/companies/:id/stats` 🔒 | إحصاءات الشركة |

#### Team Members (v0.4.0)

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/companies/:id/members` 🔒 | قائمة أعضاء فريق الشركة | OWNER + ADMIN |
| `POST` | `/companies/:id/members` 🔒 | دعوة عضو جديد (يصله SMS) | OWNER + ADMIN |
| `PUT` | `/companies/:id/members/:userId` 🔒 | تعديل الدور أو الحالة | OWNER + ADMIN |
| `DELETE` | `/companies/:id/members/:userId` 🔒 | إزالة عضو من الفريق | OWNER + ADMIN |

##### POST `/companies/:id/members` body
```jsonc
{
  "fullName": "سارة العمري",
  "phone": "+966551234567",
  "email": "sara@example.sa",       // optional
  "role": "ADMIN"                    // ADMIN | STAFF | DISPATCH | FINANCE
}
```

##### Response (201)
```jsonc
{
  "id": "usr_...",
  "phone": "+9665...",
  "email": "sara@example.sa",
  "companyRole": "ADMIN",
  "activationLink": "https://app.nitaq.sa/activate?token=...",
  "smsSent": true
}
```

##### Error codes (team)

| Code | HTTP | المعنى |
|---|---|---|
| `INSUFFICIENT_COMPANY_ROLE` | 403 | المستخدم ليس OWNER ولا ADMIN |
| `WRONG_COMPANY` | 403 | محاولة إدارة فريق شركة أخرى |
| `OWNER_PROTECTED` | 403 | لا يمكن تعديل/حذف المالك |
| `SELF_MODIFY_DENIED` | 400 | المستخدم لا يعدّل نفسه |
| `SELF_DELETE_DENIED` | 400 | المستخدم لا يحذف نفسه |
| `MEMBER_NOT_FOUND` | 404 | العضو غير موجود في الشركة |
| `USER_EXISTS` | 409 | يوجد حساب بنفس الجوال/البريد |

### 3.4 Orders — `/api/orders`

| Method | Path | Description |
|---|---|---|
| `GET` | `/orders` 🔒 | قائمة طلباتي (حسب الدور) — تتضمّن `bids[]` خفيفة لكل طلب |
| `POST` | `/orders` 🔒 | إنشاء طلب جديد |
| `GET` | `/orders/:id` 🔒 | تفاصيل طلب |
| `PUT` | `/orders/:id` 🔒 | تحديث طلب (قبل النشر) |
| `POST` | `/orders/:id/publish` 🔒 | نشر الطلب للسوق |
| `POST` | `/orders/:id/cancel` 🔒 | إلغاء (مع منطق الرسوم) |
| `POST` | `/orders/:id/confirm` 🔒 | تأكيد الاستلام النهائي |
| `POST` | `/orders/:id/assign` 🔒👮 | إسناد إداري |
| `GET` | `/orders/:id/tracking` 🔒 | tracking events |
| `POST` | `/orders/:id/tracking` 🔒 | تحديث حالة/موقع |

#### `GET /api/orders` list response — embedded bids
كل طلب في القائمة يأتي مع مصفوفة `bids` خفيفة (id + carrierId + status + amount فقط) ليتمكّن الـ frontend من معرفة "هل قدّمت عرضاً على هذا الطلب؟" دون ضربة API إضافية. الـ payload الكامل للعرض (notes / estimatedDays / proposedPickupDate / …) يأتي من `GET /api/orders/:id`.

```jsonc
{
  "id": "ord_xxx",
  "orderNumber": "ORD-2026-0150",
  "status": "BIDDING",
  // ... بقية حقول الطلب ...
  "_count": { "bids": 3 },
  "bids": [
    { "id": "bid_a", "carrierId": "cmp_abc", "status": "PENDING",  "amount": 7800 },
    { "id": "bid_b", "carrierId": "cmp_def", "status": "REJECTED", "amount": 8200 }
  ]
}
```

#### Order body example
```jsonc
POST /api/orders
{
  "tripType": "INTER_CITY",       // SAME_CITY | INTER_CITY  (v0.6.0)
  "mode": "OPEN",                 // OPEN | DIRECT
  "targetCarrierId": null,        // إلزامي إذا DIRECT
  "cargoType": "GENERAL",
  "cargoDescription": "أثاث منزلي",
  "weightKg": 2500,
  "serviceType": "CONSULTING",
  "originCity": "الرياض",
  "originAddress": "حي السلي، مستودع 14",
  "originPin": { "lat": 24.7136, "lng": 46.6753 },   // optional precise location (v0.6.0)
  "destinationCity": "جدة",
  "destinationAddress": "...",
  "destinationPin": { "lat": 21.3891, "lng": 39.8579 }, // optional (v0.6.0)
  "pickupDate": "2026-06-01",     // YYYY-MM-DD (v0.6.0)
  "pickupWindow": "MORNING",      // MORNING | EVENING | ALL_DAY  (v0.6.0)
  "clientBudget": 8500,
  "requiresInsurance": true,
  "requiresRefrigeration": false,
  "specialInstructions": ""
}
```

#### Bid body example (v0.8.x — proposed dates replace days/hours)
```jsonc
POST /api/orders/:orderId/bids
{
  "amount": 7800,
  "proposedPickupDate": "2026-06-02",          // optional, counter on pickup timing
  "proposedDeliveryDate": "2026-06-05",        // optional, concrete delivery date
  "notes": "فريق متخصص، خبرة +5 سنوات، تأمين شامل"
}
// Legacy fields `estimatedDays` / `estimatedHours` are still accepted for
// back-compat but no longer emitted by the carrier form. New clients should
// send `proposedDeliveryDate` instead — the client UI prefers it over any
// computed estimate.
```

### 3.5 Bids — `/api/bids`

| Method | Path | Description |
|---|---|---|
| `GET` | `/bids` 🔒 | عروض مقدّم الخدمة |
| `POST` | `/bids` 🔒 | تقديم عرض على طلب |
| `POST` | `/bids/:id/accept` 🔒 | قبول العرض (من العميل) |
| `POST` | `/bids/:id/reject` 🔒 | رفض العرض |

#### Bid body example
```jsonc
POST /api/bids
{
  "orderId": "ord_...",
  "serviceId": "svc_...",
  "price": 8200,
  "estimatedDays": 1,
  "notes": "خدمة احترافية، تأمين شامل"
}
```

### 3.6 Services — `/api/services`

| Method | Path | Description |
|---|---|---|
| `GET` | `/services` 🔒 | خدمات مقدّم الخدمة |
| `POST` | `/services` 🔒 | إضافة خدمة |
| `GET` | `/services/:id` 🔒 | تفاصيل خدمة |
| `PUT` | `/services/:id` 🔒 | تحديث خدمة |
| `GET` | `/employees` 🔒 | موظفو مقدّم الخدمة |
| `POST` | `/employees` 🔒 | إضافة موظف |
| `GET` | `/employees/:id` 🔒 | تفاصيل موظف |
| `GET` | `/employees/:id/history` 🔒 | سجل مهام الموظف |
| `POST` | `/employees/:id/location` 🔒 | تحديث موقع الموظف |

### 3.7 Payments — `/api/payments`

| Method | Path | Description |
|---|---|---|
| `GET` | `/payments` 🔒 | مدفوعاتي |
| `GET` | `/payments/:id` 🔒 | تفاصيل دفعة |
| `POST` | `/payments/:id/release` 🔒👮 | إفراج يدوي من Escrow |
| `GET` | `/payments/transactions` 🔒 | سجل المعاملات |

### 3.8 Invoices — `/api/invoices`

| Method | Path | Description |
|---|---|---|
| `GET` | `/invoices` 🔒 | فواتيري |
| `GET` | `/invoices/:id` 🔒 | فاتورة (مع رابط PDF) |
| `POST` | `/invoices/:id/send` 🔒 | إرسال للعميل بالبريد |

### 3.9 Tracking — `/api/tracking`

| Method | Path | Description |
|---|---|---|
| `GET` | `/tracking/:id` 🔒 | events طلب معيّن |
| `POST` | `/tracking/:id` 🔒 | إضافة event |

### 3.10 Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications` 🔒 | إشعاراتي |
| `PUT` | `/notifications/:id/read` 🔒 | تعليم مقروء |
| `PUT` | `/notifications/read-all` 🔒 | تعليم الكل مقروء |

### 3.11 Uploads — `/api/uploads`

| Method | Path | Description |
|---|---|---|
| `POST` | `/uploads/presign` 🔒 | الحصول على presigned URL لـ MinIO |

#### Presign body
```jsonc
POST /api/uploads/presign
{
  "fileName": "kyc-cr.pdf",
  "contentType": "application/pdf",
  "category": "KYC"     // KYC | SERVICE_PHOTO | EMPLOYEE_AVATAR | INVOICE
}
```

**Response**:
```jsonc
{
  "uploadUrl": "https://minio.../upload?...",
  "fileUrl": "https://minio.../naqla-uploads/...",
  "expiresIn": 600
}
```

### 3.12 Admin — `/api/admin` 👮

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/dashboard/stats` 👮 | إحصاءات اللوحة |
| `GET` | `/admin/companies` 👮 | كل الشركات + KYC queue |
| `PUT` | `/admin/companies/:id/status` 👮 | اعتماد/رفض/تعليق (ACTIVE/SUSPENDED/REJECTED) |
| `GET` | `/admin/orders` 👮 | كل الطلبات في النظام |
| `GET` | `/admin/disputes` 👮 | كل النزاعات |
| `PUT` | `/admin/disputes/:id` 👮 | حل نزاع (resolution + note) |
| `GET` | `/admin/transactions` 👮 | كل المعاملات المالية |
| `GET` | `/admin/settings` 👮 | إعدادات النظام |
| `PUT` | `/admin/settings` 👮 | تحديث الإعدادات |

---

### 3.13 Disputes (Client/Provider) — `/api/disputes` (v0.9.0)

| Method | Path | Description |
|---|---|---|
| `GET` | `/disputes` 🔒 | نزاعاتي (scope حسب الشركة) |
| `GET` | `/disputes/:id` 🔒 | تفاصيل نزاع |
| `POST` | `/disputes` 🔒 | فتح نزاع جديد على طلب أنا طرف فيه |

**POST /disputes** body:
```jsonc
{ "orderId": "ord_xxx", "reason": "تأخّر التسليم", "description": "تفاصيل أكثر..." }
```
**شروط:** الطلب يجب أن يكون ASSIGNED أو بعدها. نزاع واحد فقط لكل طلب (unique على orderId).

---

### 3.14 Support Tickets — `/api/support/tickets` (v0.9.0)

| Method | Path | Description |
|---|---|---|
| `GET` | `/support/tickets` 🔒 | تذاكري (admin يرى كل شيء) |
| `GET` | `/support/tickets/:id` 🔒 | تفاصيل تذكرة |
| `POST` | `/support/tickets` 🔒 | إنشاء تذكرة دعم |
| `PUT` | `/support/tickets/:id` 👮 | Admin: status/assignedTo/resolution |

**POST /support/tickets** body:
```jsonc
{
  "subject": "ملخص قصير",
  "category": "TECHNICAL",     // TECHNICAL | BILLING | ACCOUNT | ORDER | GENERAL
  "description": "تفاصيل المشكلة..."
}
```

---

### 3.13 White Label & Catalogs (v0.5.0 — UI ready, backend planned) 🚧

الـ UI كامل في `/admin/settings` (3 تبويبات جديدة + branding). الـ endpoints التالية مخطّطة لربط الـ Zustand stores الحالية بـ DB بعد الإطلاق:

**Branding** (key/value in `Setting` table)

| Method | Path | Description |
|---|---|---|
| `GET` | `/settings/branding` 🌐 | عام — يُستهلَك من كل واجهة لتطبيق الـ logo والاسم |
| `PUT` | `/admin/settings/branding` 👮 | تحديث `platform_logo`, `platform_name_ar`, `platform_name_en` |
| `POST` | `/admin/settings/branding/logo` 👮 | رفع شعار → MinIO → يُحدِّث `platform_logo` بـ URL |

**Cities Catalog**

| Method | Path | Description |
|---|---|---|
| `GET` | `/catalogs/cities` 🌐 | كل المدن النشطة (للـ Wizard) |
| `POST` | `/admin/catalogs/cities` 👮 | إنشاء مدينة |
| `PUT` | `/admin/catalogs/cities/:id` 👮 | تعديل |
| `DELETE` | `/admin/catalogs/cities/:id` 👮 | حذف |

**Cargo Types Catalog**

| Method | Path | Description |
|---|---|---|
| `GET` | `/catalogs/cargo-types` 🌐 | كل الأنواع النشطة |
| `POST` | `/admin/catalogs/cargo-types` 👮 | إنشاء |
| `PUT` | `/admin/catalogs/cargo-types/:id` 👮 | تعديل |
| `DELETE` | `/admin/catalogs/cargo-types/:id` 👮 | حذف |

**SMS Templates**

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/sms-templates` 👮 | كل القوالب |
| `POST` | `/admin/sms-templates` 👮 | إنشاء قالب |
| `PUT` | `/admin/sms-templates/:id` 👮 | تعديل |
| `DELETE` | `/admin/sms-templates/:id` 👮 | حذف |

**Team Activation** (يُكمِل flow الـ `/join`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/invitation/:token` 🌐 | تحقّق من الـ token + استرجاع memberName/companyName/role |
| `POST` | `/auth/activate` 🌐 | body: `{ token, password }` → تفعيل الحساب + إصدار JWT |

> 🌐 = public • 👮 = SUPER_ADMIN only

---

## 4. WebSocket (Socket.io)

### 4.1 الاتصال
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'eyJ...' },        // accessToken
  transports: ['websocket']
});
```

### 4.2 Events (Client ← Server)
- `order:status_changed` — `{ orderId, oldStatus, newStatus }`
- `order:bid_received` — `{ orderId, bidId, providerName, price }`
- `order:assigned` — `{ orderId, providerName }`
- `tracking:location_update` — `{ orderId, lat, lng, at }`
- `notification:new` — `Notification`

### 4.3 Events (Server ← Client)
- `subscribe:order` — `{ orderId }`
- `subscribe:tracking` — `{ orderId }`
- `unsubscribe:order` — `{ orderId }`

---

## 5. أكواد الأخطاء (Error Codes)

| Code | HTTP | المعنى |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | بيانات دخول غير صحيحة |
| `AUTH_TOKEN_EXPIRED` | 401 | انتهت صلاحية الـ access token |
| `AUTH_TOKEN_INVALID` | 401 | token غير صالح |
| `AUTH_INSUFFICIENT_ROLE` | 403 | الدور لا يكفي لهذا الإجراء |
| `KYC_NOT_APPROVED` | 403 | الشركة لم تُعتمد بعد |
| `ORDER_NOT_FOUND` | 404 | الطلب غير موجود |
| `ORDER_INVALID_STATUS` | 400 | الإجراء غير متاح في الحالة الحالية |
| `BID_ALREADY_ACCEPTED` | 400 | الطلب أُسند لمقدّم خدمة بالفعل |
| `CANCELLATION_NOT_ALLOWED` | 400 | الإلغاء غير مسموح (الطلب قيد التنفيذ) |
| `VALIDATION_ERROR` | 422 | فشل التحقق من المدخلات |
| `RATE_LIMIT_EXCEEDED` | 429 | تجاوز حدّ الطلبات |
| `INTERNAL_ERROR` | 500 | خطأ غير متوقّع |

---

## 6. Pagination

كل endpoints القوائم تدعم:

```http
GET /api/orders?page=1&limit=20&sort=createdAt:desc&status=BIDDING
```

**Response shape**:
```jsonc
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 7. Rate Limiting Rules

> 🚧 **يُكمل لاحقاً.**
>
> الإعداد الحالي العالمي: **100 req/min/IP** عبر `@nestjs/throttler`.
>
> الـ rules التفصيلية لكل endpoint وكل role ستُحدّد لاحقاً:
> - [ ] Auth endpoints: 5 محاولات / 15 دقيقة (anti-bruteforce)
> - [ ] OTP requests: 3 / hour / phone
> - [ ] File uploads: 20 / hour / user
> - [ ] Search endpoints: 60 / min / user
> - [ ] Admin endpoints: 200 / min
>
> 📄 راجع: [`SECURITY.md`](./SECURITY.md)

---

## 8. التطوير والاختبار

### 8.1 Swagger UI
افتح http://localhost:4000/docs — تقدر تختبر كل endpoint مباشرة من المتصفح مع Authorize button (الصق access token مرة واحدة).

### 8.2 cURL examples

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"client@nitaq.sa","password":"Client@1234"}'

# Get my orders (replace TOKEN)
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer TOKEN"

# Submit bid (provider)
curl -X POST http://localhost:4000/api/bids \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ord_xxx","serviceId":"svc_xxx","price":8500,"estimatedDays":2}'
```

### 8.3 Postman / Insomnia
بإمكانك استيراد OpenAPI من `http://localhost:4000/docs-json` مباشرة.
