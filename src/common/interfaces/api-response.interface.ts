export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiMeta;
  timestamp: string;
  path: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}
