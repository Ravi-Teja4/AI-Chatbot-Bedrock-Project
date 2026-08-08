# =============================================================================
# Backend — Multi-Stage Dockerfile
# =============================================================================
# Stage 1 → deps:     install ALL dependencies (dev + prod) for compilation
# Stage 2 → builder:  compile TypeScript → JavaScript
# Stage 3 → runner:   production image with only compiled output + prod deps
#
# Final image size target: ~180MB (Node 20 Alpine + prod deps only)
# =============================================================================

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install pnpm globally — pinned version must match root packageManager field
RUN npm install -g pnpm@9.7.1

WORKDIR /app

# Copy workspace manifests first for layer caching.
# pnpm install only re-runs when these files change.
COPY package.json pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
# Frontend package.json is needed for workspace resolution even though
# we're only building the backend — pnpm requires the full workspace manifest.
COPY frontend/package.json ./frontend/

# Install all dependencies (including devDependencies needed for tsc)
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.7.1

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/
COPY package.json pnpm-workspace.yaml ./

# Build shared package first (backend depends on it)
RUN pnpm --filter @ai-chat/shared build

# Compile TypeScript → JavaScript (outputs to backend/dist/)
RUN pnpm --filter @ai-chat/backend build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

RUN npm install -g pnpm@9.7.1

WORKDIR /app

# Copy workspace manifests for production install
COPY package.json pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Set correct ownership
RUN chown -R appuser:nodejs /app

USER appuser

# Expose the application port
EXPOSE 5000

# Health check — Docker daemon will monitor this
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Start the compiled Node.js application
CMD ["node", "backend/dist/index.js"]
