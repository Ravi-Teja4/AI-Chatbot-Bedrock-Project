import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.config';

/**
 * AWS Configuration — SDK Client Singletons
 *
 * All AWS SDK clients are created once and reused across the application.
 * Creating a new client per request is a common performance mistake in Node.js
 * — clients maintain connection pools that should be shared.
 *
 * Client configuration:
 * - In development with DYNAMODB_ENDPOINT set: connects to local DynamoDB
 * - In production: uses IAM role attached to EC2 (no credentials needed)
 * - AWS credentials are only injected explicitly for local dev or CI/CD
 */

function createDynamoDBClient(): DynamoDBClient {
  const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
    region: env.AWS_REGION,
  };

  // Local DynamoDB (development only)
  if (env.DYNAMODB_ENDPOINT) {
    clientConfig.endpoint = env.DYNAMODB_ENDPOINT;
  }

  // Explicit credentials (local dev / CI) — EC2 uses IAM role automatically
  if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return new DynamoDBClient(clientConfig);
}

const dynamoDBClient = createDynamoDBClient();

/**
 * DynamoDB Document Client
 *
 * The Document Client abstracts the DynamoDB low-level type system
 * (AttributeValue marshaling) so we work with native JavaScript types.
 * This is always preferred over the raw DynamoDBClient in application code.
 *
 * translateConfig options:
 * - marshallOptions.removeUndefinedValues: prevents DynamoDB errors when
 *   optional fields are undefined in update expressions
 */
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

/**
 * Table name factory — applies the configured prefix to all table names.
 * This allows the same codebase to target different DynamoDB environments
 * (dev, staging, prod) by changing only DYNAMODB_TABLE_PREFIX.
 *
 * @example
 * tableName('conversations') → 'aichat-conversations'
 */
export function tableName(table: string): string {
  return `${env.DYNAMODB_TABLE_PREFIX}-${table}`;
}
