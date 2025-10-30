# Dance School Booking System

MVP booking system for a Sydney-based dance school, built with Domain-Driven Design principles.

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces
- **API**: Serverless Framework + AWS Lambda + DynamoDB
- **Domain**: DDD with Aggregate Root pattern and optimistic locking
- **Type Safety**: TypeScript with shared DTOs and Zod validation

## Project Structure

```
dance-school-booking/
├── apps/
│   └── api/               # Serverless API
│       ├── src/
│       │   ├── domain/           # Domain layer (DDD)
│       │   │   ├── aggregates/   # Class aggregate
│       │   │   ├── entities/     # Booking entity
│       │   │   └── value-objects/ # Email, ClassType, DateTime
│       │   ├── infrastructure/   # Repositories, mappers, DynamoDB
│       │   └── handlers/         # Lambda handlers
│       └── serverless.yml
└── packages/
    ├── ddd/               # DDD base classes (Entity, AggregateRoot, ValueObject)
    ├── dtos/              # Shared DTOs with Zod schemas
    └── typescript-config/ # Shared TypeScript configs
```

## Prerequisites

- Node.js >= 22
- pnpm >= 10

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Packages

```bash
pnpm build
```

### 3. Generate Seed Data

```bash
cd apps/api
pnpm seed:generate
```

This generates classes for the next 4 weeks based on the weekly schedule.

### 4. Install DynamoDB Local

```bash
cd apps/api
pnpm dynamodb:install
```

### 5. Start Development Server

```bash
cd apps/api
pnpm dev
```

This starts:
- DynamoDB Local on port 8000
- Serverless Offline on port 3000
- Auto-seeds the classes table

## API Endpoints

### Search Classes

```bash
POST http://localhost:3000/dev/classes/search
Content-Type: application/json

{
  "type": "salsa"  # Options: "salsa", "bachata", "reggaeton", "any"
}
```

### Get Class Details

```bash
GET http://localhost:3000/dev/classes/{classId}
```

### Book a Class

```bash
POST http://localhost:3000/dev/classes/{classId}/book
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Weekly Schedule

| Day       | 18:30         | 19:30         | 20:30       |
|-----------|---------------|---------------|-------------|
| Monday    | Bachata 1     | Bachata 2     | Salsa 3     |
| Tuesday   | Salsa 1       | Salsa 2       | Reggaeton   |
| Wednesday | Bachata 1     | Bachata 2     | Salsa 3     |
| Thursday  | Salsa 1       | Salsa 2       | (no class)  |
| Friday    | Reggaeton     | Salsa 3       | (no class)  |

- **Max Spots**: 20 per class
- **Salsa**: Levels 1-3
- **Bachata**: Levels 1-2
- **Reggaeton**: No levels

## Domain-Driven Design

### Aggregate Root: Class

The `Class` aggregate enforces business rules:
- Prevents overbooking (max 20 spots)
- Prevents duplicate bookings (one per email)
- Uses optimistic locking (version field) to prevent race conditions

### Optimistic Locking

DynamoDB conditional writes ensure atomicity:
```typescript
ConditionExpression: '#version = :expectedVersion'
```

If two requests try to book the last spot simultaneously, only one succeeds.

### Value Objects

- `Email`: Validates email format
- `ClassType`: Validates type and level combinations
- `DateTime`: Validates date/time format

## Development Commands

```bash
# Root commands
pnpm build          # Build all packages
pnpm dev            # Start API in dev mode
pnpm check-types    # Type check all packages
pnpm lint           # Lint all packages

# API-specific (from apps/api)
pnpm build          # Compile TypeScript
pnpm dev            # Start offline with DynamoDB Local
pnpm deploy         # Deploy to AWS
pnpm seed:generate  # Generate seed data
```

## Deployment

```bash
cd apps/api
pnpm build
pnpm deploy --stage prod --region ap-southeast-2
```

This creates:
- Lambda functions for each endpoint
- DynamoDB tables with GSIs
- API Gateway REST API

## Technical Highlights

1. **Concurrency Control**: Optimistic locking prevents double bookings
2. **Domain Logic**: Business rules enforced in aggregate root
3. **Type Safety**: End-to-end TypeScript with Zod validation
4. **Repository Pattern**: Clean separation of domain and infrastructure
5. **Mapper Pattern**: Domain <-> Persistence transformation
6. **SOLID Principles**: Clear layer separation (Domain -> Infrastructure -> Handlers)

## Future Enhancements

- Domain events for audit trail
- Cancellation functionality
- Waitlist support
- Email notifications
- Admin dashboard
