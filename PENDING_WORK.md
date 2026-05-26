# Pending Work — حالة الربط الحالية (Nitaq Platform)

> آخر تحديث: 2026-05-26 (بعد v0.9.16 كامل — Prisma migration مُطبَّق)
>
> الهدف من هذا الملف: نقطة استئناف واضحة. يلخّص ما تبقّى من الربط/الإصلاحات قبل
> أن نعتبر النظام جاهزاً لـ release v1.0.

---

## ✅ مربوط بالـ API (لا تبدأ من الصفر — لكن أعد الفتح إذا وجدت بق)

> ⚠️ "مربوط" لا تعني "خالٍ من البق". هذه الأشياء استُدعي فيها endpoint حقيقي
> مع toast/spinner/mutate. لكن قد تظهر مشاكل في:
> - اختلاف أسماء حقول بين mock و API (مثل ما حصل مع Service و Payment)
> - Rules-of-Hooks بعد إضافة SWR
> - حالات حافة (empty/null/long lists) لم تُختَبر بعد
>
> إذا اكتشفت أي خلل في الميزات أدناه، أعد فتحها فوراً — لا تتردّد.

ربط end-to-end لـ:
- Auth (login/register/refresh/logout + admin login)
- Auto Token Refresh ✅ v0.9.9 — client + provider يجدّدان الـ token على 401 قبل redirect
- Companies (GET/PUT، members CRUD، KYC submit + approve/reject)
- Orders (CRUD كامل + lifecycle publish/cancel/confirm/deliver/complete + tracking)
- Bids (POST/PUT/accept/reject + retry بعد REJECTED + proposedDeliveryDate)
- Services (list + create + detail + photo upload بعد v0.9.3)
- Employees (list + detail + invite بعد v0.9.3)
- Payments (list + release + admin force-release)
- Invoices (list + send)
- Notifications (list + mark-read + mark-all-read)
- Disputes (POST جديد للعميل/مقدّم الخدمة + admin update)
- Support Tickets (POST/GET + admin update)
- Admin dashboard/companies/orders/disputes/transactions/settings
- Locale isolation (cookies منفصلة لكل بورتال)
- Toast infrastructure (sonner + lib/notify.ts على كل بورتال)
- normalizeOrder + normalizeBid + normalizeService + normalizePayment adapters
- Provider opportunities filtering (يستثني المُسندة لنفس مقدّم الخدمة)
- Provider order detail متطابق بصرياً مع العميل (RequestStatusCard inline timeline)
- Dynamic Logo ✅ v0.9.9 — admin يحفظ في DB، client/provider يجلبان من `GET /settings/platform`
- Direct Assignment بسعر ثابت ✅ v0.9.9 — `agreedPriceUpfront` يتجاوز التفاوض ويُسند مباشرة
- Saved Addresses ✅ migration طُبّقت في v0.9.3 (20260521043732_add_saved_addresses_and_national_id)
- قائمة مقدّمي الخدمات في New Order ✅ v0.9.10 — `GET /companies?type=PROVIDER&status=ACTIVE` بدل COMPANIES mock
- Provider order controls ✅ v0.9.11 — أزرار ASSIGNED/CONFIRMED/IN_TRANSIT مع dialog صحيح لكل مرحلة
- Employee Assignment ✅ v0.9.11 — `POST /orders/:id/assign-employee` + `GET /employees/available` + auto ON_ASSIGNMENT/AVAILABLE

---

## 🟡 ناقص أو يحتاج عمل

لا يوجد بنود مفتوحة بعد v0.9.9 — جميع الوظائف الجوهرية مربوطة.

---

## 🔴 صفحات بواجهة ثابتة (لا API — مؤجَّلة بقرار)

هذه الصفحات موجودة في الـ sidebar لكن تعرض بيانات static فقط:

| الصفحة | البورتال | الحالة |
|---|---|---|
| `/reports` | admin | ✅ مربوط بـ 6 analytics endpoints (v0.9.14) — Bloomberg Terminal dark theme + PDF export |
| `/legal` | admin | نصوص قانونية ثابتة — لا يحتاج API |
| `/promotions` | admin | Static UI — ميزة مستقبلية |
| `/audit` | admin | Stub — يحتاج `GET /admin/audit-logs` |
| `/reports` | provider | Static charts — لا endpoint بعد |
| `/finance` | provider | Static UI — يحتاج ربط Wallet API |
| `/documents` | provider | Static UI — يحتاج ربط KYC/uploads |
| `/tracking` | client | Static map — يحتاج GPS live feed |
| `/finance` | client | Static charts — يحتاج ربط Wallet API |

---

## 🔴 External Integrations (مؤجَّلة post-deploy عمداً)

- **SMS Provider**: حالياً `SMS_PROVIDER=console` يطبع الـ OTP في terminal. لا تشغّل عليها الـ flows حتى نوصل provider حقيقي (Unifonic / Twilio).
- **Email Provider**: Resend غير مفعّل. التذاكر/الفواتير/إعادة كلمة المرور لا ترسل أي إيميل.
- **Payment Gateway**: `PAYMENT_PROVIDER=mock`. الـ escrow يعمل DB-only؛ لا يوجد تحويل بنكي حقيقي.

---

## 🟢 Stability constraints (لا تخالفها)

- **PWA**: مُعطَّل. كل مرّة فُعِّل وقع المستخدمون في offline trap. مؤجَّل لما بعد v1.0 بـ Workbox/serwist.
- **shared-utils CJS dist**: Node 25 لا يقدر يحمّل `.ts` من main. `package.json.main = dist/index.js`. بعد كل تعديل لـ shared-utils run `pnpm exec tsc` من داخل `packages/shared-utils`.
- **date-fns @2.30.0**: v3+ ESM يكسر CJS bundling. لا ترفّع.
- **Rules of Hooks**: كل الـ hooks قبل أي `if/return`. خاصةً مع SWR الذي يقفز بين undefined ↔ resolved.
- **Per-portal cookies**: localhost cookies تتقاسم عبر الـ ports. كل مفتاح state-حسب-البورتال لازم suffix (`-admin/-client/-provider`).
- **API adapters**: لا تشتغل مباشرة على `data` من SWR. مرّرها على `normalizeOrder/normalizeBid/normalizeService/normalizePayment` أولاً.

---

## 🧪 Smoke test الحالي

19 خطوة موثّقة في `GETTING_STARTED.md` — تغطّي:
1. Client login → wizard → publish order
2. Provider login → opportunities → submit bid مع proposedDeliveryDate
3. Client: تفاصيل dialog → accept
4. Provider: confirm pickup → confirm delivery
5. Admin: status + escrow auto-refresh كل 15 ثانية
6. Client: تأكيد الاستلام → escrow released
7. Disputes / Support tickets / KYC / Payments release / Service add / Location update / Notifications

---

## 📦 Backend modules state

| Module | Controller | Service | Tests | Notes |
|---|---|---|---|---|
| auth | ✅ | ✅ | ✗ | Admin login منفصل عند `/admin/auth/login` |
| companies | ✅ | ✅ | ✗ | KYC + members CRUD |
| orders | ✅ | ✅ | ✗ | List include `bids` selected fields (v0.9.0) + agreedPriceUpfront (v0.9.9) + assignDriver (v0.9.11) |
| bids | ✅ | ✅ | ✗ | `proposedDeliveryDate` (v0.9.0) |
| services | ✅ | ✅ | ✗ | ServiceType enum extended (v0.9.2) |
| payments | ✅ | ✅ | ✗ | List includes `order.client/carrier.nameAr` (v0.9.1) |
| invoices | ✅ | ✅ | ✗ | |
| notifications | ✅ | ✅ | ✗ | |
| tracking | ✅ | ✅ | ✗ | events lifecycle |
| uploads | ✅ | ✅ | ✗ | presigned URLs (UI wiring pending) |
| admin | ✅ | ✅ | ✗ | dashboard/companies/orders/disputes/settings + 6 analytics endpoints (v0.9.14) |
| **disputes** | ✅ | ✅ | ✗ | جديد في v0.9.0 — POST/GET للأطراف |
| **support** | ✅ | ✅ | ✗ | جديد في v0.9.0 — Tickets CRUD |
| addresses | ✅ | ✅ | ✗ | migration مُطبَّقة (20260521043732 + 20260526000000) |
| settings/catalogs | ✅ | — | ✗ | `GET /settings/catalogs` عام (بدون auth) |
| settings/platform | ✅ | — | ✗ | `GET /settings/platform` عام — logo + name (v0.9.9) |

---

## 📝 ملاحظات للجلسة القادمة

- ابدأ بقراءة هذا الملف + `CHANGELOG.md` (v0.9.x entries).
- المستخدم يفضّل: tasks منظّمة، type-check بعد كل تعديل جوهري، toasts بدل alerts، mutate بعد كل mutation.
- لا تكسر الـ stability constraints أعلاه.
- في حال شك حول backend endpoint: `grep -E "@(Get|Post|Put|Delete|Patch)\(" apps/api/src/modules/*/`.

### آخر ما أُنجز (v0.9.13 → v0.9.16 كامل):

- **v0.9.13**: Premium UI/UX — framer-motion على client/provider portals
- **v0.9.14**: Executive KPI Dashboard — 6 analytics endpoints في admin + Bloomberg Terminal + PDF export
- **v0.9.15**: Landing page إعادة كتابة كاملة (animated hero, stats counters, testimonials slider)
- **v0.9.16**: تحويل هوية المنصة من لوجستيات إلى خدمات — 10 مراحل كاملة:
  - مراحل ١-٢: حذف driver app، تحديث التوثيق
  - مرحلة ٣: 72 ملف ترجمة × 4 بورتالات × 2 لغات
  - مرحلة ٤: shared-types + shared-utils (ServiceType، EmployeeStatus، normalizeService، serviceTypeLabels، workflow-engine PROVIDER actor)
  - مراحل ٥-٨: carrier/admin/client/landing portals — provider terminology في الكود
  - مرحلة ٩: API comments/error messages
  - **مرحلة ١٠ ✅**: Prisma schema migration — `ALTER TYPE/TABLE RENAME` طُبّقت على `naqla_dev`، Prisma client أُعيد توليده، 15 ملف API مُحدَّثة، صفر أخطاء TypeScript

### ✅ لا يوجد عمل معلّق — المشروع جاهز لـ v1.0 release
