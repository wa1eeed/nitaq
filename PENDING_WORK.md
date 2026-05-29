# Pending Work — حالة الربط الحالية (Nitaq Platform)

> آخر تحديث: 2026-05-29 (بعد v0.9.19 — Bug Fix: Opportunity Detail Loading Flash)
>
> الهدف من هذا الملف: نقطة استئناف واضحة. يلخّص ما تبقّى قبل أن نعتبر النظام
> جاهزاً لـ release v1.0.

---

## ✅ مربوط بالـ API (مكتمل)

ربط end-to-end لـ:
- Auth (login/register/refresh/logout + admin login)
- Auto Token Refresh — client + provider يجدّدان الـ token على 401
- Forgot Password / Reset Password — OTP-based (v0.9.18)
- Companies (GET/PUT، members CRUD، KYC submit + approve/reject)
- Orders (CRUD كامل + lifecycle كامل)
- Bids (POST/PUT/accept/reject + negotiation)
- Services (list + create + detail + photo upload)
- Employees (list + detail + invite + assignment)
- Payments (list + release + admin force-release)
- Invoices (list + send)
- Notifications (list + mark-read + mark-all-read)
- Disputes (POST جديد + admin update)
- Support Tickets (POST/GET + admin update)
- Admin dashboard / companies / orders / disputes / transactions / settings
- Reviews — POST/GET بعد COMPLETED (v0.9.18)
- Finance pages (client + provider) — مربوطة بـ `GET /companies/:id/transactions` (v0.9.18)
- Documents page (provider) — مربوطة بـ `GET/POST /companies/:id/kyc` (v0.9.18)
- Audit Logs page (admin) — مربوطة بـ `GET /admin/audit-logs` (v0.9.18)
- Saved Addresses — migration مُطبَّقة
- ON_SITE address picker في new order wizard (v0.9.17+)
- Provider order controls (ASSIGNED → CONFIRMED → IN_TRANSIT → DELIVERED)
- Employee Assignment (`POST /orders/:id/assign-employee`)
- Direct Assignment بسعر ثابت (`agreedPriceUpfront`)
- Dynamic Logo (`GET /settings/platform`)
- Admin reports — 6 analytics endpoints + PDF export (v0.9.14)

---

## 🟡 يحتاج عمل (مرتّب بالأولوية)

### 1. Provider Reports Page — ربط بـ Analytics API
- **الصفحة:** `apps/web/provider/src/app/(app)/reports/page.tsx`
- **الحالة:** رسوم بيانية static (mock)
- **المطلوب:** `GET /companies/:id/analytics` أو إعادة استخدام analytics endpoints الموجودة في admin
- **التعقيد:** منخفض — نفس نمط admin reports

### 2. File Upload حقيقي للمستندات
- **الحالة:** dialog رفع المستندات (provider) يقبل URL نصي فقط
- **المطلوب:** رفع ملف حقيقي → `POST /uploads/presigned` → S3/R2 → حفظ URL
- **ملاحظة:** `uploads module` موجود في الـ API لكن الـ UI لم يُوصَل به
- **التعقيد:** متوسط

### 3. Admin Company Detail — Company Wallet/Transactions
- **الصفحة:** `apps/web/admin/src/app/(app)/companies/[id]/page.tsx`
- **المطلوب:** عرض `walletBalance` + `GET /companies/:id/transactions` داخل تفاصيل الشركة
- **التعقيد:** منخفض — endpoint موجود (v0.9.18)

### 4. Client Tracking Page — تحسين بعد إزالة الخريطة
- **الصفحة:** `apps/web/client/src/app/(app)/tracking/page.tsx`
- **الحالة:** الخريطة محذوفة، يعرض timeline + بيانات الطلب
- **المطلوب:** ربط `GET /tracking/:orderId/events` للـ live events (إن توفّر websocket)
- **التعقيد:** عالٍ — يتطلب WebSocket أو polling

---

## 🔴 مؤجَّل بقرار (ما بعد v1.0)

| الوظيفة | السبب |
|---|---|
| **SMS Provider حقيقي** | حالياً `SMS_PROVIDER=console` — OTP يطبع في terminal. يحتاج Unifonic أو Twilio |
| **Email Provider** | Resend غير مفعّل — لا إيميلات ترسل (تذاكر/فواتير/OTP) |
| **Payment Gateway** | `PAYMENT_PROVIDER=mock` — escrow يعمل DB-only، لا تحويل بنكي حقيقي |
| **WebSocket / Live Updates** | تحديثات الطلبات في الوقت الفعلي — يحتاج `@nestjs/websockets` |
| **PWA** | مُعطَّل — كل مرّة وقع المستخدمون في offline trap |
| **Admin Language/Timezone** | Settings UI موجود لكن يحتاج backend endpoint + i18n framework |
| **Promotions** | Admin promotions page — static UI، ميزة مستقبلية |
| **Test Suite** | لا unit/integration tests على الـ backend — كل modules بدون tests |
| **CI/CD** | لا GitHub Actions pipeline بعد |

---

## 🟢 Stability Constraints (لا تخالفها)

- **PWA:** مُعطَّل. لا تُفعِّله قبل Workbox/serwist.
- **shared-utils CJS dist:** بعد كل تعديل لـ shared-utils → `pnpm exec tsc` من `packages/shared-utils`.
- **date-fns @2.30.0:** لا ترفّع إلى v3+ (يكسر CJS bundling).
- **Rules of Hooks:** جميع hooks قبل أي `if/return` — خاصةً مع SWR.
- **Per-portal cookies:** لكل مفتاح state → suffix (`-admin/-client/-provider`).
- **API adapters:** مرّر data عبر `normalizeOrder/normalizeBid/normalizeService/normalizePayment` قبل الاستخدام.
- **Finance normalizer:** `type→kind`, `balance→balanceAfter`, `createdAt→at`, `companyId→walletId`.

---

## 📦 Backend Modules State

| Module | Controller | Service | Tests | Notes |
|---|---|---|---|---|
| auth | ✅ | ✅ | ✗ | forgot/reset password (v0.9.18) |
| companies | ✅ | ✅ | ✗ | KYC + members + transactions (v0.9.18) |
| orders | ✅ | ✅ | ✗ | lifecycle كامل + assignEmployee |
| bids | ✅ | ✅ | ✗ | proposedDeliveryDate + negotiation |
| reviews | ✅ | ✅ | ✗ | جديد v0.9.18 — POST/GET بعد COMPLETED |
| services | ✅ | ✅ | ✗ | ServiceType enum B2B |
| payments | ✅ | ✅ | ✗ | list + release + force-release |
| invoices | ✅ | ✅ | ✗ | |
| notifications | ✅ | ✅ | ✗ | |
| tracking | ✅ | ✅ | ✗ | events lifecycle |
| uploads | ✅ | ✅ | ✗ | presigned URLs — UI wiring partial |
| admin | ✅ | ✅ | ✗ | audit-logs (v0.9.18) + 6 analytics endpoints |
| disputes | ✅ | ✅ | ✗ | |
| support | ✅ | ✅ | ✗ | |
| addresses | ✅ | ✅ | ✗ | migrations مُطبَّقة |
| settings | ✅ | — | ✗ | catalogs + platform logo/name |

---

## 🧪 Smoke Test (19 خطوة)

موثَّقة في `GETTING_STARTED.md` — تغطّي:
1. Client login → wizard → publish order (OPEN + DIRECT)
2. Provider login → opportunities → submit bid
3. Client: تفاصيل dialog → accept bid
4. Provider: ASSIGNED → CONFIRMED → IN_TRANSIT → DELIVERED
5. Client: تأكيد الاستلام → escrow released
6. Client: تقييم المزوّد بعد COMPLETED ⭐ (v0.9.18)
7. Admin: status + escrow auto-refresh + audit logs
8. Disputes / Support tickets / KYC / Payments release / Services / Notifications
9. Forgot password (جميع البورتالات) → OTP → new password (v0.9.18)

---

## 📝 ملاحظات للجلسة القادمة

- ابدأ بقراءة هذا الملف + `CHANGELOG.md` (v0.9.x entries).
- المستخدم يفضّل: tasks منظّمة، type-check بعد كل تعديل، toasts بدل alerts، mutate بعد كل mutation.
- **المهمة الأقرب لـ v1.0:** ربط SMS حقيقي (Unifonic) حتى تعمل forgot-password فعلياً.
- **المهمة الثانية:** file upload حقيقي للمستندات.
- نوع الخدمة الافتراضي في New Order: `CONSULTING`. يمكن تغييره.
- في حال شك حول backend endpoint: `grep -E "@(Get|Post|Put|Delete|Patch)\(" apps/api/src/modules/*/`.
