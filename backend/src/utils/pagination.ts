import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants/dynamodb.constants';

/**
 * Pagination Utilities
 *
 * DynamoDB uses cursor-based pagination via LastEvaluatedKey.
 * We encode/decode this as a Base64 string for clean API surface.
 *
 * Why cursor over offset pagination?
 * - DynamoDB doesn't support OFFSET (no skip() operation)
 * - Cursors are stable across inserts — offset pagination shows
 *   duplicate or skipped items when data changes between pages
 * - More efficient: no need to scan all preceding items
 */

/**
 * Encode DynamoDB LastEvaluatedKey to a URL-safe cursor string
 */
export function encodeCursor(lastEvaluatedKey: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64url');
}

/**
 * Decode a cursor string back to a DynamoDB ExclusiveStartKey
 * Returns undefined if the cursor is invalid — invalid cursor treated as first page
 */
export function decodeCursor(cursor: string): Record<string, unknown> | undefined {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Clamp and parse the limit query parameter
 */
export function parseLimit(limitParam: unknown): number {
  const parsed = Number(limitParam);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export interface ParsedPaginationParams {
  limit: number;
  exclusiveStartKey: Record<string, unknown> | undefined;
}

/**
 * Parse raw query params into typed pagination parameters
 */
export function parsePaginationParams(query: {
  limit?: unknown;
  cursor?: unknown;
}): ParsedPaginationParams {
  const limit = parseLimit(query.limit);
  const exclusiveStartKey =
    typeof query.cursor === 'string' ? decodeCursor(query.cursor) : undefined;

  return { limit, exclusiveStartKey };
}
