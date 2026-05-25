export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    messageEn?: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface LoginRequest {
  phoneOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    email?: string | null;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string | null;
  };
}

export interface RegisterRequest {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  companyType: 'CLIENT' | 'CARRIER';
  companyNameAr: string;
  companyNameEn?: string;
  city: string;
  region: string;
  contactPhone: string;
  contactEmail: string;
}
