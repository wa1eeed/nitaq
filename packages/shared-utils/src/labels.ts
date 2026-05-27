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
  CONSULTING: { ar: 'استشارات', en: 'Consulting' },
  DESIGN: { ar: 'تصميم', en: 'Design' },
  INSTALLATION: { ar: 'تركيب وتنصيب', en: 'Installation' },
  MAINTENANCE: { ar: 'صيانة', en: 'Maintenance' },
  TECHNICAL_SUPPORT: { ar: 'دعم تقني', en: 'Technical Support' },
  TRAINING: { ar: 'تدريب', en: 'Training' },
  IT_SERVICES: { ar: 'خدمات تقنية', en: 'IT Services' },
  LOGISTICS: { ar: 'لوجستيات', en: 'Logistics' },
  PROJECT_MANAGEMENT: { ar: 'إدارة مشاريع', en: 'Project Management' },
  OTHER: { ar: 'أخرى', en: 'Other' },
};
export const serviceCategoryLabels = serviceTypeLabels;
/** @deprecated use serviceTypeLabels */
export const truckTypeLabels = serviceTypeLabels;
/** @deprecated use serviceCategoryLabels */
export const cargoTypeLabels = serviceTypeLabels;

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
