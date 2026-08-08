/**
 * API Response Types — Shared Contract
 *
 * These types define the exact shape of every HTTP response from the backend.
 * Both the backend response formatter (utils/response.ts) and the frontend
 * API client (lib/api-client.ts) reference these types.
 *
 * Any change to the response envelope here is a breaking change that must be
 * coordinated across both services.
 */

/** Meta block included in every response */
export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

/** Pagination block included in list responses */
export interface PaginationMeta {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

/** Success response envelope */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
  pagination?: PaginationMeta;
}

/** Error response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  meta: ResponseMeta;
}

/** Union of success and error responses — used in generic API call wrappers */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/** Paginated response — list operations always return this shape */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: PaginationMeta;
};
