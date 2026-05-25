# 📈 KPIs — مؤشّرات الأداء الرئيسية

المؤشّرات التي تقيس نجاح منصة نقلة لوجيستك على مستوى الـ Marketplace، المالية، التشغيل، النمو، وعلاقات المستثمرين.

---

## 1. Marketplace KPIs

### 1.1 GMV (Gross Merchandise Volume)
**التعريف**: إجمالي قيمة الطلبات المُسدّدة عبر المنصة (قبل خصم العمولة).
**الصيغة**: `Σ(agreedPrice for orders with status ∈ {COMPLETED, DELIVERED})`
**التكرار**: يومياً / شهرياً / ربع سنوي

### 1.2 Take Rate
**التعريف**: نسبة العمولة الفعلية من GMV.
**الصيغة**: `(totalCommission / GMV) × 100`
**الهدف**: 8% ± 1% (مع تحييد تأثير العروض الترويجية)

### 1.3 Completion Rate
**التعريف**: نسبة الطلبات التي وصلت لـ `COMPLETED` من إجمالي المُنشأة.
**الصيغة**: `count(COMPLETED) / count(all created) × 100`
**الهدف**: > 90%

### 1.4 Supply Liquidity (سيولة الجانب الناقل)
**التعريف**: متوسط عدد العروض على كل طلب مفتوح.
**الصيغة**: `avg(bidCount for orders with mode=OPEN)`
**الهدف**: > 3 عروض / طلب (مؤشّر منافسة صحّية)

### 1.5 Matching Time
**التعريف**: متوسط الزمن من نشر طلب إلى قبول عرض.
**الصيغة**: `avg(acceptedAt - publishedAt)`
**الهدف**: < 2 ساعة

### 1.6 Carrier Utilization
**التعريف**: نسبة استخدام أسطول الناقلين النشطين.
**الصيغة**: `avg(truck.tripsInPeriod / capacity) × 100`
**الهدف**: 60-80% (لتجنّب التحميل الزائد أو الخمول)

### 1.7 مؤشّرات إضافية للـ Marketplace
- **Order Fill Rate** — نسبة الطلبات التي حصلت على عرض واحد على الأقل
- **Cancellation Rate** — نسبة الطلبات المُلغاة
- **Repeat Order Rate** — نسبة العملاء الذين أنشأوا طلباً ثانياً خلال 30 يوم
- **Average Order Value (AOV)** — `GMV / count(orders)`

---

## 2. Financial KPIs

### 2.1 Revenue (الإيراد)
**التعريف**: إيراد المنصة من العمولات + رسوم الاشتراك (لاحقاً).
**الصيغة**: `Σ(commission - VAT remitted)`
**التكرار**: شهري / ربع سنوي / سنوي

### 2.2 CAC (Customer Acquisition Cost)
**التعريف**: تكلفة اكتساب عميل جديد (B2B).
**الصيغة**: `(marketing spend + sales spend) / new customers acquired`
**الهدف**: < ¼ من LTV

### 2.3 LTV (Lifetime Value)
**التعريف**: متوسط الإيراد المتوقّع من عميل خلال علاقته بالمنصة.
**الصيغة**: `ARPU × gross margin × avg customer lifetime months`
**الهدف**: LTV : CAC ≥ 4:1

### 2.4 Burn Rate
**التعريف**: صافي الإنفاق الشهري (cash out - cash in).
**الصيغة**: `monthly opex + capex - monthly revenue`
**التكرار**: شهري

### 2.5 Runway
**التعريف**: عدد الأشهر المتبقية قبل استنفاد السيولة.
**الصيغة**: `cash on hand / burn rate`
**الهدف**: > 18 شهر (مطمئن للمستثمرين)

### 2.6 مؤشّرات إضافية
- **MRR / ARR** — Monthly / Annual Recurring Revenue (لو أضفنا اشتراكات)
- **Gross Margin** — `(Revenue - COGS) / Revenue`
- **Operating Margin** — قبل الفوائد والضرائب
- **Cash Conversion Cycle** — مدّة دورة Escrow

---

## 3. Operational KPIs

### 3.1 On-Time Delivery
**التعريف**: نسبة الطلبات المُسلَّمة في الوقت المتّفق عليه.
**الصيغة**: `count(deliveredAt ≤ expectedAt) / count(delivered) × 100`
**الهدف**: > 95%

### 3.2 Dispute Rate
**التعريف**: نسبة الطلبات التي فُتح عليها نزاع.
**الصيغة**: `count(disputes) / count(orders) × 100`
**الهدف**: < 2%

### 3.3 مؤشّرات إضافية
- **Dispute Resolution Time** — متوسط الزمن لإغلاق نزاع
- **First Response Time (Support)** — متوسط الزمن لأوّل رد على تذكرة
- **NPS** (Net Promoter Score) — للعملاء والناقلين
- **KYC Approval Time** — متوسط زمن اعتماد شركة جديدة
- **Carrier Acceptance Rate** — نسبة الطلبات المباشرة المقبولة من الناقلين

---

## 4. Growth KPIs

### 4.1 MoM Growth (Month-over-Month)
**التعريف**: نسبة نمو شهري في مؤشّر معيّن (GMV / Orders / Users / ...).
**الصيغة**: `(current - previous) / previous × 100`
**الهدف**: > 15% خلال السنة الأولى

### 4.2 QoQ Growth (Quarter-over-Quarter)
**التعريف**: نمو ربع سنوي.
**الهدف**: > 40% خلال السنة الأولى

### 4.3 Geographic Expansion
**التعريف**: تغطية الجغرافيا — عدد المدن النشطة + GMV لكل مدينة.
**المتابعة**:
- عدد المدن التي شُحنت منها / إليها شحنة واحدة على الأقل
- ترتيب المدن حسب حجم النشاط
- نسبة GMV خارج الرياض/جدة (لتجنّب التركيز)

### 4.4 مؤشّرات إضافية
- **New Customer Acquisitions / week**
- **New Carrier Onboardings / week**
- **Active Users (DAU / WAU / MAU)**
- **Marketplace Density** — نسبة الناقلين النشطين لكل مدينة
- **Conversion Funnel** — Visit → Signup → KYC → First Order

---

## 5. Investor-Facing KPIs

### 5.1 Cohort Retention
**التعريف**: نسبة العملاء/الناقلين من cohort معيّن (شهر التسجيل) الذين لا يزالون نشطين بعد N شهر.
**العرض**: cohort matrix (rows = signup month, columns = months since)

### 5.2 Unit Economics
**التعريف**: ربحية الطلب الواحد.
- **Revenue per order** — متوسط العمولة
- **Cost per order** — تكلفة الـ payment processing + support + storage
- **Contribution Margin** — `(Revenue - variable costs) / Revenue`
- **Payback Period** — `CAC / monthly contribution per customer`

### 5.3 مؤشّرات إضافية
- **Market Share** — نسبة من إجمالي سوق النقل البري السعودي
- **Penetration** — نسبة الشركات المسجّلة في النقل التي على المنصة
- **Network Effects metric** — تحسّن KPIs مع كثافة الـ supply/demand
- **Investor Updates** — تقرير ربع سنوي مهيكل (Highlights, Lowlights, KPIs, Asks)

---

## 6. Tracking & Reporting

### 6.1 Tracking Stack (مخطّط)
- [ ] **Mixpanel / Amplitude** — product analytics + funnels
- [ ] **Metabase** — internal BI على Postgres
- [ ] **Hubspot / HighLevel** — CRM للـ B2B sales
- [ ] **Mailchimp / Brevo** — email marketing

### 6.2 Internal Dashboards
- [ ] Engineering dashboard — راجع [`MONITORING.md`](./MONITORING.md)
- [ ] Operations dashboard — KPIs اليومية للفريق
- [ ] Sales dashboard — funnel + leads + conversions
- [ ] Finance dashboard — cash + revenue + burn

---

## 7. Executive Dashboard

> 🚧 **يُكمل لاحقاً.**
>
> الـ Dashboard التنفيذي سيكون صفحة داخل لوحة الأدمن أو tool خارجي (Metabase/Looker) مع:
> - [ ] **Headline metrics** — GMV, Active users, Open disputes (نظرة 5 ثوان)
> - [ ] **Trend charts** — آخر 12 شهر لكل KPI رئيسي
> - [ ] **Goal tracking** — أهداف الـ quarter + progress
> - [ ] **Alerts** — انحراف جوهري عن target
> - [ ] **Cohort tables** — retention
> - [ ] **Geographic heatmap** — نشاط المدن
> - [ ] **Filter by**: time range, segment, geo

---

## 8. Investor Export — PDF

> 🚧 **يُكمل لاحقاً.**
>
> ميزة export شهرية/ربعية تُولّد PDF احترافي للمستثمرين:
> - [ ] **Cover page** — Logo + period + highlights
> - [ ] **Executive summary** — 1 صفحة (achievements + asks)
> - [ ] **KPI dashboard** — كل المؤشّرات أعلاه في صفحة واحدة
> - [ ] **Cohort analysis** — retention matrix
> - [ ] **Unit economics breakdown**
> - [ ] **Financial summary** — P&L + cash position
> - [ ] **Geographic breakdown**
> - [ ] **Roadmap snapshot** — what's next
>
> التنفيذ: استخدام `puppeteer` لتحويل HTML report إلى PDF + saved مهيكل في MinIO.

---

## 9. Reporting Cadence

| التقرير | التكرار | الجمهور | الأداة |
|---|---|---|---|
| Daily ops snapshot | يومياً 8 ص | Operations team | Slack digest |
| Weekly engineering review | أسبوعياً | Eng team | Notion |
| Monthly KPIs review | شهرياً | Leadership | Metabase + meeting |
| Quarterly Board update | كل 3 أشهر | Board + Investors | PDF (مولّد آلياً) |
| Annual review | سنوياً | جميع المستثمرين | PDF + شريحة عرض |

---

## 10. الـ Definitions القياسية (Glossary)

- **Active Order**: طلب بحالة ∈ {PUBLISHED, BIDDING, ASSIGNED, CONFIRMED, IN_TRANSIT}
- **Completed Order**: status ∈ {DELIVERED, COMPLETED}
- **Active User**: مستخدم سجّل دخولاً خلال الـ 30 يوماً الماضية
- **Active Carrier**: ناقل قبل عرضاً واحداً على الأقل خلال الـ 30 يوماً
- **Customer**: شركة عميل (Company with kind=CLIENT)
- **GMV**: قيمة الطلبات المُسدّدة (excluding cancelled)
- **VAT**: 15% (السعودية)
- **Take Rate**: 8% (default platform commission)
