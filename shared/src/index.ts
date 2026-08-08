/**
 * @ai-chat/shared — Public API
 *
 * This is the single entry point for all shared code.
 * Both frontend and backend import exclusively from '@ai-chat/shared'.
 *
 * Organization:
 * - Types: TypeScript interfaces and type aliases (no runtime code)
 * - Schemas: Zod validation schemas (runtime + type inference)
 * - Constants: Shared configuration values
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  ResponseMeta,
  PaginationMeta,
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  PaginatedResponse,
} from './types/api.types';

export type { User, UserProfile } from './types/user.types';

export type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  ConversationGroup,
} from './types/conversation.types';

export type {
  MessageRole,
  Message,
  SendMessageRequest,
  SendMessageResponse,
  StreamChunk,
} from './types/message.types';

export type {
  ThemePreference,
  UserSettings,
  UpdateSettingsRequest,
} from './types/settings.types';

// ── Schemas ────────────────────────────────────────────────────────────────
export {
  createConversationSchema,
  updateConversationSchema,
  MAX_TITLE_LENGTH,
} from './schemas/conversation.schema';

export type {
  CreateConversationInput,
  UpdateConversationInput,
} from './schemas/conversation.schema';

export {
  sendMessageSchema,
  MAX_MESSAGE_LENGTH,
} from './schemas/message.schema';

export type { SendMessageInput } from './schemas/message.schema';

// ── Constants ──────────────────────────────────────────────────────────────
export {
  API_VERSION,
  API_BASE,
  API_ENDPOINTS,
  PAGINATION,
} from './constants/api.constants';

export {
  APP_NAME,
  APP_VERSION,
  MESSAGE,
  CONVERSATION,
  AI,
  THEMES,
} from './constants/app.constants';

export type { Theme } from './constants/app.constants';
