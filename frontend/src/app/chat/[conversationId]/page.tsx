import type { Metadata } from 'next';
import { ChatWindow } from '@/features/chat/components/ChatWindow';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

/**
 * Dynamic metadata — conversation title shown in browser tab.
 * Will be populated from conversation data in Phase 4.
 */
export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  return {
    title: `Conversation ${conversationId.slice(0, 8)}`,
  };
}

/**
 * Conversation Page — /chat/:conversationId
 *
 * Renders the full chat window for a specific conversation.
 * Message fetching and real-time updates are handled client-side
 * via React Query (useMessages hook) for optimal UX — no server-side
 * data fetching here to avoid blocking navigation.
 *
 * This is an intentional architecture decision: chat apps benefit from
 * optimistic updates and streaming, which require client-side control.
 * SSR data fetching would conflict with streaming message delivery.
 */
export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  return <ChatWindow conversationId={conversationId} />;
}
