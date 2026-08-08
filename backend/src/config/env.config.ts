import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment Configuration — Validated at startup
 *
 * All environment variables are validated using Zod before the server starts.
 * This fails fast with a clear error message rather than cryptic runtime failures
 * deep in the application when a missing env var is first accessed.
 *
 * Architecture decision: env config is a singleton imported by other config modules.
 * Never import process.env directly in application code — always use this module.
 */

const envSchema = z.object({
  /* Runtime */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),

  /* CORS */
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  /* AWS — required in production, optional in development (local DynamoDB) */
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  /* DynamoDB */
  DYNAMODB_ENDPOINT: z.string().optional(), // Local DynamoDB: http://localhost:8000
  DYNAMODB_TABLE_PREFIX: z.string().default('aichat'),

  /* Logging */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),

  /* Rate limiting */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  /* API */
  API_VERSION: z.string().default('v1'),

  /* Future: Bedrock */
  BEDROCK_REGION: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().optional(),
});

function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    // This is intentional — startup failure requires console output before logger init
    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Invalid environment configuration:\n${formatted}\n\n` +
        `Copy backend/.env.example to backend/.env and fill in the required values.\n`,
    );
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

export type Env = typeof env;
