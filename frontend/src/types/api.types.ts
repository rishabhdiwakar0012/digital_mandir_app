// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ==================== Pagination Types ====================

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
