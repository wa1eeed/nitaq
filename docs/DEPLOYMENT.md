# 🚀 Deployment — نقلة لوجيستك

دليل النشر للإنتاج، البيئات، وتفاصيل البنية التحتية.

---

## 1. البيئات (Environments)

| البيئة | الغرض | الـ Host | NODE_ENV | الحالة |
|---|---|---|---|---|
| **Development** | تطوير محلي على جهاز المطوّر | `localhost` | `development` | ✅ جاهز |
| **Staging** | اختبار قبل الإنتاج على Coolify | `nqlah.nx.sa` (VPS: `187.124.218.110`) | `staging` | ✅ إعداد `.env.staging` مكتمل |
| **Production** | الخدمة الحيّة للمستخدمين | `nqlah.nx.sa` (نفس VPS، فروع منفصلة) | `production` | 🚧 قيد الإعداد |

### 1.1 فصل قواعد البيانات (مهم جداً)

**كل بيئة لها قاعدة بيانات مستقلة تماماً — لا يوجد مشاركة أبداً:**

| البيئة | الـ Host | الـ DB Name | المستخدم | الملاحظات |
|---|---|---|---|---|
| **Development** | `localhost:5432` | `naqla_dev` | `naqla` | Docker container محلي |
| **Staging** | `sj3y576uqy2ulecbzwydm37l:5432` | `postgres` | `nqlah_db` | Coolify managed PostgreSQL |
| **Production** | TBD (Coolify managed) | `naqla_prod` | TBD | يُنشأ عند الإطلاق |

> ⚠️ **قاعدة صارمة:** لا تشغّل `prisma migrate dev` على staging أو production. استخدم `prisma migrate deploy` فقط.

### 1.2 ملفات الـ Env

اعتباراً من v0.5.0، كل بيئة لها ملف env منفصل، ومتعقَّب في الـ repo فقط بصيغة `.example`:

```
.env.development.example   ← قالب للتطوير المحلي (يُنسخ إلى .env.development)
.env.staging.example       ← قالب staging (يُنسخ إلى .env.staging — gitignored)
.env.production.example    ← قالب production (يُنسخ إلى .env.production — gitignored)
```

الـ runtime يحمّل `.env.${NODE_ENV}` تلقائياً عبر `ConfigModule.forRoot({ envFilePath: [...] })`. إذا غاب الملف، يفشل الـ validation عند الـ bootstrap بدلاً من السماح بتشغيل بقيم خاطئة.

### 1.3 الفروقات بين البيئات

| المتغيّر | Development | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | `localhost:5432/naqla_dev` | Coolify PostgreSQL / `postgres` | Coolify PostgreSQL / `naqla_prod` |
| `REDIS_URL` | `localhost:6379` (Docker) | Coolify Redis | Coolify Redis (منفصل) |
| `APP_DOMAIN` | `localhost` | `nqlah.nx.sa` | `nqlah.nx.sa` |
| `PAYMENT_PROVIDER` | `mock` | `mock` | `moyasar` (إلزامي) |
| `SMS_PROVIDER` | `console` | `console` | `unifonic` (إلزامي) |
| `JWT_SECRET` | ≥ 32 chars | ≥ 64 chars (مولَّد بـ openssl) | ≥ 64 chars + يختلف عن staging |
| `MINIO_USE_SSL` | `false` | `false` | `true` (إلزامي) |
| `MINIO_BUCKET` | `naqla-dev` | `naqla-staging` | `naqla-prod` |
| `CORS_ORIGINS` | `http://localhost:*` | `https://*.nqlah.nx.sa` | `https://*.nqlah.nx.sa` (HTTPS only) |
| `SENTRY_DSN` | اختياري | اختياري | إلزامي |
| `JWT_EXPIRES_IN` | `15m` | `15m` | `15m` |

### 1.3 Env Validation

`apps/api/src/config/env.validation.ts` ينفّذ التحقق التالي عند كل bootstrap:

- ✅ المتغيرات المطلوبة موجودة (12 متغيّر أساسي)
- ✅ `NODE_ENV ∈ {development, staging, production, test}`
- ✅ JWT secrets ≥ min length (يختلف per env)
- ✅ في production: JWT_SECRET ≠ JWT_REFRESH_SECRET
- ✅ providers ∈ القيم المعروفة
- ✅ في production: لا `mock` providers، CORS HTTPS-only، MINIO_USE_SSL=true، SENTRY_DSN موجود

عند الفشل، رسالة الخطأ تجمع كل المشاكل معاً (بدل ما تفشل عند أول مشكلة):

```
❌ Environment validation failed:
  • Missing required env var: REDIS_URL
  • JWT_SECRET must be ≥ 64 chars in production
  • PAYMENT_PROVIDER cannot be "mock" in production
  • MINIO_USE_SSL must be "true" in production
```

### 1.4 إعداد بيئة جديدة (deploy checklist)

1. انسخ القالب المناسب: `cp .env.{env}.example .env.{env}`
2. استبدل كل قيم `PLACEHOLDER` بقيم حقيقية
3. ولّد JWT secrets: `openssl rand -hex 64` (×2 — مختلفان تماماً)
4. تأكد أن `DATABASE_URL` يشير لـ DB منفصلة (لا `naqla_dev` في staging أبداً)
5. تأكد من `MINIO_BUCKET` المناسب (`naqla-staging` / `naqla-prod`)
6. اضبط `CORS_ORIGINS` بدقّة (subdomains الفعلية فقط، لا wildcards)
7. شغّل: `NODE_ENV={env} pnpm --filter @naqla/api start` — الـ validation يجب أن يمرّ
8. طبّق migrations: `npx prisma migrate deploy` (لا `migrate dev` في staging/prod)
9. شغّل seed لو أوّل deploy: `NODE_ENV={env} pnpm db:seed`

---

## 2. Production Server

### 2.1 معلومات الـ Server

| البند | القيمة |
|---|---|
| **IP** | `187.124.218.110` |
| **OS** | TBD (مفترَض Ubuntu 22.04 LTS) |
| **Specs** | TBD |
| **Network** | TBD |
| **Storage** | TBD |
| **Backup** | TBD |

### 2.2 المنافذ المتوقّعة

| Port | الخدمة | متاح خارجياً؟ |
|---|---|---|
| `80` | HTTP (redirect to HTTPS) | ✅ |
| `443` | HTTPS (Nginx / Coolify proxy) | ✅ |
| `5432` | PostgreSQL | ❌ (داخلي فقط) |
| `6379` | Redis | ❌ (داخلي فقط) |
| `9000` | MinIO API | ❌ (داخلي فقط) |
| `9001` | MinIO Console | ❌ (VPN فقط) |
| `4000` | API (internal) | ❌ (عبر proxy) |

### 2.3 النطاقات (Domains)

**الدومين الحالي (Staging + Production):** `nqlah.nx.sa`

| Subdomain | الواجهة | البيئة | TLS |
|---|---|---|---|
| `nqlah.nx.sa` | Landing | Staging/Prod | Let's Encrypt (Coolify) |
| `admin.nqlah.nx.sa` | Admin dashboard | Staging/Prod | Let's Encrypt |
| `app.nqlah.nx.sa` | Client app | Staging/Prod | Let's Encrypt |
| `carrier.nqlah.nx.sa` | Carrier app | Staging/Prod | Let's Encrypt |
| `api.nqlah.nx.sa` | REST API | Staging/Prod | Let's Encrypt |
| `storage.nqlah.nx.sa` | MinIO public objects | Staging/Prod | Let's Encrypt |

> 📌 جميع النطاقات تُدار عبر Coolify مع auto-renewal لـ Let's Encrypt.
> عند الانتقال لدومين رسمي، يكفي تغيير `APP_DOMAIN` في `.env.production` فقط.

---

## 3. Environment Variables — المرجع الكامل

القوالب الجاهزة في الـ repo. الجدول التالي يوضح القيمة المطلوبة لكل بيئة:

### 3.1 Backend API (apps/api)

| المتغيّر | Development | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://naqla:naqla_dev_pass@localhost:5432/naqla_dev` | Coolify PostgreSQL URL | Coolify PostgreSQL URL (مختلف) |
| `REDIS_URL` | `redis://localhost:6379` | Coolify Redis URL | Coolify Redis URL (مختلف) |
| `REDIS_PASSWORD` | _(فارغ)_ | من Coolify | من Coolify (مختلف) |
| `JWT_SECRET` | ≥ 32 chars (dev only) | `openssl rand -hex 64` | `openssl rand -hex 64` (مختلف) |
| `JWT_REFRESH_SECRET` | ≥ 32 chars | `openssl rand -hex 64` | `openssl rand -hex 64` (مختلف) |
| `JWT_EXPIRES_IN` | `15m` | `15m` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | `7d` | `7d` |
| `NODE_ENV` | `development` | `staging` | `production` |
| `PORT` | `4000` | `4000` | `4000` |
| `APP_DOMAIN` | `localhost` | `nqlah.nx.sa` | `nqlah.nx.sa` |
| `APP_URL` | `http://localhost:4000` | `https://api.nqlah.nx.sa` | `https://api.nqlah.nx.sa` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://nqlah.nx.sa` | `https://nqlah.nx.sa` |
| `FRONTEND_CLIENT_URL` | `http://localhost:3002` | `https://app.nqlah.nx.sa` | `https://app.nqlah.nx.sa` |
| `FRONTEND_CARRIER_URL` | `http://localhost:3003` | `https://carrier.nqlah.nx.sa` | `https://carrier.nqlah.nx.sa` |
| `FRONTEND_ADMIN_URL` | `http://localhost:3001` | `https://admin.nqlah.nx.sa` | `https://admin.nqlah.nx.sa` |
| `CORS_ORIGINS` | `http://localhost:300{0-3}` | `https://*.nqlah.nx.sa` (4 subdomains) | `https://*.nqlah.nx.sa` |
| `MINIO_ENDPOINT` | `localhost` | `minio` (Docker service) | `minio` |
| `MINIO_PORT` | `9000` | `9000` | `9000` |
| `MINIO_USE_SSL` | `false` | `false` | `true` (**إلزامي**) |
| `MINIO_ROOT_USER` | `minioadmin` | من Coolify | من Coolify (مختلف) |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | من Coolify | من Coolify (مختلف) |
| `MINIO_BUCKET` | `naqla-dev` | `naqla-staging` | `naqla-prod` |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | `https://storage.nqlah.nx.sa` | `https://storage.nqlah.nx.sa` |
| `PAYMENT_PROVIDER` | `mock` | `mock` | `moyasar` |
| `SMS_PROVIDER` | `console` | `console` | `unifonic` |
| `BCRYPT_ROUNDS` | `12` | `12` | `12` |
| `THROTTLE_TTL` | `60000` | `60000` | `60000` |
| `THROTTLE_LIMIT` | `100` | `100` | `100` |
| `SENTRY_DSN` | _(فارغ)_ | _(فارغ/اختياري)_ | **إلزامي** |

### 3.2 Frontend Apps (Next.js — build-time)

هذه المتغيرات تُحقن في وقت البناء (`next build`) — يجب ضبطها في Coolify قبل الـ deploy:

| المتغيّر | Development | Staging | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://api.nqlah.nx.sa` | `https://api.nqlah.nx.sa` |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:4000` | `wss://api.nqlah.nx.sa` | `wss://api.nqlah.nx.sa` |
| `NEXT_PUBLIC_MINIO_URL` | `http://localhost:9000` | `https://storage.nqlah.nx.sa` | `https://storage.nqlah.nx.sa` |
| `NEXT_PUBLIC_LANDING_URL` | `http://localhost:3000` | `https://nqlah.nx.sa` | `https://nqlah.nx.sa` |
| `NEXT_PUBLIC_CLIENT_URL` | `http://localhost:3002` | `https://app.nqlah.nx.sa` | `https://app.nqlah.nx.sa` |
| `NEXT_PUBLIC_CARRIER_URL` | `http://localhost:3003` | `https://carrier.nqlah.nx.sa` | `https://carrier.nqlah.nx.sa` |

> ⚠️ **تحذير:** `NEXT_PUBLIC_*` تُضمَّن في الـ JavaScript bundle — لا تضع فيها أسراراً أبداً.

---

## 4. Docker Production Build

جميع الـ 5 Dockerfiles جاهزة (multi-stage, Node 20 Alpine, standalone Next.js, non-root user, healthcheck).

### 4.1 قائمة الـ Dockerfiles

| التطبيق | الـ Dockerfile | Strategy | الـ Port |
|---|---|---|---|
| `@naqla/api` | `apps/api/Dockerfile` | NestJS dist + tini | `4000` |
| `@naqla/landing` | `apps/web/landing/Dockerfile` | Next.js standalone | `3000` |
| `@naqla/admin` | `apps/web/admin/Dockerfile` | Next.js standalone | `3001` |
| `@naqla/client` | `apps/web/client/Dockerfile` | Next.js standalone | `3002` |
| `@naqla/carrier` | `apps/web/carrier/Dockerfile` | Next.js standalone | `3003` |

### 4.2 بنية كل Dockerfile

**3 مراحل لكل تطبيق:**

```
Stage 1: deps (node:20-alpine)
  └─ Copy ALL workspace package.json manifests (كل الـ 7 manifests)
  └─ pnpm install --frozen-lockfile=false
     (layer يُعاد استخدامه ما لم تتغير الـ dependencies)

Stage 2: builder (node:20-alpine)
  └─ COPY node_modules من deps (root + app-level + shared-utils)
  └─ COPY . . (source — node_modules محذوفة عبر .dockerignore)
  └─ pnpm --filter @naqla/shared-utils run build  (CJS dist)
  └─ pnpm --filter @naqla/<app> run build

Stage 3: runner (node:20-alpine) ← الصورة النهائية الصغيرة
  └─ apk add --no-cache wget (مطلوب للـ healthcheck)
  └─ Non-root user (nextjs:nodejs uid/gid 1001)
  └─ للـ API: dist/ + node_modules + prisma + tini
  └─ للـ Next.js: .next/standalone + .next/static + public
```

**Next.js Standalone** — لماذا؟
- يحتوي على كل ما يلزم لتشغيل الـ server بدون `next` binary
- لا يحتاج `node_modules` كاملة في الـ runner
- الصورة النهائية أصغر بـ 60–80%
- يُشغَّل بـ `node server.js` فقط

### 4.3 pnpm Monorepo — مشاكل Docker وحلولها

هذه القرارات غير قابلة للتفاوض — نتجت عن أعطال حقيقية في staging:

#### أ. symlinks تنكسر عند COPY

`node_modules` داخل التطبيقات تحتوي symlinks تشير إلى `../../../../node_modules/.pnpm/...`. هذا المسار يتغيّر عند النسخ لـ `/app/` بعمق مختلف — فتنكسر.

**الحل للـ API:** `pnpm deploy --prod /prod` يولّد `node_modules` flat بدون symlinks.
**الحل للـ Next.js:** نسخ `node_modules` مباشرة من مرحلة `deps` (نفس المسار) إلى `builder` — لا symlink breaking.

#### ب. يجب نسخ كل workspace manifests قبل pnpm install

```dockerfile
# ✅ يجب نسخ الـ 7 manifests قبل RUN pnpm install
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/api/package.json apps/api/
COPY apps/web/admin/package.json apps/web/admin/
COPY apps/web/client/package.json apps/web/client/
COPY apps/web/carrier/package.json apps/web/carrier/
COPY apps/web/landing/package.json apps/web/landing/
```

بدون هذا، `pnpm deploy` يفشل لأن `COPY . .` اللاحق يُضيف packages لم يرَها `pnpm install` أبداً.

#### ج. next binary غير موجود في builder

`next` binary يعيش في `apps/web/<app>/node_modules/.bin/`. `.dockerignore` يستثني `node_modules`، لكن `COPY . .` لا ينسخها. الحل: نسخ app-level node_modules من مرحلة deps صراحةً:

```dockerfile
COPY --from=deps /repo/apps/web/landing/node_modules ./apps/web/landing/node_modules
```

#### د. date-fns لا يُرفَع لـ root node_modules

`date-fns` اعتماد لـ `shared-utils` ولا يُرفعه pnpm للـ root. عند `transpilePackages: ['@naqla/shared-utils']`، webpack يحاول resolve المكتبة من سياق التطبيق — فيفشل.

**الحل النهائي في landing:** حذف `@naqla/shared-utils` من `transpilePackages` — webpack يستخدم `dist/index.js` المبني مسبقاً بدلاً من إعادة compile المصدر.

**الحل العميق:** استبدال `date-fns` بالكامل في `shared-utils/src/format.ts` بـ `Intl.DateTimeFormat` و`Intl.RelativeTimeFormat` — لا dependencies خارجية.

#### هـ. Prisma custom output path

بدلاً من `output` الافتراضي (في pnpm store — مسار يتغيّر بين أجهزة)، يُولَّد الـ client في مسار ثابت:

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../src/generated/prisma"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

- `output` ثابت بالنسبة للـ repo — لا مشاكل pnpm store
- `binaryTargets` يشمل Alpine Linux (musl) الذي يستخدمه Docker
- الـ client المولَّد `.js+.d.ts` لا يُجمعه tsc تلقائياً → يُنسخ يدوياً: `RUN cp -r src/generated dist/src/`
- كل imports في الكود تغيّرت من `@prisma/client` إلى `../../generated/prisma`

#### و. تجميع seed.ts في builder

`tsx` devDependency — غير موجود في production container. يُجمَّع `seed.ts` في builder:

```dockerfile
RUN cd /repo/apps/api && node_modules/.bin/tsc \
  --target ES2020 --module commonjs --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir dist/prisma prisma/seed.ts
```

`dist/prisma/seed.js` يصل للـ runtime عبر `COPY dist ./dist` الموجود. يُشغَّل بـ `node dist/prisma/seed.js`.

### 4.3 بناء صورة واحدة (محلياً)

```bash
# من جذر الـ monorepo
docker build -f apps/api/Dockerfile            -t naqla-api:latest       .
docker build -f apps/web/admin/Dockerfile      -t naqla-admin:latest     .
docker build -f apps/web/client/Dockerfile     -t naqla-client:latest    .
docker build -f apps/web/carrier/Dockerfile    -t naqla-carrier:latest   .
docker build -f apps/web/landing/Dockerfile    -t naqla-landing:latest   .
```

> ⚠️ **مهم:** يجب تمرير `NEXT_PUBLIC_*` كـ build-args لأنها تُضمَّن في وقت البناء:
> ```bash
> docker build -f apps/web/client/Dockerfile \
>   --build-arg NEXT_PUBLIC_API_URL=https://api.nqlah.nx.sa \
>   --build-arg NEXT_PUBLIC_CLIENT_URL=https://app.nqlah.nx.sa \
>   -t naqla-client:latest .
> ```
> في Coolify: أضف هذه المتغيرات في قسم "Build Variables" (ليس "Environment Variables").

### 4.4 Health Checks

كل container يُجري healthcheck تلقائياً:

| التطبيق | الـ Endpoint | الـ Interval | Start Period |
|---|---|---|---|
| API | `GET /health` | 30s | 15s |
| Next.js apps | `GET /` | 30s | 30s |

Coolify يعرض الحالة مباشرة. فشل 3 محاولات متتالية → Coolify يعيد تشغيل الـ container تلقائياً.

---

## 5. Coolify Setup

**VPS:** `187.124.218.110` — Coolify مثبَّت.
**GitHub Repo:** `https://github.com/wa1eeed/nqlah-logistic`
**Coolify Project:** `nqlah-logistic`

### 5.1 البنية التحتية المُدارة (Coolify)

| الخدمة | النوع | Staging | Production |
|---|---|---|---|
| **PostgreSQL** | Coolify managed DB | `sj3y576uqy2ulecbzwydm37l:5432` | DB منفصل (يُنشأ لاحقاً) |
| **Redis** | Coolify managed Redis | `q13sf1ivsl14rsphz4155tnh:6379` | Redis منفصل |
| **MinIO** | Docker service | `minio:9000` (داخلي) | `minio:9000` (داخلي) |

### 5.2 Staging Resources (5 تطبيقات)

| الـ Resource Name | الـ Dockerfile | الدومين | الـ Port |
|---|---|---|---|
| `naqla-api-staging` | `apps/api/Dockerfile` | `api.nqlah.nx.sa` | `4000` |
| `naqla-landing-staging` | `apps/web/landing/Dockerfile` | `nqlah.nx.sa` | `3000` |
| `naqla-admin-staging` | `apps/web/admin/Dockerfile` | `admin.nqlah.nx.sa` | `3001` |
| `naqla-client-staging` | `apps/web/client/Dockerfile` | `app.nqlah.nx.sa` | `3002` |
| `naqla-carrier-staging` | `apps/web/carrier/Dockerfile` | `carrier.nqlah.nx.sa` | `3003` |

### 5.3 Build Variables للـ Next.js Apps

هذه المتغيرات تُضاف في **Build Variables** (ليس Environment Variables) لكل Next.js app لأنها تُضمَّن في وقت البناء:

```env
NEXT_PUBLIC_API_URL=https://api.nqlah.nx.sa
NEXT_PUBLIC_WS_URL=wss://api.nqlah.nx.sa
NEXT_PUBLIC_LANDING_URL=https://nqlah.nx.sa
NEXT_PUBLIC_CLIENT_URL=https://app.nqlah.nx.sa
NEXT_PUBLIC_CARRIER_URL=https://carrier.nqlah.nx.sa
NEXT_PUBLIC_MINIO_URL=https://storage.nqlah.nx.sa
```

### 5.4 خطوات التشغيل (أوّل deploy)

```bash
# 1. في Coolify UI — أنشئ Resource لكل تطبيق، اربطه بالـ repo والـ Dockerfile المناسب

# 2. أضف env vars من .env.staging للـ API resource (encrypted)
#    NEXT_PUBLIC_* تذهب كـ Build Variables لكل Next.js app

# 3. أوّل deploy — Coolify يبني الـ Docker image ويشغّله

# 4. طبّق migrations في Coolify terminal للـ API container:
node -e "const{execSync}=require('child_process');execSync('npx prisma@5.22.0 migrate deploy --schema=/app/prisma/schema.prisma',{stdio:'inherit'})"

# 5. شغّل seed (للـ staging — demo accounts):
node dist/prisma/seed.js
```

### 5.5 Auto-Deploy

- كل push لـ `main` → Coolify يعيد البناء والنشر تلقائياً
- الـ migrations تحتاج تشغيل يدوي بعد كل deploy يحتوي تغييرات DB

### 5.6 الروابط الحية (Staging)

| الواجهة | الرابط |
|---|---|
| **API Health** | https://api.nqlah.nx.sa/health |
| **Landing** | https://nqlah.nx.sa |
| **Admin** | https://admin.nqlah.nx.sa |
| **Client** | https://app.nqlah.nx.sa |
| **Carrier** | https://carrier.nqlah.nx.sa |
| **Storage** | https://storage.nqlah.nx.sa |

---

## 6. Database Migrations في الإنتاج

### الـ Workflow الآمن

```bash
# 1. أنشئ migration محلياً
cd apps/api
pnpm prisma migrate dev --name describe_change

# 2. اختبر محلياً
pnpm db:seed
pnpm dev
# تأكّد أن كل شيء يعمل

# 3. ارفع على staging
git push origin staging
# Coolify ينشر تلقائياً
# في staging:
pnpm prisma migrate deploy

# 4. اختبر على staging

# 5. ارفع على production
git checkout main && git merge staging && git push origin main
# Coolify ينشر تلقائياً
# في production:
pnpm prisma migrate deploy  # عبر hook في Coolify
```

### Backups قبل الـ migration
```bash
# Coolify يدير backup يومي تلقائي، لكن قبل أي migration كبير:
docker exec naqla-postgres pg_dump -U naqla naqla_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Script اليومي (`scripts/backup-db.sh`)

أضِفت في v0.5.0 — يدمج `pg_dump` + `gzip` + رفع لـ MinIO في pipeline واحد:

```bash
# تشغيل يدوي
./scripts/backup-db.sh

# مع بيئة محدّدة
NODE_ENV=production ./scripts/backup-db.sh
```

**جدولة كرون (production)** — backup يومي الساعة 2:00 صباحاً UTC:

```cron
0 2 * * *   /opt/naqla/scripts/backup-db.sh >> /var/log/naqla-backup.log 2>&1
```

**ما يفعله:**
1. يحمّل `.env.${NODE_ENV}` (defaults إلى `development`)
2. `pg_dump --no-owner --no-privileges --clean --if-exists` → `gzip -9`
3. يرفع إلى `naqla-backup/${MINIO_BUCKET}/backups/naqla-${env}-${timestamp}.sql.gz`
4. يحذف backups أقدم من `BACKUP_RETENTION_DAYS` (افتراضي 30 يوم)

**متطلبات الـ host:** `pg_dump` (postgresql-client بنفس النسخة الكبيرة للـ DB)، `mc` (MinIO client)، `gzip`.

---

## 7. CI/CD Pipeline

> 🚧 **يُكمل لاحقاً.**
>
> GitHub Actions:
> - [ ] `.github/workflows/ci.yml` — على كل PR:
>   - `pnpm install --frozen-lockfile`
>   - `pnpm lint`
>   - `pnpm test`
>   - `pnpm build`
>   - Type-check across all apps
> - [ ] `.github/workflows/deploy-staging.yml` — على push إلى `staging`
> - [ ] `.github/workflows/deploy-production.yml` — على push إلى `main` (مع manual approval)

---

## 8. Rollback Procedure

> 🚧 **يُكمل لاحقاً.**
>
> - [ ] Rollback عبر Coolify UI (deploy السابق بنقرة)
> - [ ] Rollback لـ database (restore أحدث backup)
> - [ ] Communication plan (Slack channel + status page)

---

## 9. Performance & Scaling

> 🚧 **يُكمل لاحقاً.**
>
> Targets أولية:
> - **API**: < 200ms p95 latency
> - **Web**: < 1.5s LCP, < 100ms INP
> - **DB**: connection pool size 20, query timeout 10s
>
> خطط التوسّع:
> - [ ] Horizontal scaling للـ API (multiple replicas + load balancer)
> - [ ] Read replicas لـ Postgres للقراءات الكثيفة
> - [ ] CDN (Cloudflare) للـ static assets
> - [ ] Image optimization (next/image + S3)
> - [ ] Caching strategy (Redis) للقراءات المتكرّرة

---

## 10. الأمان في الإنتاج

> 📄 راجع: [`SECURITY.md`](./SECURITY.md) (يُكمل في الأمر التالي)

نقاط حرجة قبل الإطلاق:
- [ ] فحص أمني شامل (penetration test)
- [ ] تشفير كل المفاتيح في secrets manager
- [ ] WAF (Cloudflare/AWS) أمام الـ API
- [ ] Rate limiting صارم على endpoints الحسّاسة
- [ ] 2FA إلزامي للأدمن
- [ ] Audit log لكل الإجراءات الإدارية
- [ ] Compliance audit (نظام حماية البيانات السعودي + الزكاة والضريبة)
