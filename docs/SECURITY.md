# 🔒 Security — نقلة لوجيستك

سياسة الأمان والامتثال للمنصة. كل ما هو **مُطبَّق فعلياً** في `apps/api` يُذكر صراحة مع موقع الكود، وما زال في الـ roadmap مُعلَّم بـ `[ ]`.

---

## 1. Authentication & Authorization

### 1.1 JWT Strategy ✅ مُطبَّق

**الموقع**: `apps/api/src/modules/auth/`

- **Access Token**: HS256، عمر افتراضي **15 دقيقة** (`JWT_ACCESS_TTL`)
- **Refresh Token**: UUID مزدوج، عمر **7 أيام** (`JWT_REFRESH_TTL`)، مخزّن في `RefreshToken` table
- **Token Rotation**: على كل `POST /api/auth/refresh`، الـ refresh token القديم يُعلَّم `isRevoked` ويُصدر زوج جديد
- **Replay detection**: استخدام refresh token مُلغى يُعتبر سرقة محتملة → **revoke جميع جلسات المستخدم** + سجل في AuditLog (`auth.refresh.replay_detected`)
- **Token blacklist (Redis)**: 
  - الـ `jti` لكل access token مخزّن مع TTL = ما تبقى من عمره
  - عند logout → revoke الـ access (jti) + revoke refresh
  - عند تغيير كلمة المرور أو revoke admin → `revokeAllForUser` يُسجّل cutoff IAT في Redis
- **Guard**: `JwtAuthGuard` يتحقّق من:
  1. التوقيع
  2. الـ jti **ليس** في blacklist
  3. الـ iat ≥ user cutoff (إن وُجد)

```
apps/api/src/common/security/token-blacklist.service.ts    # Redis-backed revocation
apps/api/src/common/guards/jwt-auth.guard.ts               # blacklist check
apps/api/src/modules/auth/auth.service.ts                  # rotation logic
```

### 1.2 RBAC (Role-Based Access Control) ✅ مُطبَّق جزئياً

**الموقع**: `apps/api/src/common/decorators/roles.decorator.ts` + `roles.guard.ts`

- الأدوار من Prisma enum `UserRole`:
  `SUPER_ADMIN, ADMIN, CLIENT_ADMIN, CLIENT_USER, CARRIER_ADMIN, CARRIER_USER, DRIVER`
- `@Roles(...)` decorator + `RolesGuard` على controller أو method
- مثال: `@Roles('ADMIN', 'SUPER_ADMIN')` على كل الـ `/admin/*`

### 1.3 Admin Authentication ✅ مُطبَّق

**الموقع**: `apps/api/src/modules/auth/admin-auth.{controller,service}.ts`

نقطة دخول منفصلة عن المستخدمين العاديين:

```
POST /api/admin/auth/login    { email, password }
POST /api/admin/auth/logout
```

- **إيميل + كلمة مرور فقط** — لا OTP، لا SMS
- **يقبل فقط** الأدوار `ADMIN` أو `SUPER_ADMIN`
- **5 محاولات فاشلة / 30 دقيقة → block** (Redis-backed)
- **كل محاولة** (نجاح أو فشل) تُسجَّل في AuditLog مع IP + User-Agent
- token يحمل `isAdmin: true` flag للـ frontend
- المستخدم العادي يحاول دخول `/api/auth/login` بحساب أدمن → **يُرفض** بـ `USE_ADMIN_LOGIN` (يمنع leak عبر lockouts)

### 1.4 Onboarding — Phone-First ✅ مُطبَّق

**الموقع**: `apps/api/src/modules/auth/dto/register.dto.ts` + `auth.service.register()`

**الخيار A (الافتراضي والأساسي) — رقم الجوال**:
- يدخل المستخدم رقم سعودي (تحقّق Regex: `+966 5XX XXXXXXX` أو `05XX XXXXXXX`)
- يُرسَل OTP بـ **6 أرقام** عبر SMS
- صلاحية **10 دقائق** (`OTP_TTL_SECONDS = 600`)
- single-use — يُمسَح من Redis بعد التحقّق
- **حد الإرسال**: 3 رسائل / ساعة / رقم (anti-abuse)

**الخيار B (اختياري) — البريد الإلكتروني**:
- يقبل DTO إيميلاً اختيارياً عند التسجيل
- **لا يُرسَل أبداً OTP عبر البريد**
- التحقّق من البريد لاحقاً (placeholder — لو احتجناه يكون عبر magic link، ليس OTP)
- يمكن إضافته من إعدادات الحساب بعد التسجيل

**رقم الجوال إلزامي** دائماً (للتواصل والإشعارات). البريد اختياري كلياً.

**موافقة قانونية**: 3 checkboxes إلزامية في الـ DTO (`acceptedTerms`, `acceptedPrivacy`, `acceptedTransport`) — تُسجَّل في AuditLog عند التسجيل.

```
apps/api/src/common/security/otp.service.ts                # phone-only OTP
```

### 1.5 Password Requirements ✅ مُطبَّق

**الموقع**: `apps/api/src/common/validators/strong-password.validator.ts`

`@IsStrongPassword()` على كل `password` في الـ DTOs:
- **8 أحرف** على الأقل
- حرف **كبير** (A–Z)
- حرف **صغير** (a–z)
- **رقم** (0–9)
- **رمز خاص** (!@#$%^&*…)
- رسالة خطأ عربية تذكر بالضبط ما هو ناقص
- Hashed بـ **bcrypt** (salt rounds من `BCRYPT_ROUNDS`، افتراضي 12)

### 1.6 Login Lockout ✅ مُطبَّق

**الموقع**: `apps/api/src/common/security/login-attempt.service.ts`

Redis sliding window per identifier:

| Scope | الحد | النافذة | مدة الـ block |
|---|---|---|---|
| **user** (client/carrier) | 5 محاولات | 15 دقيقة | **15 دقيقة** |
| **admin** | 5 محاولات | 15 دقيقة | **30 دقيقة** |

- الـ counter يُمسَح فور نجاح الدخول (لا يُعاقَب المستخدم على typo سابق)
- الـ counter يكون **per email/phone** (ليس per IP) — يمنع المهاجم من قفل ضحية بمحاولات من IPs مختلفة، لكن يحد من brute-force.
- محاولات فشل الأدمن تُسجَّل **بالكامل** في AuditLog (`admin.login.failed`)

### 1.7 2FA للأدمن

> 🚧 **لم يُطبَّق بعد.** التصميم: TOTP (Google Authenticator/Authy) + 10 backup codes، إلزامي على كل `ADMIN`/`SUPER_ADMIN`.

---

## 2. Rate Limiting ✅ مُطبَّق

**Stack**: `@nestjs/throttler` + Redis في الإنتاج.
**الموقع**: `app.module.ts` (global) + `@Throttle()` decorators (per-endpoint).

### 2.1 الـ Global Limit
- **100 request/دقيقة/IP** (default `THROTTLE_LIMIT=100`, `THROTTLE_TTL=60000`)

### 2.2 الـ Per-Endpoint Limits (مُطبَّقة)

| Endpoint | Limit | Window | الموقع |
|---|---|---|---|
| `POST /api/auth/login` | **5** | 15 دقيقة | `auth.controller.ts` |
| `POST /api/auth/register` | **3** | 1 ساعة | `auth.controller.ts` |
| `POST /api/auth/send-otp` | **3** | 1 ساعة | `auth.controller.ts` |
| `POST /api/auth/verify-phone` | **10** | 1 ساعة | `auth.controller.ts` |
| `POST /api/admin/auth/login` | **5** | 30 دقيقة | `admin-auth.controller.ts` |
| `POST /api/uploads/presign` | **10** | 1 دقيقة | `uploads.controller.ts` |

> Throttling إضافي per-identifier على login (5 → block) في `LoginAttemptService`. الـ Throttler على IP، الـ LoginAttempt على الإيميل/الجوال — كل واحد يحمي زاوية مختلفة.

---

## 3. Helmet + Security Headers ✅ مُطبَّق

**الموقع**: `apps/api/src/main.ts`

```ts
app.use(helmet({
  contentSecurityPolicy: isProd ? { ... strict directives ... } : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
```

الهيدرات المُرسَلة:

| Header | القيمة |
|---|---|
| `X-Content-Type-Options` | `nosniff` ✅ |
| `X-Frame-Options` | `DENY` ✅ |
| `X-XSS-Protection` | `1; mode=block` ✅ |
| `Strict-Transport-Security` | فقط في production ✅ |
| `Content-Security-Policy` | strict في production ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` ✅ |
| `Cross-Origin-Opener-Policy` | `same-origin` ✅ |

---

## 4. CORS ✅ مُطبَّق

**الموقع**: `apps/api/src/main.ts` (`isAllowedOrigin`)

**Origins المسموح بها**:
- **Development**: `http://localhost:{3000,3001,3002,3003}` (hardcoded)
- **Production**: `naqla.sa` + `*.naqla.sa` (https only)
- **إضافية**: من env `CORS_ORIGINS` (comma-separated)
- **لا wildcard `*` أبداً** — كل origin يُمرّ بـ predicate `isAllowedOrigin` ويُرفض إذا لم يطابق

```ts
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
credentials: true
maxAge: 86400  // 24h preflight cache
```

origin محظور → console warning + رفض الـ preflight.

---

## 5. ValidationPipe Global ✅ مُطبَّق

**الموقع**: `apps/api/src/main.ts`

```ts
new ValidationPipe({
  whitelist: true,              // حذف الحقول غير المعرّفة في الـ DTO
  forbidNonWhitelisted: true,    // رفض الطلب إن أرسل حقولاً إضافية
  transform: true,               // تحويل types تلقائياً
  transformOptions: { enableImplicitConversion: true },
  stopAtFirstError: false,       // إرجاع كل الأخطاء، ليس فقط الأول
});
```

يحمي من:
- Mass assignment (لا أحد يمرّر `role`/`isAdmin` من body)
- Type confusion (string vs number coercion)
- Unexpected payloads

---

## 6. File Upload Security ✅ مُطبَّق

**الموقع**: `apps/api/src/common/security/file-validation.ts`

### 6.1 الأنواع المسموحة
| Extension | MIME | Magic bytes |
|---|---|---|
| `.jpg` / `.jpeg` | `image/jpeg` | `FF D8 FF` |
| `.png` | `image/png` | `89 50 4E 47 0D 0A 1A 0A` |
| `.pdf` | `application/pdf` | `25 50 44 46` (`%PDF`) |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `50 4B 03 04` + body contains `xl/` |

### 6.2 Validation Layers
1. **Presign request** (`uploads.controller.ts`):
   - `@IsIn(ALLOWED_CONTENT_TYPES)` — يرفض headers مزوّرة عند الـ presign
   - `isAllowedExtension(filename)` — يرفض الامتدادات غير المسموحة
   - `sizeBytes ≤ 10 MB` (`MAX_UPLOAD_BYTES`)
   - filename sanitization (`/[^\w.\-]/g` → `_`)
2. **Post-upload verification** (`uploads.service.verifyUploadedObject`):
   - يجلب أول 4 KB من الـ object
   - يتحقّق من **magic bytes الحقيقية** عبر `validateUploadBuffer`
   - يرفض الـ object إذا لم يطابق أي توقيع
3. **حد الحجم**: 10 MB hard cap

### 6.3 Rate Limiting
- 10 presign / دقيقة / IP

---

## 7. Audit Logs ✅ مُطبَّق

**الموقع**: `apps/api/src/common/audit/`

### 7.1 الـ Service
```ts
audit.record({
  userId, action, resourceType, resourceId,
  ipAddress, userAgent, metadata,
});
```

### 7.2 الـ Decorator + Interceptor
```ts
@Audit({ action: 'order.publish', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
@Post(':id/publish')
publish(@Param('id') id: string) { ... }
```

التلقائي:
- يُلتقَط `userId` من `req.user`
- IP من `X-Forwarded-For` أو `req.ip`
- User-Agent من header
- Resource ID من param/body/response (حسب `idFrom`)
- Body snapshot **مع redaction** لـ `password`, `token`, `otp`, `secret`, `apiKey`

### 7.3 الأحداث المُسجَّلة حالياً

| الفئة | الـ Action | الموقع |
|---|---|---|
| **Auth** | `auth.register`, `auth.login`, `auth.logout`, `auth.refresh.replay_detected` | `auth.service.ts` |
| **Admin Auth** | `admin.login.success`, `admin.login.failed`, `admin.logout` | `admin-auth.service.ts` |
| **Orders** | `order.create`, `order.publish`, `order.assign`, `order.confirm`, `order.cancel` | `orders.controller.ts` |
| **Payments** | `payment.release` | `payments.controller.ts` |
| **KYC** | `kyc.submit`, `kyc.review` | `companies.controller.ts` |
| **Admin** | `admin.company.status_change`, `admin.dispute.update`, `admin.settings.update` | `admin.controller.ts` |
| **Uploads** | `upload.presign` | `uploads.controller.ts` |
| **Users** | `user.profile.update` | `users.controller.ts` |
| **PDPL** | `pdpl.export`, `pdpl.delete` | `users.service.ts` |

كل إدخال يحوي: `userId, action, resourceType, resourceId, ipAddress, userAgent, metadata, createdAt`.

---

## 8. PDPL Compliance ✅ مُطبَّق جزئياً

**نظام حماية البيانات السعودي**.

### 8.1 المُطبَّق

| المتطلّب | الحالة | الموقع |
|---|---|---|
| **Consent management** | ✅ | `register.dto.ts` (3 checkboxes إلزامية، مُسجَّلة في AuditLog) |
| **Right to access / data portability** | ✅ | `POST /api/users/me/export` → JSON كامل |
| **Right to erasure** | ✅ | `DELETE /api/users/me` → soft delete + anonymisation + session revoke |
| **Audit trail** | ✅ | كل وصول للبيانات الحساسة في `AuditLog` |
| **Data retention** | ✅ جزئي | السجلات المالية تبقى 7 سنوات بعد الحذف (تعليق في `users.service.deleteOwnAccount`) |
| **Right to rectify** | ✅ | `PATCH /api/users/me` |

### 8.2 المحفوظ من الحذف
- الـ `Invoice`, `Payment`, `Transaction`, `AuditLog` تبقى **مجهولة الهوية** (الـ user أصبح `حساب محذوف`) لكن غير محذوفة — متطلب نظام الزكاة والضريبة.

### 8.3 ما زال يُكمل
- [ ] **Column-level encryption** للحقول الحساسة (national ID, IBAN) — حالياً `bcrypt` للكلمات السر فقط
- [ ] **DPO endpoint** للتواصل (`dpo@naqla.sa`)
- [ ] **Cross-border transfer** controls
- [ ] **PIA** (Privacy Impact Assessment) document
- [ ] **Breach notification** automation (72-hour)

---

## 9. Other Defenses ✅ مُطبَّق

### 9.1 SQL Injection
- ✅ **Prisma parametrized queries** — لا يُكتب أي SQL يدوياً
- ✅ كل الـ queries تستخدم Prisma Client (محصّن built-in)

### 9.2 Mass Assignment
- ✅ `whitelist + forbidNonWhitelisted` في ValidationPipe
- ✅ DTOs لا تحوي `role`/`isAdmin`/`companyId` كحقول قابلة للإرسال
- ✅ Audit interceptor يخفي السرّيّات قبل التخزين

### 9.3 Cookie Security
- ✅ `cookie-parser` + httpOnly cookies للـ refresh tokens (في الإنتاج)
- [ ] `SameSite=Strict` + `Secure` flag — مطبّق في production فقط

### 9.4 CSRF
- [ ] CSRF tokens للـ state-changing operations عبر cookie session — حالياً نعتمد على Bearer tokens فقط

---

## 10. خارطة الطريق

> هذه هي الحوكمات التي **لم تُطبَّق بعد** وستُنفّذ في الأوامر القادمة.

- [ ] **TOTP 2FA** للأدمن
- [ ] **Column encryption** (`pgcrypto`) لـ IBAN، الهوية، الجوازات
- [ ] **CSRF tokens** للـ same-site flows
- [ ] **WAF** (Cloudflare/AWS) أمام API في الإنتاج
- [ ] **Common-passwords blocklist** (HaveIBeenPwned integration)
- [ ] **Password rotation** للأدمن كل 90 يوم
- [ ] **Security.txt** + bug bounty
- [ ] **Penetration test** سنوي + Snyk/Trivy scans في CI
- [ ] **Centralized logging** (Loki) + tamper-evident chain
- [ ] **DDoS protection** على مستوى الـ edge

---

## 11. Compliance Checklist

| المتطلّب | الحالة |
|---|---|
| **PDPL** — نظام حماية البيانات السعودي | ✅ جزئي (الجوهر مُطبَّق، التشفير TBD) |
| **الزكاة والضريبة** — احتفاظ 7 سنوات | ✅ مُطبَّق في deleteOwnAccount |
| **SAMA** (لو ندمج مدفوعات محلية) | 🚧 |
| **ISO 27001** | 🚧 |
| **SOC 2 Type II** | 🚧 |
| **AML** | 🚧 |

---

## 12. الـ Files المرتبطة

```
apps/api/src/
├── main.ts                                          # Helmet + CORS + Validation
├── app.module.ts                                    # ThrottlerGuard + JwtAuthGuard global
├── common/
│   ├── audit/
│   │   ├── audit-log.service.ts
│   │   ├── audit.decorator.ts
│   │   ├── audit.interceptor.ts
│   │   └── audit.module.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts                        # blacklist check
│   │   └── roles.guard.ts                           # RBAC
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── security/
│   │   ├── file-validation.ts                       # magic bytes
│   │   ├── login-attempt.service.ts                 # Redis lockout
│   │   ├── otp.service.ts                           # phone OTP only
│   │   └── token-blacklist.service.ts
│   └── validators/
│       └── strong-password.validator.ts
└── modules/auth/
    ├── auth.controller.ts                           # phone-first + throttling
    ├── auth.service.ts                              # JWT rotation + audit + lockout
    ├── admin-auth.controller.ts                     # admin-only login
    ├── admin-auth.service.ts                        # 30-min lockout + full audit
    └── dto/
        ├── register.dto.ts                          # phone required, email optional
        ├── login.dto.ts
        └── admin-login.dto.ts
```
