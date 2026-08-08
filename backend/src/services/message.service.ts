import { messageRepository } from '@/repositories/message.repository';
import { conversationRepository } from '@/repositories/conversation.repository';
import { toMessageDTO, type MessageDTO } from '@/models/message.model';
import { parsePaginationParams } from '@/utils/pagination';
import { createLogger } from '@/utils/logger';
import type { SendMessageInput } from '@/validators/message.validator';

const log = createLogger('MessageService');

export interface ListMessagesServiceResult {
  messages: MessageDTO[];
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface SendMessageResult {
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
}

/**
 * Message Service — Business Logic Layer
 *
 * Orchestrates the send-message flow:
 * 1. Validate conversation exists and belongs to user
 * 2. Persist user message to DynamoDB
 * 3. Generate AI response (Phase 1: mock response)
 * 4. Persist assistant message to DynamoDB
 * 5. Increment conversation messageCount (x2)
 * 6. Return both messages to controller
 *
 * Phase 6 — Bedrock integration:
 * Step 3 becomes: call BedrockService.invoke(conversationId, message)
 * with the last N messages as context window
 */
export class MessageService {
  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendMessageInput,
  ): Promise<SendMessageResult> {
    // Step 1: Verify conversation ownership
    await conversationRepository.findById(userId, conversationId);

    log.info(
      { userId, conversationId, contentLength: input.content.length },
      'Processing message',
    );

    // Step 2: Persist user message
    const userMessage = await messageRepository.create({
      conversationId,
      role: 'user',
      content: input.content,
    });

    await conversationRepository.incrementMessageCount(userId, conversationId);

    // Step 3: Generate AI response
    // Phase 1: static mock response that demonstrates markdown rendering
    // Phase 6: replace with BedrockService.generateResponse(contextMessages)
    const assistantContent = generateMockResponse(input.content);

    // Step 4: Persist assistant message
    const assistantMessage = await messageRepository.create({
      conversationId,
      role: 'assistant',
      content: assistantContent,
    });

    await conversationRepository.incrementMessageCount(userId, conversationId);

    log.info(
      { userId, conversationId, userMessageId: userMessage.messageId },
      'Message exchange completed',
    );

    return {
      userMessage: toMessageDTO(userMessage),
      assistantMessage: toMessageDTO(assistantMessage),
    };
  }

  async listMessages(
    userId: string,
    conversationId: string,
    queryParams: { limit?: unknown; cursor?: unknown },
  ): Promise<ListMessagesServiceResult> {
    // Verify conversation ownership before returning messages
    await conversationRepository.findById(userId, conversationId);

    const { limit, exclusiveStartKey } = parsePaginationParams(queryParams);

    const result = await messageRepository.listByConversationId(
      conversationId,
      limit,
      exclusiveStartKey,
    );

    return {
      messages: result.items.map(toMessageDTO),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
      count: result.items.length,
    };
  }
}

export const messageService = new MessageService();

/**
 * Mock AI Response Generator — Phase 1
 *
 * Generates contextually relevant placeholder responses that demonstrate
 * the full markdown rendering pipeline (code blocks, lists, tables, etc.)
 * Replace this entire function in Phase 6 with the Bedrock SDK call.
 */
function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('code') || lower.includes('function') || lower.includes('typescript')) {
    return `Here's a TypeScript example:

\`\`\`typescript
// Example: Generic utility function
function groupBy<T, K extends keyof T>(
  items: T[],
  key: K
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const groupKey = String(item[key]);
    return {
      ...groups,
      [groupKey]: [...(groups[groupKey] ?? []), item],
    };
  }, {} as Record<string, T[]>);
}

// Usage
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Carol', role: 'admin' },
];

const byRole = groupBy(users, 'role');
// { admin: [Alice, Carol], user: [Bob] }
\`\`\`

This pattern uses TypeScript generics with constrained key types for full type safety.`;
  }

  if (lower.includes('list') || lower.includes('steps') || lower.includes('how')) {
    return `Here are the key steps:

1. **Analyze** the requirements thoroughly before writing any code
2. **Design** the data model and API contracts upfront
3. **Implement** in small, testable increments
4. **Review** with peers before merging

> Remember: the best code is code you don't have to write. Look for existing solutions first.

Additional considerations:
- Always validate inputs at the boundary
- Use structured logging for observability
- Write for the next developer, not just yourself`;
  }

  return `I understand you're asking about: **${userMessage.slice(0, 60)}${userMessage.length > 60 ? '...' : ''}**

This is a placeholder response from the AI Chat Platform. The Amazon Bedrock integration will replace this with intelligent AI responses in a future phase.

The platform currently supports:
- ✅ Markdown rendering with **bold**, *italic*, and \`inline code\`
- ✅ Code block syntax highlighting
- ✅ Conversation persistence in DynamoDB
- ✅ Pagination and conversation history
- 🔜 Amazon Bedrock AI integration (coming soon)`;
}
