# نيطاق — Nitaq Platform

> **Marketplace + Services Management Platform للسوق السعودي (B2B)**

منصة رقمية احترافية تربط الشركات والأفراد طالبي الخدمات بشركات ومقدّمي الخدمات المعتمدين في المملكة العربية السعودية، وتتولّى دورة الطلب الكاملة: العرض، التعاقد، التحصيل عبر Escrow، التتبّع اللحظي، وإدارة الخدمات والموظفين.

---

## 📐 لمحة عن المنصة

| المحور | الوصف |
|---|---|
| **النوع** | B2B Marketplace + Services Management System |
| **القطاع** | سوق الخدمات (استشارات، تصميم، تطوير، صيانة، وغيرها) |
| **الجغرافيا** | المملكة العربية السعودية (15+ مدينة) |
| **الأطراف** | العميل (شركة/فرد) · مقدّم الخدمة · الموظف · الأدمن |
| **التسعير** | عمولة 8% على كل طلب + VAT 15% على العمولة |
| **اللغة** | عربي (RTL) + English |
| **الامتثال** | نظام حماية البيانات السعودي (PDPL) + الزكاة والضريبة |

---

## 🧱 Tech Stack

### Backend
- **[NestJS](https://nestjs.com/)** v10 — REST API + Modular Architecture
- **[Prisma](https://www.prisma.io/)** v5 — ORM + Migrations + Type-safe queries
- **[PostgreSQL](https://www.postgresql.org/)** 16 — Primary database
- **[Redis](https://redis.io/)** 7 — Cache + sessions + rate-limit
- **[MinIO](https://min.io/)** — S3-compatible object storage (KYC docs، صور)
- **[Socket.io](https://socket.io/)** — Realtime tracking + notifications
- **JWT + OTP** — Authentication
- **Swagger / OpenAPI** — API documentation

### Frontend
- **[Next.js 14](https://nextjs.org/)** (App Router) — 4 تطبيقات منفصلة
- **[React 18](https://react.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** (مثبّت محلياً في كل تطبيق)
- **[Zustand](https://github.com/pmndrs/zustand)** — State management + persist
- **[Leaflet](https://leafletjs.com/)** + OpenStreetMap — خرائط التتبع
- **[SWR](https://swr.vercel.app/)** — Data fetching
- **[Radix UI](https://www.radix-ui.com/)** — Primitives (Dialog, Select, ...)
- **Tajawal** + **Inter** — خطوط (عربي + أرقام)

### DevOps
- **[Docker](https://www.docker.com/) Compose** — البنية التحتية المحلية
- **[Turbo](https://turbo.build/)** — Monorepo orchestrator
- **[pnpm](https://pnpm.io/)** v9 — Package manager
- **TypeScript** v5 — كل المشروع
- **ESLint + Prettier** — جودة الكود

---

## 🏗️ بنية المشروع (Monorepo)

```
nitaq-platform/
├── apps/
│   ├── api/                    # NestJS Backend          → :4000
│   │   ├── prisma/             # Schema (23 model + 14 enum)
│   │   └── src/modules/        # 14 module
│   └── web/
│       ├── landing/            # الصفحة التسويقية         → :3000
│       ├── admin/              # لوحة الأدمن              → :3001
│       ├── client/             # تطبيق العميل             → :3002
│       └── carrier/            # تطبيق مقدّم الخدمة       → :3003
│
├── packages/
│   ├── shared-types/           # TypeScript types مشتركة
│   ├── shared-ui/              # UI primitives (legacy — تُستخدم محلياً الآن)
│   └── shared-utils/           # Mock data + helpers + format + validation
│
├── docker/                     # Postgres init + configs
├── docs/                       # هذه الوثائق
├── docker-compose.yml          # تطوير محلي
├── docker-compose.production.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## ⚡ التشغيل المحلي السريع

```bash
# 1. متطلبات: Node ≥ 20, pnpm ≥ 9, Docker Desktop

# 2. تثبيت الاعتماديات
pnpm install

# 3. تشغيل البنية التحتية (Postgres + Redis + MinIO)
pnpm docker:up

# 4. متغيرات البيئة (اختياري للتجربة المحلية — لها قيم افتراضية)
cp .env.example .env

# 5. توليد عميل Prisma + Migrations + Seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 6. تشغيل كل التطبيقات (api + 4 واجهات بالتوازي)
pnpm dev
```

> 📘 **دليل التشغيل التفصيلي**: راجع [`GETTING_STARTED.md`](./GETTING_STARTED.md)

---

## 🐳 Docker — بناء صور الإنتاج

كل تطبيق له `Dockerfile` مستقل (multi-stage, Node 20 Alpine, standalone Next.js).

```bash
# بناء من جذر الـ monorepo
docker build -f apps/api/Dockerfile          -t nitaq-api:latest      .
docker build -f apps/web/landing/Dockerfile  -t nitaq-landing:latest  .
docker build -f apps/web/admin/Dockerfile    -t nitaq-admin:latest    .
docker build -f apps/web/client/Dockerfile   -t nitaq-client:latest   .
docker build -f apps/web/carrier/Dockerfile  -t nitaq-provider:latest .
```

> لتطبيقات Next.js، يجب تمرير `NEXT_PUBLIC_*` كـ `--build-arg` لأنها تُضمَّن وقت البناء:
> ```bash
> docker build -f apps/web/client/Dockerfile \
>   --build-arg NEXT_PUBLIC_API_URL=https://api.nqlah.nx.sa \
>   -t nitaq-client:latest .
> ```
>
> في Coolify: أضف هذه المتغيرات في **Build Variables** (ليس Environment Variables).

📄 **التفاصيل الكاملة**: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Section 4

---

## 🔐 حسابات الاختبار (Seed Accounts)

بعد تشغيل `pnpm db:seed` تتوفر هذه الحسابات الجاهزة:

| الدور | البريد | كلمة المرور |
|---|---|---|
| **Admin** | `admin@nitaq.sa` | `Admin@1234` |
| **Client** | `client@nitaq.sa` | `Client@1234` |
| **Provider** | `provider@nitaq.sa` | `Provider@1234` |

---

## 🌐 الروابط (محلياً)

| الواجهة | الرابط | الوصف |
|---|---|---|
| **Landing** | http://localhost:3000 | الصفحة التسويقية + الصفحات القانونية |
| **Admin** | http://localhost:3001 | لوحة إدارة المنصة |
| **Client** | http://localhost:3002 | تطبيق العملاء (شركات/أفراد) |
| **Provider** | http://localhost:3003 | تطبيق مقدّمي الخدمات |
| **API** | http://localhost:4000 | REST API (NestJS) |
| **API Docs** | http://localhost:4000/docs | Swagger / OpenAPI |
| **MinIO Console** | http://localhost:9001 | إدارة الـ object storage |
| **Postgres** | `localhost:5432` | DB (user: `nitaq`, pass: `nitaq_dev_pass`) |
| **Redis** | `localhost:6379` | Cache |

---

## ☁️ الروابط (Staging — nqlah.nx.sa)

| الواجهة | الرابط | الحالة |
|---|---|---|
| **API** | https://api.nqlah.nx.sa | ✅ يعمل |
| **API Health** | https://api.nqlah.nx.sa/health | ✅ `{"status":"ok","database":"up"}` |
| **Landing** | https://nqlah.nx.sa | 🟡 قيد التحقق |
| **Admin** | https://admin.nqlah.nx.sa | 🟡 قيد التحقق |
| **Client** | https://app.nqlah.nx.sa | 🟡 قيد التحقق |
| **Provider** | https://provider.nqlah.nx.sa | 🟡 قيد التحقق |
| **Storage** | https://storage.nqlah.nx.sa | ✅ MinIO |

---

## ✨ الميزات الرئيسية (v0.9.3)

- ✅ **3 لوحات تحكم متخصّصة**: Admin / Client / Provider — مع sidebars وlayouts مستقلّة
- ✅ **Marketplace مفتوح + Direct Request** — طريقتان لإسناد الطلبات
- ✅ **نظام عروض كامل** — تقديم، مقارنة، قبول، سحب
- ✅ **Escrow Wallet System** — حجز المبلغ حتى التسليم
- ✅ **تتبّع لحظي عبر Leaflet** — في تفاصيل كل طلب
- ✅ **اللوحة السعودية الرسمية** — مكوّن مطابق للمواصفات (17 حرف + شعار + أنواع تسجيل)
- ✅ **إدارة خدمات كاملة** — خدمات، موظفين، وثائق، صور توصيفية
- ✅ **أنواع خدمات يديرها الأدمن** — مع سعة افتراضية وصورة (رفع/رابط)
- ✅ **براندات وموديلات الخدمات** — يديرها الأدمن
- ✅ **نظام النزاعات** — للعميل ومقدّم الخدمة + لوحة تدخّل للأدمن
- ✅ **مركز إشعارات شامل** — Email (Resend) + SMS + In-app
- ✅ **25 قالب إشعار قابل للتحرير** — لكل حدث في النظام
- ✅ **الصفحات القانونية القابلة للتحرير** — Terms / Privacy / Transport T&C مع نظام مسودّات + إصدارات
- ✅ **Onboarding احترافي** — wizards متعدّدة الخطوات + موافقة قانونية
- ✅ **SEO Admin Panel** — Meta / OG / JSON-LD / Analytics / SERP preview
- ✅ **KYC Approval Queue** — للأدمن مع 6 أنواع مستندات
- ✅ **Reports & Analytics** — للأدمن ومقدّم الخدمة
- ✅ **Audit Log** — كل الإجراءات الحسّاسة
- ✅ **Support Tickets** — للأطراف الثلاثة
- ✅ **Promotions / Promo codes** — حملات ترويجية
- ✅ **Team Members** (v0.4.0) — 5 أدوار (Owner/Admin/Staff/Dispatch/Finance) + permissions matrix + 4 endpoints + Backend Guard
- ✅ **Settings refactor** (v0.4.0) — `/settings` بدلاً من `/company` بـ 4 تبويبات (Company/Team/Settings/KYC)
- ✅ **Three Environments** (v0.5.0) — dev/staging/prod مع env validation + backup script يومي → MinIO
- ✅ **White Label Branding** (v0.5.0) — رفع شعار + تعديل اسم المنصة بلغتين من `/admin/settings`
- ✅ **Admin Catalogs** (v0.5.0) — إدارة المدن (15 مدينة) + أنواع الخدمات (10) + قوالب SMS من اللوحة
- ✅ **Team Invitation Activation** (v0.5.0) — صفحة `/join?token=` لتفعيل أعضاء الفريق الجدد
- ✅ **Workflow Engine** (v0.6.0) — مرجع وحيد لقواعد الـ state machine + Escrow + Cancellation + Notification matrix
- ✅ **Escrow 72h Countdown** (v0.6.0) — عدّاد لايف على الطلبات DELIVERED لكل من العميل ومقدّم الخدمة
- ✅ **Pickup Time Windows** (v0.6.0) — العميل يختار نافذة زمنية (صباحاً/مساءً/طوال اليوم)، مقدّم الخدمة يؤكّد أو يقترح بديلاً
- ✅ **Interactive Maps + Address Search** (v0.6.0) — Leaflet + Nominatim API + Pin قابل للسحب، دعم Same-City/Inter-City
- ✅ **Individual Provider Compliance** (v0.6.0) — قسمان منفصلان في تبويب الامتثال للأدمن: شركات مزوّدة / مزوّدون أفراد
- ✅ **Online/Offline Status Bar** (v0.8.0) — banner أحمر/أخضر عند انقطاع/عودة الاتصال. *(الـ PWA الكامل من v0.7.0 أُلغي مؤقتاً — سيرجع في v1.0+ بتصميم أنظف عبر Workbox، production-only)*
- 🟢 **OPEN Order Wired End-to-End** (v0.8.0 Slice 1) — العميل ينشر، مقدّم الخدمة يقدّم عرضاً، يقبله، يسلّم، Escrow يُفرَج — كل خطوة على DB حقيقي. راجع [GETTING_STARTED.md](./GETTING_STARTED.md#-smoke-test) للتجربة كاملة.
- ✅ **Frontend↔Backend Adapter Layer** (v0.8.0) — `normalizeOrder` يحوّل API field names إلى mock shape — يحمي من crashes عند تبديل المصدر
- ✅ **Full Dashboard Wiring** (v0.8.0) — admin/client/provider dashboards + lists + services + earnings كلها متّصلة بـ Backend API عبر SWR، مع mock fallback آمن (GETs فقط، الـ mutations تطرح خطأ حقيقي عند الفشل)
- ✅ **Smart Provider Opportunity CTA** (v0.8.0) — تابان فقط: "طلبات السوق المفتوح" و "طلبات خاصة". زر الصف يتبدّل تلقائياً بناءً على حالة عرض مقدّم الخدمة: `قدّم عرضاً` (لم يقدّم) / `تفاصيل` (PENDING) / `إعادة تقديم` (REJECTED) — يعتمد على `bids[]` المرفقة بالـ /api/orders list response
- ✅ **Per-portal locale isolation** (v0.8.0) — كل لوحة (admin/client/provider) تحتفظ بلغتها مستقلّة عن الأخرى عبر cookies مسمّاة `nitaq-locale-{portal}` بدل cookie واحد مشترك
- ✅ **Concrete Proposed Delivery Date** (v0.8.0) — مقدّم الخدمة يحدّد موعد تسليم بتاريخ صريح بدل "أيام + ساعات"، يظهر للعميل بـ alert بارز ووسم "موعد تسليم آخر تم اقتراحه" مع فرق الأيام عن موعده
- ✅ **Bid Details Dialog** (v0.8.0) — زر "تفاصيل" بجانب "قبول" يفتح نافذه بكامل معلومات العرض (مقدّم الخدمة، المواعيد، الملاحظات) مع أزرار قبول / رفض / إغلاق
- ✅ **Rich Assigned View** (v0.8.0) — بعد القبول: card موحّد على لوحات العميل/مقدّم الخدمة/الأدمن يعرض status header، 3-step progress (استلام → في الطريق → تسليم)، مواعيد فعلية، سجل تتبّع. لوحة الأدمن تتحدّث تلقائياً كل 15 ثانية + Escrow countdown مرئي
- 🟢 **Full System Wiring** (v0.9.0) — كل صفحة في الثلاث portals مربوطة بالـ API الحقيقي. Backend modules جديدة: Disputes + Support Tickets. Toast infrastructure (sonner) على كل portal مع `lib/notify.ts` helper موحّد. كل form صار يعطّل الزر + spinner أثناء الإرسال + toast نجاح/خطأ + `mutate()` على SWR. الاستثناءات: SMS/Email/Payment provider (تنتظر integration بعد deploy)
- ✅ **Field-Shape Adapters** (v0.9.1) — `normalizeService` + `normalizePayment` في shared-utils يعالجان اختلاف أسماء الحقول بين الـ mock والـ Prisma API (serviceType↔type، state↔status، إلخ). Provider opportunities تستثني الطلبات المُسندة لنفس مقدّم الخدمة.
- ✅ **ServiceType Enum Alignment** (v0.9.2) — Prisma `ServiceType` enum صار superset للـ catalog (CONSULTING، DESIGN مضافان). إصلاح Rules-of-Hooks في صفحة تفاصيل الخدمة.
- ✅ **Dynamic Catalogs** (v0.9.3) — `GET /settings/catalogs` (public، بدون auth) يُعيد المدن/أنواع الخدمات من الـ DB. Admin panels تحفظ أي تعديل تلقائياً. Client wizard يقرأ الـ catalog عبر SWR مع static fallback.
- ✅ **Service Photo Upload** (v0.9.3) — صور الخدمة تُرفع عبر presigned URL قبل إنشاء السجل — flow: `POST /uploads/presign` → PUT to S3 → store publicUrl.
- ✅ **Contact Info After Bid Acceptance** (v0.9.3) — ProviderInfoCard تعرض هاتف/إيميل مقدّم الخدمة الحقيقي من `order.provider` مع روابط `tel:` / `mailto:`.
- ✅ **Saved Addresses Backend** (v0.9.3) — نموذج `SavedAddress` في DB + module كامل + `GET /companies/:id/addresses`. Migration مُطبَّق.
- ✅ **City-Bounded Map Search** (v0.8.0) — Nominatim search في الـ Wizard يحصر النتائج بـ ~50km حول مركز المدينة المختارة
- ✅ **DIRECT negotiation** (v0.3.x) — تفاوض مباشر عميل↔مقدّم الخدمة: accept/counter/decline rounds
- ✅ **Pulsing badges + sound** (v0.3.x) — تنبيه بصري وصوتي للطلبات الجديدة
- ✅ **404 + 500 Pages** — في كل التطبيقات الأربعة
- ✅ **Dark Mode** — في كل واجهة
- ✅ **RTL كامل** — Arabic-first

---

## 🌍 Languages

المنصة متعدّدة اللغات مع دعم كامل لـ RTL/LTR.

| اللغة | الكود | الاتجاه | الخط | الحالة |
|---|---|---|---|---|
| **العربية** | `ar` | RTL | Tajawal | ✅ افتراضية |
| **English** | `en` | LTR | Inter | ✅ مكتملة |

### الميزات
- **11 ملف ترجمة لكل لغة** (`common`, `auth`, `orders`, `services`, `payments`, `notifications`, `admin`, `client`, `provider`, `landing`, `settings`) = **646 مفتاحاً** متطابقاً بين اللغتين
- **Landing** يستخدم URL-based routing: `/ar/...` و `/en/...` مع switcher في الـ navbar
- **Admin / Client / Provider** يستخدمون cookie-based locale — يُغيَّر من إعدادات كل دور:
  - Admin: `/settings` → تفضيلات العرض
  - Client: `/company` → الإعدادات الشخصية
  - Provider: `/company` → الإعدادات الشخصية
- **Onboarding**: بطاقة اختيار اللغة في أعلى صفحات التسجيل
- **DB**: `User.preferredLanguage` و `Company.defaultLanguage` (default: `ar`)
- **Validation**: `pnpm check:i18n` يضمن مساواة الملفات والمفاتيح بين اللغتين

```bash
# تحقّق من اكتمال الترجمة
pnpm check:i18n
# → ✅ Translations OK — 10 file(s), 468 key(s), 2 locales.
```

📄 **التفاصيل**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) قسم 11

---

## 🛡️ Security

طبقة أمان متعدّدة تغطّي المصادقة، الـ rate limiting، التحقّق من المدخلات، والامتثال لنظام حماية البيانات السعودي (PDPL).

| المحور | الحالة |
|---|---|
| **JWT** | Access 15 min + Refresh 7 days **مع rotation** و Redis blacklist |
| **Onboarding** | **رقم الجوال إلزامي + OTP عبر SMS** (10 دقائق) — البريد اختياري بدون OTP |
| **Admin Login** | نقطة منفصلة (`/api/admin/auth/login`) — email + password فقط، 5 محاولات → 30 دقيقة block |
| **User Login** | 5 محاولات → 15 دقيقة block (Redis per-identifier lockout) |
| **Rate Limiting** | Global 100/min + per-endpoint (login: 5/15min، OTP: 3/hour، uploads: 10/min) |
| **Password Policy** | 8+ أحرف، upper/lower/digit/symbol، bcrypt (12 rounds) |
| **File Uploads** | Magic-byte validation (JPG/PNG/PDF/XLSX) + حد 10 MB |
| **CORS** | Allowlist صارمة (لا wildcard) — localhost للتطوير + `nitaq.sa` & `*.nitaq.sa` للإنتاج |
| **Helmet** | Headers كاملة: HSTS، CSP، X-Frame-Options=DENY، nosniff، Referrer-Policy |
| **Audit Log** | كل إجراء حسّاس (auth، orders، payments، KYC، settings، uploads، PDPL) |
| **PDPL** | حقوق المستخدم: export البيانات، حذف الحساب (soft + anonymise) — السجلات المالية تُحفظ 7 سنوات |

📄 **التفاصيل الكاملة**: [`docs/SECURITY.md`](./docs/SECURITY.md)

---

## 📚 الوثائق

| الملف | الوصف |
|---|---|
| [`GETTING_STARTED.md`](./GETTING_STARTED.md) | دليل التثبيت والتشغيل خطوة بخطوة |
| [`CHANGELOG.md`](./CHANGELOG.md) | سجل الإصدارات والتغييرات |
| [`PENDING_WORK.md`](./PENDING_WORK.md) | حالة الربط الحالية + ما تبقّى للجلسات القادمة |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | البنية التقنية + قاعدة البيانات + Workflow |
| [`docs/API.md`](./docs/API.md) | REST API endpoints + Auth flow |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | النشر للإنتاج |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | الأمان والحماية والامتثال |
| [`docs/MONITORING.md`](./docs/MONITORING.md) | المراقبة والـ Alerts |
| [`docs/KPIs.md`](./docs/KPIs.md) | مؤشّرات الأداء |

---

## 🤝 المساهمة

هذا المشروع حالياً قيد التطوير الداخلي. للاستفسار: `dev@nitaq.sa`

---

## 📄 الترخيص

© 2026 Nitaq Platform — جميع الحقوق محفوظة.
