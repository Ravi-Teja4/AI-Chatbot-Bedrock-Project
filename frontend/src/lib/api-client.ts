import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * API Client — Axios instance with enterprise-grade configuration
 *
 * Architecture decisions:
 * 1. Single instance shared across all service modules — no duplicate config
 * 2. Request interceptor: attaches auth token when available (future Cognito)
 * 3. Response interceptor: normalizes errors into a consistent ApiError shape
 * 4. Automatic request ID injection for distributed tracing
 * 5. Timeout set at 30s — balances UX with slow AI response times
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const API_TIMEOUT = 30_000; // 30 seconds — AI responses can be slow

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown[];
  requestId?: string;
}

export class ApiException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown[];
  public readonly requestId?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: false, // Will become true when Cognito session cookies are added
  });

  /**
   * Request Interceptor
   * - Injects Authorization header when a token is present (future: Cognito)
   * - Adds a client-side request ID for correlation with backend logs
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Future: retrieve token from AuthContext or cookie
      // const token = getAuthToken();
      // if (token) config.headers.Authorization = `Bearer ${token}`;

      // Client-side request correlation ID
      config.headers['X-Request-ID'] =
        `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  /**
   * Response Interceptor
   * - Extracts the `data` envelope from successful responses
   * - Normalizes all error responses into ApiException instances
   * - Handles 401 (future: trigger token refresh or redirect to login)
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: { message: string; code: string }; meta?: { requestId?: string } }>) => {
      if (!error.response) {
        // Network error — no response received
        throw new ApiException({
          message: 'Unable to reach the server. Please check your connection.',
          code: 'NETWORK_ERROR',
          statusCode: 0,
        });
      }

      const { status, data } = error.response;

      // Future: handle 401 → redirect to login
      // if (status === 401) { router.push('/login'); return; }

      throw new ApiException({
        message: data?.error?.message ?? 'An unexpected error occurred.',
        code: data?.error?.code ?? 'UNKNOWN_ERROR',
        statusCode: status,
        requestId: data?.meta?.requestId,
      });
    },
  );

  return client;
}

export const apiClient = createApiClient();
