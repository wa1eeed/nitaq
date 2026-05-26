export const orderStatusLabels: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  PUBLISHED: { ar: 'منشور', en: 'Published' },
  BIDDING: { ar: 'قيد العروض', en: 'Bidding' },
  ASSIGNED: { ar: 'مُسند', en: 'Assigned' },
  CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
  IN_TRANSIT: { ar: 'قيد التنفيذ', en: 'In progress' },
  DELIVERED: { ar: 'مكتمل', en: 'Completed' },
  COMPLETED: { ar: 'مغلق', en: 'Closed' },
  CANCELLED: { ar: 'ملغى', en: 'Cancelled' },
  DISPUTED: { ar: 'نزاع', en: 'Disputed' },
};

export const serviceTypeLabels: Record<string, { ar: string; en: string }> = {
  SMALL_FLATBED: { ar: 'استشارات', en: 'Consulting' },
  MEDIUM_FLATBED: { ar: 'تصميم', en: 'Design' },
  LARGE_FLATBED: { ar: 'تركيب', en: 'Installation' },
  REFRIGERATED: { ar: 'صيانة', en: 'Maintenance' },
  CONTAINER_20: { ar: 'دعم تقني', en: 'Technical Support' },
  CONTAINER_40: { ar: 'تدريب', en: 'Training' },
  TANKER: { ar: 'خدمات تقنية', en: 'IT Services' },
  CURTAINSIDER: { ar: 'لوجستيات', en: 'Logistics' },
  BOX_TRUCK: { ar: 'إدارة مشاريع', en: 'Project Management' },
  LOWBED: { ar: 'أخرى', en: 'Other' },
};
/** @deprecated use serviceTypeLabels */
export const truckTypeLabels = serviceTypeLabels;

export const serviceCategoryLabels: Record<string, { ar: string; en: string }> = {
  GENERAL: { ar: 'خدمات عامة', en: 'General Services' },
  FOOD: { ar: 'تموين وأغذية', en: 'Catering & Food' },
  CHEMICALS: { ar: 'مواد كيميائية', en: 'Chemicals' },
  ELECTRONICS: { ar: 'تقنية ومعلومات', en: 'Technology & IT' },
  FURNITURE: { ar: 'تركيب وتجميع', en: 'Installation & Assembly' },
  CONSTRUCTION: { ar: 'إنشاء وهندسة', en: 'Construction & Engineering' },
  AUTOMOTIVE: { ar: 'سيارات ونقليات', en: 'Automotive' },
  MEDICAL: { ar: 'رعاية صحية', en: 'Healthcare' },
  HAZARDOUS: { ar: 'مواد متخصصة', en: 'Specialized Materials' },
  FRAGILE: { ar: 'قابل للكسر', en: 'Fragile' },
};
/** @deprecated use serviceCategoryLabels */
export const cargoTypeLabels = serviceCategoryLabels;

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
