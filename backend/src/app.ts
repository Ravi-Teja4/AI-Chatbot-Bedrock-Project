import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env.config';
import { swaggerSpec } from '@/config/swagger.config';
import { requestLoggerMiddleware } from '@/middleware/request-logger.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { errorMiddleware, notFoundMiddleware } from '@/middleware/error.middleware';
import v1Router from '@/routes/v1/index';
import { createLogger } from '@/utils/logger';

const log = createLogger('App');

/**
 * App Factory — creates and configures the Express application
 *
 * Using a factory function (not a module-level singleton) allows:
 * - Clean instantiation for testing (each test gets a fresh app)
 * - No global state between test runs
 * - Explicit dependency injection in the future
 *
 * Middleware stack order (intentional):
 * 1. Helmet (security headers) — must be first
 * 2. CORS — before any routes that might return early
 * 3. Compression — before response bodies are written
 * 4. JSON body parser — before route handlers need req.body
 * 5. Request logger — after body parsing so we can log content-length
 * 6. Auth middleware — sets req.userId for all downstream handlers
 * 7. Routes
 * 8. 404 handler — after all routes
 * 9. Error handler — must be last, must have 4 parameters
 */
export function createApp(): Express {
  const app = express();

  // ── 1. Security Headers ─────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Swagger UI
    }),
  );

  // ── 2. CORS ─────────────────────────────────────────────────────────────
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        log.warn({ origin }, 'CORS: rejected request from disallowed origin');
        return callback(new Error(`CORS: origin '${origin}' is not allowed`));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      credentials: false, // Will become true when Cognito session cookies are added
      maxAge: 86400, // 24h preflight cache
    }),
  );

  // ── 3. Compression ───────────────────────────────────────────────────────
  app.use(compression());

  // ── 4. Body Parser ───────────────────────────────────────────────────────
  app.use(
    express.json({
      limit: '1mb', // Generous for AI responses; prevents oversized attack payloads
      strict: true, // Only accept objects and arrays at the top level
    }),
  );
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ── 5. Request Logger & Request ID ───────────────────────────────────────
  app.use(requestLoggerMiddleware);

  // ── 6. Auth Middleware ────────────────────────────────────────────────────
  app.use(authMiddleware);

  // ── 7. Swagger API Documentation ─────────────────────────────────────────
  // Only expose Swagger in non-production environments
  if (env.NODE_ENV !== 'production') {
    app.use(
      `/api/${env.API_VERSION}/docs`,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'AI Chat Platform API',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
        },
      }),
    );

    app.get(`/api/${env.API_VERSION}/docs.json`, (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    log.info(`Swagger UI: http://localhost:${env.PORT}/api/${env.API_VERSION}/docs`);
  }

  // ── 8. API Routes ─────────────────────────────────────────────────────────
  app.use(`/api/${env.API_VERSION}`, v1Router);

  // ── 9. 404 Handler ────────────────────────────────────────────────────────
  app.use(notFoundMiddleware);

  // ── 10. Global Error Handler (must be last, 4 params) ────────────────────
  app.use(errorMiddleware);

  return app;
}
