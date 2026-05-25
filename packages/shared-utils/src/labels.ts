export const orderStatusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  PUBLISHED: { ar: 'منشور', en: 'Published' },
  BIDDING: { ar: 'قيد العروض', en: 'Bidding' },
  ASSIGNED: { ar: 'مُسند', en: 'Assigned' },
  CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
  IN_TRANSIT: { ar: 'في الطريق', en: 'In transit' },
  DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
  COMPLETED: { ar: 'مكتمل', en: 'Completed' },
  CANCELLED: { ar: 'ملغى', en: 'Cancelled' },
  DISPUTED: { ar: 'نزاع', en: 'Disputed' },
};

export const truckTypeLabels: Record<string, { ar: string; en: string }> = {
  SMALL_FLATBED: { ar: 'مسطح صغير', en: 'Small flatbed' },
  MEDIUM_FLATBED: { ar: 'مسطح متوسط', en: 'Medium flatbed' },
  LARGE_FLATBED: { ar: 'مسطح كبير', en: 'Large flatbed' },
  REFRIGERATED: { ar: 'مبرد', en: 'Refrigerated' },
  CONTAINER_20: { ar: 'حاوية 20 قدم', en: '20ft container' },
  CONTAINER_40: { ar: 'حاوية 40 قدم', en: '40ft container' },
  TANKER: { ar: 'صهريج', en: 'Tanker' },
  CURTAINSIDER: { ar: 'ستائر جانبية', en: 'Curtainsider' },
  BOX_TRUCK: { ar: 'صندوقية', en: 'Box truck' },
  LOWBED: { ar: 'لوبيد', en: 'Lowbed' },
};

export const cargoTypeLabels: Record<string, { ar: string; en: string }> = {
  GENERAL: { ar: 'بضائع عامة', en: 'General' },
  FOOD: { ar: 'مواد غذائية', en: 'Food' },
  CHEMICALS: { ar: 'مواد كيميائية', en: 'Chemicals' },
  ELECTRONICS: { ar: 'إلكترونيات', en: 'Electronics' },
  FURNITURE: { ar: 'أثاث', en: 'Furniture' },
  CONSTRUCTION: { ar: 'مواد بناء', en: 'Construction' },
  AUTOMOTIVE: { ar: 'قطع سيارات', en: 'Automotive' },
  MEDICAL: { ar: 'مستلزمات طبية', en: 'Medical' },
  HAZARDOUS: { ar: 'مواد خطرة', en: 'Hazardous' },
  FRAGILE: { ar: 'هشة', en: 'Fragile' },
};

export const kycStatusLabels: Record<string, { ar: string; en: string }> = {
  NOT_SUBMITTED: { ar: 'لم يُقدّم', en: 'Not submitted' },
  PENDING: { ar: 'قيد المراجعة', en: 'Pending' },
  APPROVED: { ar: 'معتمد', en: 'Approved' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
};

export const companyStatusLabels: Record<string, { ar: string; en: string }> = {
  PENDING_VERIFICATION: { ar: 'بانتظار التحقق', en: 'Pending verification' },
  ACTIVE: { ar: 'نشط', en: 'Active' },
  SUSPENDED: { ar: 'موقوف', en: 'Suspended' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
};

export const bidStatusLabels: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn' },
  EXPIRED: { ar: 'منتهي', en: 'Expired' },
};
