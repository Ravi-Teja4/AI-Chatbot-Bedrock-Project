import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

/**
 * Swagger / OpenAPI 3.0 Configuration
 *
 * API documentation is auto-generated from JSDoc annotations in route files.
 * Available at: GET /api/v1/docs
 *
 * The spec is generated once at startup and served statically — no runtime
 * overhead per request.
 */

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AI Chat Platform API',
      version: '1.0.0',
      description:
        'Enterprise AI Chat Platform REST API. Provides conversation and message management ' +
        'with future support for Amazon Bedrock AI integration.',
      contact: {
        name: 'AI Chat Platform Team',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local Development',
      },
      {
        url: `/api/${env.API_VERSION}`,
        description: 'Current Environment',
      },
    ],
    components: {
      schemas: {
        /* Standard API response envelope */
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string', example: 'req_abc123' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Request validation failed' },
                details: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Conversation: {
          type: 'object',
          required: ['conversationId', 'userId', 'title', 'createdAt', 'updatedAt'],
          properties: {
            conversationId: { type: 'string', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
            userId: { type: 'string', example: 'anonymous' },
            title: { type: 'string', example: 'Help me understand TypeScript generics' },
            messageCount: { type: 'integer', example: 12 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          required: ['messageId', 'conversationId', 'role', 'content', 'createdAt'],
          properties: {
            messageId: { type: 'string', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
            conversationId: { type: 'string', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
            role: { type: 'string', enum: ['user', 'assistant', 'system'] },
            content: { type: 'string', example: 'Explain TypeScript generics with examples' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            hasMore: { type: 'boolean' },
            nextCursor: { type: 'string', nullable: true },
            count: { type: 'integer' },
          },
        },
      },
      parameters: {
        ConversationId: {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ULID conversation identifier',
        },
        Limit: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items to return',
        },
        Cursor: {
          name: 'cursor',
          in: 'query',
          schema: { type: 'string' },
          description: 'Pagination cursor from previous response',
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Service health and readiness checks' },
      { name: 'Conversations', description: 'Conversation lifecycle management' },
      { name: 'Messages', description: 'Message creation and retrieval' },
    ],
  },
  apis: ['./src/routes/v1/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
