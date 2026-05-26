# 🚀 دليل البدء — Nitaq Platform

دليل تشغيل منصة نيطاق محلياً خطوة بخطوة، من صفر إلى لوحات تحكم شغّالة.

---

## 1. المتطلبات الأساسية

| الأداة | الإصدار الأدنى | للتحقق |
|---|---|---|
| **Node.js** | ≥ 20.0 | `node -v` |
| **pnpm** | ≥ 9.0 | `pnpm -v` |
| **Docker Desktop** | أحدث نسخة | `docker --version` |
| **Git** | أي إصدار حديث | `git --version` |

```bash
# إذا لم يكن pnpm مثبتاً:
npm install -g pnpm

# تأكّد أن Docker Desktop يعمل (أيقونة الحوت الزرقاء في شريط النظام)
```

---

## 2. الحصول على الكود

```bash
git clone <repo-url> nitaq-platform
cd nitaq-platform
```

---

## 3. تثبيت الاعتماديات

```bash
pnpm install
```

> ⏱️ هذه الخطوة تستغرق ~2 دقيقة في أول مرة. تستخدم pnpm الـ workspace لإدارة 9 مشاريع: 4 تطبيقات Next.js + Backend API + 3 packages مشتركة.

---

## 4. تشغيل البنية التحتية (Docker)

```bash
pnpm docker:up
```

هذا يشغّل 3 حاويات في الخلفية:

| الحاوية | الـ Port | الغرض |
|---|---|---|
| `nitaq-postgres` | `5432` | قاعدة البيانات الرئيسية |
| `nitaq-redis` | `6379` | Cache + Sessions + Rate-limit |
| `nitaq-minio` | `9000` (API), `9001` (Console) | تخزين الملفات (S3-compatible) |

**للتأكد**:
```bash
docker ps
# يجب أن ترى الحاويات الثلاث بحالة "healthy"
```

---

## 5. متغيّرات البيئة

اعتباراً من v0.5.0 المنصة تدعم **3 بيئات منفصلة**:

| البيئة | الملف | الاستخدام |
|---|---|---|
| Development | `.env.development` | تطوير محلي، mock providers، secrets قصيرة OK |
| Staging | `.env.staging` | محاكاة الإنتاج، HTTPS، Sentry مفعّل |
| Production | `.env.production` | إنتاج فعلي، live providers، MinIO SSL إلزامي |

### للتشغيل المحلي

```bash
# انسخ قالب التطوير إلى الجذر
cp .env.development.example .env.development

# أو إلى .env إذا تريد الـ fallback الافتراضي
cp .env.development.example .env
```

ConfigModule يحمل `.env.${NODE_ENV}` أولاً ثم `.env` كـ fallback. الافتراضي `NODE_ENV=development`.

### قوالب الـ env

كل ملف `.env.*.example` يحوي القيم الموصى بها لتلك البيئة:
- **dev:** `SMS_PROVIDER=console`, `PAYMENT_PROVIDER=mock`, JWT secrets قصيرة (32+ char)
- **staging:** HTTPS-only، Sentry DSN، secrets طويلة (64+ char)، providers `console` للاختبار
- **prod:** كل التشديدات — `PAYMENT_PROVIDER=moyasar`, `SMS_PROVIDER=unifonic`, `MINIO_USE_SSL=true`, ولا أي قيمة `mock`

### Env Validation

عند الـ bootstrap يفحص `apps/api/src/config/env.validation.ts`:
- وجود المتغيرات المطلوبة
- صحة قيم NODE_ENV / providers / ports
- طول الـ JWT secrets
- تشديدات الـ production (HTTPS، SSL، providers حقيقية، Sentry موجود)

لو فيه خطأ، الـ API يفشل بتسجيل دخول مع رسالة واضحة بكل المشاكل دفعة واحدة.

> ⚠️ **التفاصيل الكاملة**: راجع [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) (قسم Three Environments).

---

## 6. إعداد قاعدة البيانات

> ⚠️ **تحذير macOS**: إذا كان لديك PostgreSQL مثبّت عبر Homebrew، توقّف عنه أولاً لتجنّب تعارض المنافذ مع Docker:
> ```bash
> brew services stop postgresql@16   # أو الإصدار المثبّت لديك
> ```

```bash
# توليد عميل Prisma
pnpm db:generate

# تطبيق الـ schema (يُنشئ كل الجداول)
pnpm db:migrate

# تعبئة البيانات التجريبية (شركات، طلبات، حسابات seed)
pnpm db:seed
```

> ✅ بعد هذه الخطوة قاعدة البيانات تحوي:
> - 3 حسابات seed (Admin / Client / Provider)
> - ~10 شركات (عملاء + مقدّمو الخدمات)
> - ~15 طلب بحالات مختلفة
> - ~20 خدمة و~10 موظفين
> - عينة عروض، فواتير، نزاعات

---

## 7. تشغيل كل التطبيقات

```bash
pnpm dev
```

يشغّل **Turbo** كل التطبيقات بالتوازي:
- API على `:4000`
- Landing على `:3000`
- Admin على `:3001`
- Client على `:3002`
- Provider على `:3003`

> ⏱️ أول compile يستغرق ~30 ثانية لكل تطبيق. الـ HMR (Hot Module Replacement) يعمل بعدها.

---

## 8. تسجيل الدخول

### 🔑 حسابات الاختبار

| الدور | البريد | كلمة المرور | الرابط |
|---|---|---|---|
| **Admin** | `admin@nitaq.sa` | `Admin@1234` | http://localhost:3001/login |
| **Client** | `client@nitaq.sa` | `Client@1234` | http://localhost:3002/login |
| **Provider** | `provider@nitaq.sa` | `Provider@1234` | http://localhost:3003/login |

---

## 9. الروابط بعد التشغيل

| الواجهة | الرابط |
|---|---|
| 🌍 **Landing** (الصفحة التسويقية) | http://localhost:3000 |
| 🔵 **Admin** (لوحة الإدارة) | http://localhost:3001 |
| 🟡 **Client** (تطبيق العميل) | http://localhost:3002 |
| 🟢 **Provider** (تطبيق مقدّم الخدمة) | http://localhost:3003 |
| ⚙️ **API** | http://localhost:4000 |
| 📚 **API Docs** (Swagger) | http://localhost:4000/docs |
| 🗄️ **MinIO Console** | http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`) |

---

## 10. الإيقاف والتنظيف

```bash
# إيقاف تطبيقات pnpm dev: Ctrl+C في الـ terminal

# إيقاف Docker
pnpm docker:down

# (اختياري) مسح كل البيانات (postgres + redis + minio)
docker compose down -v
```

---

## 🧪 Smoke Test — تجربة الـ Workflow الكامل (v0.9.0)

بعد ما تشغّل البنية وتعمل migrate + seed، تقدر تجرّب workflow OPEN order كامل end-to-end على DB حقيقية:

| # | الواجهة | الإجراء |
|---|---|---|
| 1 | http://localhost:3002/login | login عميل: `client@nitaq.sa` / `Client@1234` |
| 2 | `/orders/new` | املأ الـ wizard خطوة بخطوة → اضغط "إرسال الطلب" |
| 3 | http://localhost:3003/login | login مقدّم الخدمة: `provider@nitaq.sa` / `Provider@1234` |
| 4 | `/opportunities` | تشوف الطلب الجديد — تابي السوق المفتوح يلمع بـ badge |
| 5 | `/opportunities/<id>` | أدخل سعر + موعد التسليم المقترح + خدمة → "إرسال العرض" (toast نجاح) |
| 6 | (عميل) `/orders/<id>` | تشوف العرض — اضغط "تفاصيل" → نافذة فيها معلومات مقدّم الخدمة + 3 أزرار (قبول/رفض/إغلاق) |
| 7 | (عميل) | اضغط "قبول" → الطلب ينتقل لـ ASSIGNED + Request Progress Card يظهر مع التتبّع |
| 8 | (مقدّم الخدمة) `/orders/<id>` | الـ RequestStatusCard يظهر — اضغط "تأكيد البدء" (toast) |
| 9 | (مقدّم الخدمة) | اضغط "تأكيد الإنجاز" (toast) |
| 10 | http://localhost:3001 (admin) | login admin: `admin@nitaq.sa` / `Admin@1234` — افتح الطلب → AdminEscrowSummary + Request Status + auto-refresh كل 15ث |
| 11 | (عميل) | يظهر EscrowCountdown — اضغط "تأكيد الاستلام" |

**اختبارات v0.9.0 الجديدة:**

| # | الواجهة | الإجراء |
|---|---|---|
| 12 | (عميل) `/disputes` → فتح نزاع جديد | اختر طلب ASSIGNED+ → POST /disputes → toast نجاح |
| 13 | (admin) `/disputes/<id>` | "تعيين" + "حل" → PUT /admin/disputes/:id → toast |
| 14 | (admin) `/kyc` | اعتماد شركة → PUT /admin/companies/:id/status → toast |
| 15 | (admin) `/payments` | زر "إفراج" على HELD → POST /payments/:id/release → toast |
| 16 | (مقدّم الخدمة) `/services/new` | املأ النموذج → POST /services → toast + redirect |
| 17 | (مقدّم الخدمة/عميل) `/support` | إنشاء تذكرة → POST /support/tickets → toast |
| 18 | (مقدّم الخدمة) `/notifications` | اضغط على إشعار → PUT /notifications/:id/read → mutate |
| 19 | (مقدّم الخدمة) `/orders/<id>` (IN_TRANSIT) | "تحديث الموقع" → POST /orders/:id/tracking → toast + يظهر للعميل |

**تحقّق من الـ DB أن كل خطوة تأثّرت فعلاً:**

```bash
docker exec -it nitaq-postgres psql -U nitaq -d nitaq_dev -c \
  'SELECT "orderNumber", status, "agreedPrice" FROM "Order" ORDER BY "createdAt" DESC LIMIT 3;'
```

> 💡 لو الـ API ما يشتغل لأي سبب، الـ frontend ينزل تلقائياً للـ mock fallback ولا ينكسر — لكن المعاملات ما تنحفظ.

---

## 👥 نظام أعضاء الفريق (Team & Roles)

كل حساب شركة (عميل أو مقدّم خدمة) يضمّ عدّة أعضاء بأدوار مختلفة. مصدر الحقيقة لمصفوفة الصلاحيات: `packages/shared-utils/src/mock-data.ts` (`CLIENT_ROLE_PERMISSIONS` / `PROVIDER_ROLE_PERMISSIONS`).

### الأدوار

| الدور | للعميل | لمقدّم الخدمة | يستطيع |
|---|:---:|:---:|---|
| **OWNER** 👑 | ✅ | ✅ | كل شيء — لا يمكن حذفه/تعديله |
| **ADMIN** 👑 | ✅ | ✅ | كل شيء عدا حذف المالك |
| **STAFF** 📦 | ✅ | — | إنشاء وتتبع الطلبات (لا إلغاء، لا فريق) |
| **DISPATCH** 🔧 | — | ✅ | قبول طلبات + إدارة خدمات وموظفين |
| **FINANCE** 💰 | ✅ | ✅ | عرض المالية + export (R/O على الطلبات) |

### كيف يضيف المالك/المدير عضواً

1. افتح **الإعدادات**:
   - عميل: `http://localhost:3002/settings`
   - مقدّم الخدمة: `http://localhost:3003/settings`
2. **تبويب "الفريق"** → زر **"إضافة عضو"**
3. املأ: الاسم، الجوال (إلزامي)، الإيميل (اختياري)
4. **اختر الدور** من البطاقات (كل بطاقة تعرض ✅ ما يستطيع + ❌ ما لا يستطيع)
5. اضغط **"إضافة"** — يصل العضو SMS بالرابط لتفعيل حسابه

### Endpoints الـ Team

```bash
GET    /api/companies/:id/members
POST   /api/companies/:id/members        # OWNER + ADMIN فقط
PUT    /api/companies/:id/members/:userId
DELETE /api/companies/:id/members/:userId
```

### Guards

- **Backend**: `@CompanyRoles('OWNER', 'ADMIN') + @UseGuards(CompanyRoleGuard)`
- **Frontend**: المكوّن `TeamTab` يفحص `currentRole` ويخفي/يعرض الـ actions

📄 **التفاصيل الكاملة**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) قسم 12

---

## 🌍 الترجمة (i18n)

المنصة تدعم **العربية** (افتراضية، RTL) و **English** (LTR).

### ملفات الترجمة
- مكان الـ master: `messages/{ar|en}/*.json` على الـ root
- لكل تطبيق نسخة محلية في `apps/web/<app>/messages/` (يقرأها next-intl)
- 10 ملفات لكل لغة، **468 مفتاحاً** متطابقاً

### الـ Switchers
| التطبيق | المكان | السلوك |
|---|---|---|
| **Landing** | navbar + `LocaleSwitcher` | URL يتغيّر إلى `/ar` أو `/en` |
| **Admin** | `/settings` → "تفضيلات العرض" | Cookie + revalidate |
| **Client** | `/company` → "الإعدادات الشخصية" | Cookie + revalidate |
| **Provider** | `/company` → "الإعدادات الشخصية" | Cookie + revalidate |
| **Onboarding** | أعلى `/register` | بطاقة 🇸🇦/🇬🇧 |

### إضافة مفتاح ترجمة جديد

1. أضف المفتاح في `messages/ar/<file>.json` و `messages/en/<file>.json`
2. انسخ الملفات للتطبيقات المعنية:
   ```bash
   for app in admin client carrier landing; do
     cp messages/ar/*.json apps/web/$app/messages/ar/
     cp messages/en/*.json apps/web/$app/messages/en/
   done
   ```
3. تحقّق من المساواة:
   ```bash
   pnpm check:i18n
   ```
4. استخدم المفتاح في الكود:
   ```tsx
   import { useTranslations } from 'next-intl';
   const t = useTranslations('common');
   return <button>{t('buttons.save')}</button>;
   ```

### إضافة لغة ثالثة (مثال: أوردو)

1. أضف `messages/ur/*.json` لكل الملفات الـ 10
2. حدّث `SUPPORTED_LOCALES` في `src/i18n.ts` لكل تطبيق
3. حدّث `src/navigation.ts` (landing) + `src/middleware.ts` (landing)
4. أضف الخيار في `LanguageSelector` و `LocaleSwitcher`
5. شغّل `pnpm check:i18n` للتأكد من اكتمال الترجمة

---

## 🛠️ أوامر مفيدة

| الأمر | الوصف |
|---|---|
| `pnpm dev` | تشغيل كل التطبيقات (HMR) |
| `pnpm build` | بناء الإنتاج لكل التطبيقات |
| `pnpm lint` | فحص الكود |
| `pnpm format` | تنسيق الكود (Prettier) |
| `pnpm test` | تشغيل الاختبارات |
| `pnpm check:i18n` | التحقّق من اكتمال الترجمة (ar↔en) |
| `pnpm docker:up` | تشغيل Postgres + Redis + MinIO |
| `pnpm docker:down` | إيقاف الـ infrastructure |
| `pnpm docker:logs` | متابعة logs الحاويات |
| `pnpm db:generate` | توليد عميل Prisma |
| `pnpm db:migrate` | تطبيق migrations |
| `pnpm db:seed` | تعبئة البيانات التجريبية |
| `pnpm --filter @nitaq/api dev` | تشغيل الـ API فقط |
| `pnpm --filter @nitaq/admin dev` | تشغيل الـ Admin فقط |
| `pnpm --filter @nitaq/client dev` | تشغيل الـ Client فقط |
| `pnpm --filter @nitaq/provider dev` | تشغيل الـ Provider فقط |

---

## 🐛 استكشاف الأخطاء

### "Cannot connect to Postgres"
```bash
# تأكّد أن Docker شغّال
docker ps

# إذا الحاويات لم تبدأ:
pnpm docker:up
```

### "Port already in use" (3000/3001/3002/3003/4000)
```bash
# اعثر على العملية على الـ port
lsof -ti:3000 | xargs kill -9
# (كرّر للـ ports الأخرى عند الحاجة)
```

### "Prisma Client not generated"
```bash
pnpm db:generate
```

### "Next.js cache corruption" (404 أو 500 عشوائية، أو خطأ "Cannot find module './XXXX.js'")
```bash
# الـ reset الكامل (يحلّ 95% من حالات الـ 500 العشوائية):
pkill -f "next dev"
rm -rf apps/web/*/.next
pnpm dev
```
ثم في المتصفّح: **Cmd+Shift+R** (hard refresh).

### "ERR_MODULE_NOT_FOUND: Cannot find module .../shared-utils/src/format"
Node 25+ لا يقدر يحمّل ملفات `.ts` مباشرة. لازم تبني shared-utils للـ dist:
```bash
pnpm --filter @nitaq/shared-utils build
```
ثم أعد تشغيل `pnpm dev`. (turbo dev يبني shared-utils تلقائياً، لكن لو شغّلت API منفرداً، يحتاج build يدوي).

### "أنت غير متصل بالإنترنت" تظهر دائماً (PWA stuck)
كانت مشكلة قديمة من v0.7.0 (مُلغاة في v0.8.0). لو لازال يحصل لمستخدم بعد update، الـ `OnlineStatusBar` على mount يلغي أي SW قديم تلقائياً. لو ما يشتغل:
1. افتح DevTools (Cmd+Option+I)
2. Application tab → Service Workers → "Unregister" لكل SW
3. Application tab → Storage → "Clear site data"
4. Cmd+Shift+R

### "Rendered more hooks than during the previous render"
خطأ Rules of Hooks. مكان الشائع: useMemo/useState مكتوب **بعد** `if (!data) return ...`. الإصلاح:
```tsx
// نقل كل الـ hooks فوق الـ early return
const memoized = useMemo(() => (data ? compute(data) : []), [data]);  // hook
if (!data) return <NotFound />;  // ← early return AFTER all hooks
```

### MinIO console فارغ
- المرة الأولى تحتاج إنشاء bucket باسم `nitaq-uploads` يدوياً من الكونسول.

---

---

## 🐳 بناء صور Docker للإنتاج

إذا كنت تريد اختبار الـ Docker images محلياً قبل الـ deploy على Coolify:

### المتطلبات

- Docker Desktop (يعمل)
- البناء يتم من **جذر الـ monorepo** (المجلد الذي يحتوي `pnpm-workspace.yaml`)

### بناء صورة واحدة

```bash
# من /nitaq-platform (جذر المشروع)
docker build -f apps/api/Dockerfile -t nitaq-api:latest .

# مع متغيرات build للـ Next.js apps
docker build -f apps/web/client/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 \
  -t nitaq-client:latest .
```

### تشغيل container بعد البناء

```bash
# API
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://nitaq:nitaq_dev_pass@host.docker.internal:5432/nitaq_dev" \
  -e REDIS_URL="redis://host.docker.internal:6379" \
  -e JWT_SECRET="dev-secret-key-min-32-chars-ok" \
  -e JWT_REFRESH_SECRET="dev-refresh-secret-min-32-ch" \
  -e NODE_ENV=production \
  nitaq-api:latest

# Client (Next.js standalone)
docker run -p 3002:3002 nitaq-client:latest
```

> على macOS، استخدم `host.docker.internal` للوصول لـ localhost من داخل الـ container.

### الـ Health Checks

كل container يُشغّل healthcheck تلقائياً:

```bash
# تحقق من حالة container
docker inspect --format='{{json .State.Health}}' <container_id> | python3 -m json.tool
```

### ملاحظات مهمة

- `NEXT_PUBLIC_*` تُضمَّن في وقت البناء — غيّرها يعني إعادة البناء
- الصور تستخدم user غير root (`nextjs` uid 1001) لأمان أفضل
- كل صورة تحتوي healthcheck — Coolify يُعيد تشغيلها تلقائياً عند الفشل

📄 **التفاصيل الكاملة**: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Section 4

---

## 📖 الخطوة التالية

- اطّلع على **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** لفهم البنية الكاملة
- جرّب الـ **[Workflow](./docs/ARCHITECTURE.md#order-workflow)** كاملاً: عميل ينشر طلب → مقدّم الخدمة يقدّم عرض → عميل يقبل → إلخ
- استكشف الـ **[API endpoints](./docs/API.md)** عبر Swagger UI على `:4000/docs`

🎉 **استمتع بالاستكشاف!**
