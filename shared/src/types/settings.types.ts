/**
 * Settings Types
 *
 * Phase 1: Theme preference only.
 * Future: Model selection, language, notification preferences, subscription plan.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserSettings {
  userId: string;
  theme: ThemePreference;
  /** Future: default model for conversations */
  defaultModelId?: string;
  /** Future: language/locale preference */
  locale?: string;
  /** Future: subscription plan */
  plan?: 'free' | 'pro' | 'enterprise';
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  theme?: ThemePreference;
  defaultModelId?: string;
  locale?: string;
}
