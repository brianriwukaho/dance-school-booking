# Dance School Booking System

MVP booking system for a Sydney-based dance school, built with Domain-Driven Design principles and CQRS architecture with appropriate Dynamodb schema design.

## Problem Space

MVP of a booking system for a Sydney-based dance school.

### Requirements

**Use Cases:**

1. **Search for classes** - Filter by dance type (salsa, bachata, reggaeton, or any)
2. **View class info** - Display class details including spots remaining
3. **Book a class** - Register with email, with capacity and duplicate prevention

**Key Constraints:**

- Max 20 spots per class
- No overbooking allowed
- One booking per email per class
- Must prevent race conditions in concurrent booking scenarios
- Fully offline local development

## Design Philosophy

This project demonstrates **appropriate application of DDD and layered architecture** in a small codebase. Key decisions:

- **DynamoDB over SQL**: Chosen to avoid VPC configuration and ENI attachments that would complicate Lambda cold starts. For this small business use case, the deployment simplicity outweighs the query flexibility of SQL.

- **Simple concurrency model**: No complex async boundaries or distributed locks. Conditional writes with optimistic locking are sufficient for a small dance school's booking volume (~1 booking per hour).

- **CQRS pattern**: Commands handle state changes (booking), queries handle reads (search, get details). Clear separation of concerns without over-engineering.

- **Fail-fast with Result types**: Custom error types provide type-safe error handling and clear control flow, eliminating ambiguous exceptions.

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces for easy package management
- **API**: Serverless Framework + AWS Lambda + DynamoDB
- **Domain**: DDD with Aggregate Root pattern, CQRS (Commands & Queries)
- **Type Safety**: TypeScript with shared DTOs and Zod validation
- **Anti-Corruption Layer**: DTOs and Mappers separate domain from persistence
- **Repository Pattern**: Domain logic isolated from database concerns

## Project Structure

```
dance-school-booking/
├── apps/
│   └── api/                          # Serverless API
│       ├── src/
│       │   ├── modules/booking/      # Booking module (DDD bounded context)
│       │   │   ├── domain/           # Domain layer
│       │   │   │   ├── aggregates/   # Class aggregate
│       │   │   │   └── value-objects/ # Email, ClassType, DateTime, ClassId, Booking
│       │   │   ├── database/         # Infrastructure layer
│       │   │   │   ├── repositories/ # Repository implementations
│       │   │   │   └── mappers/      # Domain <-> Persistence transformation
│       │   │   ├── commands/         # CQRS commands (state changes)
│       │   │   │   └── book-class/   # BookClassCommand + Service
│       │   │   ├── queries/          # CQRS queries (reads)
│       │   │   │   ├── search-classes/
│       │   │   │   └── get-class/
│       │   │   └── exceptions/       # Domain-specific exceptions
│       │   ├── handlers/             # Lambda handlers
│       │   └── database/             # Shared database client
│       ├── scripts/                  # Utility scripts
│       │   ├── test-cli.ts           # Interactive testing CLI
│       │   └── generate-seed-data.ts # Seed data generator
│       └── serverless.yml
└── packages/
    ├── ddd/                          # DDD base classes
    │   ├── entity.base.ts
    │   ├── aggregate-root.base.ts
    │   ├── value-object.base.ts
    │   ├── command.base.ts
    │   ├── guard.ts
    │   └── exceptions/               # Base exception classes
    ├── dtos/                         # Shared DTOs with Zod schemas
    │   ├── booking.dto.ts
    │   ├── class.dto.ts
    │   └── shared.dto.ts
    └── typescript-config/            # Shared TypeScript configs
```

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Java Runtime (JDK 11+) - Required for DynamoDB Local

  ```bash
  # macOS (Homebrew)
  brew install openjdk@21

  # Ensure java is in PATH
  sudo ln -sfn /opt/homebrew/opt/openjdk@21/bin/java /usr/local/bin/java
  ```

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will automatically install DynamoDB Local via the postinstall script.

### 2. Install DynamoDB Local

If the postinstall script failed, install manually:

```bash
cd apps/api
pnpm dynamodb:install
```

### 3. Start Development Server

From the root directory, run:

```bash
turbo run dev
```

This command:
- Builds all packages (`@repo/ddd`, `@repo/dtos`, `@repo/typescript-config`)
- Generates seed data for the next 4 weeks
- Starts DynamoDB Local on port 8000
- Starts Serverless Offline on port 3000
- Auto-seeds the classes table

**Important:** Always run `turbo run dev` from the root to ensure packages are built and seed data is generated before starting the API.

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

| Day       | 18:30     | 19:30     | 20:30      |
| --------- | --------- | --------- | ---------- |
| Monday    | Bachata 1 | Bachata 2 | Salsa 3    |
| Tuesday   | Salsa 1   | Salsa 2   | Reggaeton  |
| Wednesday | Bachata 1 | Bachata 2 | Salsa 3    |
| Thursday  | Salsa 1   | Salsa 2   | (no class) |
| Friday    | Reggaeton | Salsa 3   | (no class) |

- **Max Spots**: 20 per class
- **Salsa**: Levels 1-3
- **Bachata**: Levels 1-2
- **Reggaeton**: No levels

## DynamoDB Table Design

### Table Structure

The single-table design supports required query patterns: get class by ID, search by type, and manage bookings.

```typescript
// Class metadata item
{
  PK: "CLASS#2024-12-09#MON#1830",
  SK: "METADATA",
  type: "Salsa",
  level: 1,
  maxSpots: 20,
  bookingCount: 15,
  version: 5,                       // Optimistic locking
  dayOfWeek: "Monday",
  startTime: "18:30",
  GSI1PK: "TYPE#SALSA#1",          // For type queries
  GSI1SK: "2024-12-09#MON#1830"    // Sort by datetime
}

// Booking items (email as SK for uniqueness)
{
  PK: "CLASS#2024-12-09#MON#1830",
  SK: "john@example.com",
  bookedAt: "2024-12-01T10:30:00Z"
}
```

### GSI for Type-Based Search

- **GSI1PK**: `TYPE#SALSA#1` (partition by type and level)
- **GSI1SK**: `2024-12-09#MON#1830` (sort by date/time)
- Only metadata items include GSI attributes

### Concurrency Control with Optimistic Locking

The booking operation uses optimistic locking on the class metadata to prevent race conditions:

```typescript
// Repository save operation
await updateCommand({
  Key: { PK: classId, SK: "METADATA" },
  ConditionExpression: "#version = :expectedVersion",
  UpdateExpression: "SET #version = :newVersion, bookingCount = :bookingCount",
  ExpressionAttributeValues: {
    ":expectedVersion": currentVersion,
    ":newVersion": currentVersion + 1,
    ":bookingCount": newBookingCount,
  },
});
```

**How it prevents overbooking:**

1. Read class aggregate with current version (e.g., version 5)
2. Validate booking in memory via `aggregate.book(email)`
3. Attempt save with condition `version = 5`

**When two users try to book simultaneously:**

- User A reads class at version 5
- User B reads class at version 5
- User A saves first, version becomes 6 (succeeds)
- User B tries to save with version 5 (fails with `ConflictException`)
- User B receives error and can retry with fresh state

This ensures overbooking is impossible. The version check guarantees that only one booking succeeds when racing for the last spot.

### Additional Safeguards

New booking items use conditional write to prevent duplicate emails:

```typescript
await putCommand({
  Item: booking,
  ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
});
```

## Domain-Driven Design

### Aggregate Root: Class

The `Class` aggregate enforces business rules:

- Capacity check via `spotsRemaining` calculation
- Duplicate booking prevention via email comparison
- State changes are atomic through repository optimistic locking

### Value Objects

- `Email`: Validates email format
- `ClassType`: Validates type and level combinations
- `DateTime`: Validates date/time format

### CQRS Pattern

Commands (state changes):

- `BookClassCommand` → `BookClassService` → Updates aggregate state

Queries (reads):

- `SearchClassesQuery` → `SearchClassesService` → Read-only operations
- `GetClassQuery` → `GetClassService` → Read-only operations

## Error Handling with Result Types

The project uses the `Result<T, E>` pattern from `@badrap/result` for type-safe error handling without exceptions.

### Pattern Usage

All command and query services return `Result<SuccessType, ExceptionBase>`:

```typescript
async function execute(): Promise<Result<BookClassResponseDTO, ExceptionBase>> {
  // Business logic
  if (error) {
    return Result.err(new ClassFullyBookedException(classId, maxSpots));
  }
  return Result.ok(response);
}
```

### Exception Hierarchy

**Base Exceptions** (from `@repo/ddd`):
- `ExceptionBase` - Base class with correlation ID tracking
- `ArgumentInvalidException` - Invalid argument value
- `ArgumentNotProvidedException` - Missing required argument
- `ConflictException` - Concurrent modification conflict
- `NotFoundException` - Resource not found

**Domain-Specific Exceptions**:
- `ClassNotFoundException` - Class ID doesn't exist
- `ClassFullyBookedException` - No spots remaining
- `DuplicateBookingException` - Email already booked
- `InvalidBookingRequestException` - Invalid request DTO
- `InvalidSearchFiltersException` - Invalid search filters

### Benefits

- No try-catch blocks needed in business logic
- Type-safe error handling with pattern matching
- Explicit error propagation through return types
- Easier testing of error scenarios

## Validation Strategy

The project uses a two-layer validation approach:

### 1. API Layer Validation (DTOs with Zod)

Request DTOs are validated using Zod schemas:

```typescript
const bookClassRequestDTOSchema = z.object({
  email: z.string().email()
});

const result = bookClassRequestDTOSchema.safeParse(body);
if (!result.success) {
  return Result.err(new InvalidBookingRequestException(result.error));
}
```

### 2. Domain Layer Validation (Value Objects)

Value Objects validate in their constructors:

```typescript
// Email validation
class Email extends ValueObject {
  constructor(value: string) {
    if (!EMAIL_REGEX.test(value)) {
      throw new ArgumentInvalidException('Invalid email format');
    }
  }
}

// ClassType validation enforces business rules:
// - Salsa: levels 1-3
// - Bachata: levels 1-2
// - Reggaeton: no levels
class ClassType extends ValueObject {
  constructor(type: string, level?: number) {
    // Validation logic
  }
}
```

This ensures:
- Invalid data never enters the domain
- Business rules are enforced at domain boundaries
- Validation logic is centralized in value objects

## Testing

### Unit Tests

The project uses Vitest for unit testing:

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# UI mode
pnpm test:ui
```

Test coverage includes:
- Domain aggregates (Class aggregate booking logic)
- Value objects (Email, ClassType validation)
- Command services (BookClassService)

### Manual Testing CLI

An interactive CLI is provided for manual testing:

```bash
cd apps/api
pnpm test:cli
```

The CLI provides interactive prompts to:

- Search for classes by type
- View class details
- Book classes with different emails
- Test edge cases (full classes, duplicate bookings)

### DynamoDB Admin

Inspect database state during development:

```bash
cd apps/api
pnpm dynamodb:admin
```

Opens admin UI at http://localhost:8001

## Development Commands

```bash
# Root commands (run from project root)
turbo run dev       # Build packages, generate seed data, start API
pnpm build          # Build all packages
pnpm check-types    # Type check all packages

# API-specific commands (run from apps/api)
pnpm test           # Run unit tests
pnpm test:watch     # Run tests in watch mode
pnpm test:ui        # Open Vitest UI
pnpm test:cli       # Interactive testing CLI
pnpm seed:generate  # Generate seed data
pnpm dynamodb:admin # Open DynamoDB Admin UI (port 8001)
```

## Technical Highlights

1. **Optimistic Locking**: Version-based concurrency control prevents overbooking
2. **Result Types**: `Result<T, E>` pattern for type-safe error handling without exceptions
3. **Domain-Driven Design**: Business logic encapsulated in aggregates, isolated from infrastructure
4. **Repository Pattern**: Anti-corruption layer between domain and DynamoDB
5. **Mapper Pattern**: Bidirectional transformation between domain models and persistence
6. **CQRS**: Separated commands (writes) and queries (reads) for clarity
7. **Single-Table Design**: Efficient DynamoDB schema with composite keys and GSI
8. **Type Safety**: End-to-end TypeScript with Zod validation on DTOs
