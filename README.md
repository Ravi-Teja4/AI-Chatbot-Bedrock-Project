# AI Chat Platform

Enterprise-grade AI Chat Platform — pnpm monorepo with Next.js frontend, Express.js backend, and Amazon DynamoDB. Designed for Amazon Bedrock integration.

---

## Repository Structure

```
ai-chat-platform/
├── shared/          # @ai-chat/shared — TypeScript types, Zod schemas, constants
├── backend/         # @ai-chat/backend — Express.js REST API (Clean Architecture)
├── frontend/        # @ai-chat/frontend — Next.js App Router (Feature-Based)
├── docker-compose.yml           # Local development (hot reload + DynamoDB Local)
├── docker-compose.prod.yml      # Production (ECR images on EC2)
└── .github/workflows/deploy.yml # CI/CD skeleton (GitHub Actions → ECR → EC2)
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20.0.0 | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9.0.0 | `npm install -g pnpm@9.7.1` |
| Docker | Latest | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | V2 (`docker compose`) | Included with Docker Desktop |

---

## Quick Start — Local Development

### Option A: Docker Compose (recommended)

Runs everything in containers with hot reload. DynamoDB Local is included — no AWS account needed.

```bash
# 1. Clone and enter the repository
cd ai-chat-platform

# 2. Start all services
docker compose up

# Services started:
#   DynamoDB Local  → http://localhost:8000
#   Backend API     → http://localhost:5000
#   Frontend        → http://localhost:3000
#   Swagger UI      → http://localhost:5000/api/v1/docs
```

### Option B: Native (pnpm)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start DynamoDB Local separately
#    (requires Docker, or use AWS DynamoDB with real credentials)
docker run -p 8000:8000 amazon/dynamodb-local

# 4. Create DynamoDB tables (first time only)
#    See: Database Setup section below

# 5. Start backend + frontend together
pnpm dev

# Or start individually:
pnpm --filter backend dev    # http://localhost:5000
pnpm --filter frontend dev   # http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `5000` | HTTP server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |
| `AWS_REGION` | `us-east-1` | AWS region |
| `DYNAMODB_ENDPOINT` | `http://localhost:8000` | DynamoDB endpoint (blank = real AWS) |
| `DYNAMODB_TABLE_PREFIX` | `aichat` | Table name prefix |
| `LOG_LEVEL` | `debug` | Logging level |
| `LOG_PRETTY` | `true` | Pretty-print logs in dev |

### Frontend (`frontend/.env.local`)

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |

---

## Database Setup

### Local DynamoDB (first run)

The `docker-compose.yml` includes a `dynamodb-init` service that automatically creates all tables on first run. If running natively, use the AWS CLI:

```bash
# Set local DynamoDB endpoint
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_DEFAULT_REGION=us-east-1
export DYNAMO_ENDPOINT=http://localhost:8000

# Conversations table
aws dynamodb create-table \
  --table-name aichat-conversations \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=updatedAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=conversationId,KeyType=RANGE \
  --global-secondary-indexes '[{
    "IndexName":"userId-updatedAt-index",
    "KeySchema":[
      {"AttributeName":"userId","KeyType":"HASH"},
      {"AttributeName":"updatedAt","KeyType":"RANGE"}
    ],
    "Projection":{"ProjectionType":"ALL"},
    "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
  }]' \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url $DYNAMO_ENDPOINT

# Messages table
aws dynamodb create-table \
  --table-name aichat-messages \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=messageId,AttributeType=S \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
    AttributeName=messageId,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url $DYNAMO_ENDPOINT

# Settings table
aws dynamodb create-table \
  --table-name aichat-settings \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=settingKey,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=settingKey,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url $DYNAMO_ENDPOINT
```

### DynamoDB Table Design

| Table | Partition Key | Sort Key | GSI |
|---|---|---|---|
| `aichat-conversations` | `userId` | `conversationId` (ULID) | `userId-updatedAt-index` |
| `aichat-messages` | `conversationId` | `messageId` (ULID) | — |
| `aichat-settings` | `userId` | `settingKey` | — |

**Key decisions:**
- `messageId` and `conversationId` are **ULIDs** — lexicographically sortable by creation time, so DynamoDB sort key ordering equals chronological order with no extra timestamp index
- Conversations GSI on `updatedAt` powers the sidebar "most recently active" sort with a single Query
- `userId` as partition key on conversations means all user data is co-located for fast reads

---

## API Reference

Swagger UI is available at `http://localhost:5000/api/v1/docs` in development.

### Endpoints

```
GET    /api/v1/health                              Liveness check
GET    /api/v1/health/detailed                     Readiness check (DynamoDB ping)

GET    /api/v1/conversations                       List conversations (paginated)
POST   /api/v1/conversations                       Create conversation
GET    /api/v1/conversations/:id                   Get conversation
PATCH  /api/v1/conversations/:id                   Rename conversation
DELETE /api/v1/conversations/:id                   Delete conversation

GET    /api/v1/conversations/:id/messages          List messages (paginated)
POST   /api/v1/conversations/:id/messages          Send message (returns user + AI response)
```

### Response Envelope

Every response follows a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "pagination": {
    "hasMore": true,
    "nextCursor": "base64-encoded-cursor",
    "count": 20
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation 'abc' not found",
    "details": []
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Development Scripts

```bash
# Root (runs across all packages)
pnpm dev              # Start backend + frontend concurrently
pnpm build            # Build all packages in dependency order
pnpm lint             # ESLint across all packages
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier format all files
pnpm format:check     # Prettier check (CI)
pnpm type-check       # TypeScript type check all packages
pnpm clean            # Remove all build artifacts

# Per-package
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @ai-chat/shared build
```

---

## Docker

### Local development

```bash
docker compose up                    # Start all services
docker compose up backend            # Start backend only
docker compose logs -f backend       # Tail backend logs
docker compose down                  # Stop all services
docker compose down -v               # Stop + remove volumes (resets DynamoDB)
```

### Production build (verify before ECR push)

```bash
# Build images locally
docker build -f backend/Dockerfile -t ai-chat-backend:test .
docker build \
  -f frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://your-ec2-ip:5000 \
  -t ai-chat-frontend:test .

# Run production images locally
docker compose -f docker-compose.prod.yml up
```

---

## Deploy: Clone & Build Directly on EC2

The simplest production path — no ECR required. Clone the repo on the server, build images there, run containers.

### One-time EC2 setup

```bash
# Install Docker (Amazon Linux 2023)
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker ec2-user
newgrp docker

# Install Docker Compose V2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Deploy

```bash
# Clone repo
git clone <your-repo-url> ai-chat-platform
cd ai-chat-platform

# Create backend env file
cp backend/.env.example backend/.env
# Edit: set CORS_ORIGIN=http://<EC2-PUBLIC-IP>:3000, LOG_PRETTY=false

# Set your EC2 public IP so it gets baked into the frontend build
export NEXT_PUBLIC_API_URL=http://<EC2-PUBLIC-IP>:5000

# Build images and start (takes 5–10 min first time)
docker compose -f docker-compose.server.yml build
docker compose -f docker-compose.server.yml up -d

# Tail logs
docker compose -f docker-compose.server.yml logs -f
```

### Update after a code change

```bash
cd ai-chat-platform
git pull
export NEXT_PUBLIC_API_URL=http://<EC2-PUBLIC-IP>:5000
docker compose -f docker-compose.server.yml build
docker compose -f docker-compose.server.yml up -d --no-deps backend frontend
```

### EC2 Security Group (inbound rules)

| Port | Source | Purpose |
|---|---|---|
| 3000 | 0.0.0.0/0 | Frontend |
| 5000 | 0.0.0.0/0 | Backend API |
| 22 | Your IP only | SSH |

Port 8000 (DynamoDB Local) is bound to `127.0.0.1` inside the compose file — not reachable from outside.

---

## Production Deployment (EC2 via ECR)

### One-time EC2 setup

```bash
# On a fresh Amazon Linux 2023 / Ubuntu EC2 instance:

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose V2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
sudo yum install -y awscli

# Create app directory
mkdir ~/ai-chat-platform
cd ~/ai-chat-platform
```

### Manual deployment

```bash
# 1. Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 2. Copy production compose file and env to EC2
scp docker-compose.prod.yml ec2-user@<EC2-IP>:~/ai-chat-platform/
scp .env.prod ec2-user@<EC2-IP>:~/ai-chat-platform/   # NEVER commit this file

# 3. Pull and start
export REGISTRY=<account-id>.dkr.ecr.us-east-1.amazonaws.com
export IMAGE_TAG=latest
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD (GitHub Actions)

The `.github/workflows/deploy.yml` skeleton automates the above on every push to `main`.

Required GitHub Secrets:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with ECR push + EC2 SSH access |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | e.g., `us-east-1` |
| `ECR_REGISTRY` | `<account-id>.dkr.ecr.<region>.amazonaws.com` |
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_SSH_KEY` | Private key for EC2 SSH |
| `EC2_USER` | EC2 username (`ec2-user` or `ubuntu`) |
| `NEXT_PUBLIC_API_URL` | `http://<EC2-IP>:5000` |

---

## Architecture

### Backend — Clean Architecture

```
src/
├── config/         # Env validation, AWS SDK clients, Swagger spec
├── constants/      # DynamoDB table names, error codes, HTTP status
├── controllers/    # HTTP layer — extract input, call service, send response
├── middleware/     # Auth (placeholder), error handler, request logger, validator
├── models/         # DynamoDB item shapes + DTO mappers
├── repositories/   # DynamoDB access — only layer that touches AWS SDK
├── routes/v1/      # Express routers — attach middleware + delegate to controllers
├── services/       # Business logic — orchestrates repositories
├── types/          # Express type augmentation
├── utils/          # Logger, errors, response formatter, pagination
├── app.ts          # Express app factory
└── index.ts        # Server entry point + graceful shutdown
```

**Dependency flow:** `Routes → Controllers → Services → Repositories → DynamoDB`

No layer imports from a layer below its neighbor. Adding Bedrock = new `BedrockService` injected into `MessageService` only.

### Frontend — Feature-Based Architecture

```
src/
├── app/            # Next.js App Router (layouts, pages, route segments)
├── components/     # Shared UI primitives (Shadcn + common components)
├── contexts/       # React Context providers (Auth placeholder, Theme)
├── features/       # Feature modules — each owns its components, hooks, index
│   ├── chat/       # ChatWindow, MessageList, MessageItem, ChatInput, WelcomeScreen
│   ├── sidebar/    # Sidebar, ConversationList, ConversationItem, SearchBar
│   ├── settings/   # SettingsModal (placeholder)
│   └── layout/     # AppLayout (sidebar + main area shell)
├── hooks/          # Cross-feature hooks (useTheme, useLocalStorage)
├── lib/            # API client (Axios), React Query client, utilities
├── services/       # Frontend API service functions (Phase 5)
└── types/          # Re-exports from @ai-chat/shared
```

### Shared Package — `@ai-chat/shared`

Single source of truth for:
- API response/request TypeScript interfaces
- Zod validation schemas (used by both frontend forms and backend middleware)
- API endpoint path constants
- Application-wide constants (max lengths, pagination defaults)

Builds to both CJS (backend) and ESM (frontend) via `tsup`.

---

## Coding Standards

- **TypeScript strict mode** across all three packages
- **Clean Architecture** on the backend — no layer bypassing
- **Feature-based modules** on the frontend — no god components
- **Zod** for all runtime validation — schemas shared via `@ai-chat/shared`
- **Pino** structured logging — every log includes `requestId` for tracing
- **ULID** primary keys — lexicographically sortable, time-ordered, no sorting GSI needed for messages
- **Cursor pagination** — DynamoDB `LastEvaluatedKey` encoded as Base64 cursor
- **CSS variable token system** — theme switching with zero Tailwind class changes
- **Non-root Docker users** — `appuser:nodejs` and `nextjs:nodejs`

---

## Implementation Roadmap

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Complete | Architecture, folder structure, Docker, shared types |
| **Phase 2** | Pending | DynamoDB table creation scripts, repository layer tests |
| **Phase 3** | Pending | Backend API endpoints fully wired and tested |
| **Phase 4** | Pending | Frontend UI fully wired (React Query hooks, real API calls) |
| **Phase 5** | Pending | Frontend ↔ Backend integration (conversations, messages, live data) |
| **Phase 6** | Pending | Streaming-ready UI, markdown rendering, typing animation |
| **Phase 7** | Pending | Docker validation, image build verification, production readiness |
| **Phase N** | Future | Amazon Bedrock Agents, Cognito auth, Redis, S3, WebSockets |

---

## Future Integrations (Architecture-Ready)

The following are **not implemented** but the architecture explicitly accommodates them:

- **Amazon Bedrock** — `BedrockService` slot in `MessageService.sendMessage()`
- **Amazon Cognito** — `auth.middleware.ts` is a verified pass-through today
- **Google Login / OTP** — `AuthContext` provider contract is established
- **Redis** — session cache layer between service and repository
- **WebSockets / Streaming** — `StreamChunk` type defined in shared package
- **S3 + File Upload** — `Paperclip` button rendered but disabled in `ChatInput`
- **Multi-model Support** — `modelId` field exists on every `Message` record
- **Admin Portal** — separate Next.js route group `(admin)` to be added
- **Subscription Plans** — `plan` field in `UserSettings` type

---

## License

Private — All rights reserved.
