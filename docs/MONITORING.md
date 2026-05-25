# 📊 Monitoring & Observability — نقلة لوجيستك

استراتيجية المراقبة، Alerts، وUptime tracking للمنصة.

> 🚧 **هذا المستند placeholder.** التفاصيل الكاملة ستُكمل في مرحلة الإطلاق للإنتاج.

---

## 1. الـ Stack المخطّط

| الأداة | الغرض | الحالة |
|---|---|---|
| **Sentry** | Error tracking + Performance | 🚧 لم يُفعّل |
| **UptimeRobot** | Uptime monitoring + alerts | 🚧 لم يُفعّل |
| **Logflare / Loki** | Centralized logs | 🚧 لم يُحدّد |
| **Grafana** | Dashboards + metrics | 🚧 لم يُفعّل |
| **Prometheus** | Metrics collection | 🚧 لم يُفعّل |
| **PostgreSQL slow query log** | DB performance | 🚧 لم يُفعّل |

---

## 2. Sentry Setup

> 🚧 **يُكمل لاحقاً.**
>
> ### المخطّط
>
> - [ ] إنشاء project Sentry لكل تطبيق:
>   - `naqla-api` (Node)
>   - `naqla-admin` (Next.js)
>   - `naqla-client` (Next.js)
>   - `naqla-carrier` (Next.js)
>   - `naqla-landing` (Next.js)
> - [ ] **DSN لكل** عبر env var `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
> - [ ] **Source maps** يُرفعون عند `pnpm build`
> - [ ] **Release tracking** — تاغ لكل deploy
> - [ ] **User context** — userId + role في كل event
> - [ ] **Performance tracing** — 10% sampling
> - [ ] **PII scrubbing** — Sentry data scrubbers على client side
>
> ### Alerts المهمّة
> - [ ] Error rate > 1% في 5 دقائق → Slack `#alerts`
> - [ ] Single error happened > 100 مرّة في ساعة → Slack
> - [ ] New issue من نوع `critical` → PagerDuty (للأدمن)
> - [ ] Performance regression > 50% → Slack

---

## 3. UptimeRobot

> 🚧 **يُكمل لاحقاً.**
>
> ### Monitors المخطّطة (HTTP/HTTPS, 1 دقيقة interval)
>
> | Monitor | URL | الإجراء عند الفشل |
> |---|---|---|
> | [ ] API Health | `https://api.naqla.sa/health` | Slack + Email + SMS |
> | [ ] Landing | `https://naqla.sa` | Slack + Email |
> | [ ] Admin | `https://admin.naqla.sa/login` | Slack + Email |
> | [ ] Client | `https://app.naqla.sa/login` | Slack + Email |
> | [ ] Carrier | `https://carrier.naqla.sa/login` | Slack + Email |
> | [ ] DB connectivity | `https://api.naqla.sa/health/db` | PagerDuty |
> | [ ] Redis connectivity | `https://api.naqla.sa/health/redis` | PagerDuty |
> | [ ] MinIO connectivity | `https://api.naqla.sa/health/storage` | PagerDuty |
>
> ### Status Page
> - [ ] Public status page على `status.naqla.sa`
> - [ ] Components: API, Web Apps, Database, Storage, Notifications
> - [ ] Incident communication

---

## 4. Logs (Centralized)

> 🚧 **يُكمل لاحقاً.**
>
> ### الحالة الحالية
> - logs محلية في console فقط
> - لا centralization

### المخطّط
- [ ] **Loki** + Grafana stack أو **Logflare** (Cloudflare)
- [ ] **Log levels**: error, warn, info, debug
- [ ] **Structured logging** (JSON) في الإنتاج
- [ ] **Request ID** correlation عبر كل الـ stack
- [ ] **Log retention**: 30 يوم للـ app logs
- [ ] **PII scrubbing** قبل التخزين
- [ ] **Querying** عبر LogQL أو SQL-like

### Log shape (مخطّط)
```json
{
  "timestamp": "2026-05-16T10:30:00.000Z",
  "level": "info",
  "service": "api",
  "module": "orders",
  "requestId": "uuid",
  "userId": "usr_...",
  "companyId": "co_...",
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 201,
  "durationMs": 145,
  "message": "Order created",
  "metadata": { "orderId": "ord_..." }
}
```

---

## 5. Metrics & Dashboards

> 🚧 **يُكمل لاحقاً.**
>
> ### Application Metrics
> - [ ] HTTP request rate per endpoint
> - [ ] HTTP error rate (4xx, 5xx)
> - [ ] HTTP latency (p50, p95, p99)
> - [ ] Active WebSocket connections
> - [ ] Background job queue depth
> - [ ] DB query latency
> - [ ] DB connection pool usage
> - [ ] Redis memory usage
>
> ### Business Metrics
> - [ ] Orders created / hour
> - [ ] Bids submitted / hour
> - [ ] Active in-transit orders
> - [ ] Escrow held amount
> - [ ] Failed payments
> - [ ] New signups / day
> - [ ] KYC approval rate
>
> ### Infrastructure Metrics
> - [ ] CPU / Memory per container
> - [ ] Disk usage (Postgres + MinIO)
> - [ ] Network I/O
>
> ### Dashboards
> - [ ] **Engineering dashboard** — system health
> - [ ] **Business dashboard** — KPIs (راجع [KPIs.md](./KPIs.md))
> - [ ] **Executive dashboard** — exec summary

---

## 6. Alerting Channels

> 🚧 **يُكمل لاحقاً.**
>
> | Severity | الإشعار | الجمهور |
> |---|---|---|
> | **Critical** | PagerDuty + SMS + Slack | On-call engineer |
> | **High** | Slack + Email | Engineering team |
> | **Medium** | Slack | Engineering channel |
> | **Low** | Daily digest email | Engineering |
>
> ### قواعد التصنيف
> - **Critical**: API down, DB down, security breach, payment failure storm
> - **High**: Error rate spike, latency degradation > 2x baseline
> - **Medium**: Single feature degraded, slow endpoint
> - **Low**: Minor warnings, deprecation notices

---

## 7. SLAs & SLOs

> 🚧 **يُكمل لاحقاً.**
>
> ### Targets الأولية
> - **API Uptime**: 99.9% (~43 دقيقة down/شهر)
> - **API Latency p95**: < 200ms
> - **Web LCP**: < 1.5s
> - **DB query p95**: < 50ms
> - **Time to first notification**: < 5s (in-app), < 30s (email/SMS)
>
> ### Error budget
> - 0.1% / month = ~43 minute monthly budget
> - عند استنفاد > 50% → freeze new feature deploys

---

## 8. Health Checks

### الحالة الحالية
- ✅ `GET /health` — basic ping على الـ API

### المخطّط
- [ ] `GET /health/live` — liveness (process is running)
- [ ] `GET /health/ready` — readiness (DB + Redis + MinIO reachable)
- [ ] `GET /health/db` — database query test
- [ ] `GET /health/redis` — redis ping
- [ ] `GET /health/storage` — MinIO bucket check
- [ ] Kubernetes-compatible (إذا انتقلنا لـ k8s)

---

## 9. Runbooks

> 🚧 **يُكمل لاحقاً.**
>
> Runbooks مطلوبة لكل سيناريو:
> - [ ] API بطيء / down
> - [ ] DB connection pool exhausted
> - [ ] Redis OOM
> - [ ] MinIO out of disk
> - [ ] High error rate
> - [ ] SSL certificate expiry
> - [ ] Failed deployment rollback
> - [ ] Data breach response

---

## 10. Monitoring قبل الإطلاق — Checklist

- [ ] Sentry فعّال لكل التطبيقات الـ 5
- [ ] UptimeRobot monitors فعّالة
- [ ] Slack `#alerts` + `#incidents` channels جاهزة
- [ ] PagerDuty integration (للـ on-call)
- [ ] Status page منشور
- [ ] Runbooks موثّقة
- [ ] On-call rotation منشور
- [ ] أوّل incident drill (chaos engineering) أُجري
