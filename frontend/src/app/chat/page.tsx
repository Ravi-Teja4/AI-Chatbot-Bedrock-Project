import type { Metadata } from 'next';
import { WelcomeScreen } from '@/features/chat/components/WelcomeScreen';

export const metadata: Metadata = {
  title: 'New Chat',
};

/**
 * Chat Index Page — /chat
 *
 * Shown when no conversation is selected. Displays the Welcome Screen
 * with suggested prompts and platform overview — identical to ChatGPT's
 * empty state when no conversation is active.
 *
 * When the user sends their first message from here, the frontend:
 * 1. Creates a new conversation via POST /api/v1/conversations
 * 2. Sends the first message via POST /api/v1/conversations/:id/messages
 * 3. Navigates to /chat/:conversationId to render the conversation
 */
export default function ChatIndexPage() {
  return <WelcomeScreen />;
}
