# API Testing CLI

Interactive CLI tool for testing the Dance School Booking API endpoints locally.

## Quick Start

1. **Start the local API server** (in one terminal):
   ```bash
   cd apps/api
   pnpm dev
   ```

   This will start:
   - DynamoDB Local on port 8000
   - Serverless Offline API on port 3000

2. **Run the test CLI** (in another terminal):
   ```bash
   cd apps/api
   pnpm test:api
   ```

## Features

The CLI provides an interactive menu to test all API endpoints with both happy and unhappy path scenarios.

### Available Test Categories

#### 🔍 Search Classes
- **Happy Paths:**
  - Search for all classes (type="any")
  - Search by specific class type (salsa, bachata, reggaeton)
  - Custom search parameters

- **Unhappy Paths:**
  - Invalid class type
  - Empty body (tests default behavior)
  - Malformed JSON

#### 📖 Get Class
- **Happy Paths:**
  - Get class by valid ID
  - Test URL encoding with special characters
  - Custom class ID input

- **Unhappy Paths:**
  - Non-existent class ID
  - Malformed class ID

#### ✅ Book Class
- **Happy Paths:**
  - Book class with valid email
  - Book class with available spots
  - Custom booking details

- **Unhappy Paths:**
  - Invalid email format
  - Missing email field
  - Non-existent class ID
  - Duplicate booking (same email, same class)
  - Fully booked class
  - Malformed JSON

## Test Scenarios

### Example Test Flow

1. Search for available classes
2. Select a class with available spots
3. Book the class with a test email
4. Verify the booking response
5. Try booking again with the same email (should fail)
6. Search to verify spots were decremented

### Pre-configured Scenarios

Each test category includes:
- Pre-configured happy path tests with realistic data
- Comprehensive unhappy path tests for error handling
- Custom input options for ad-hoc testing

## API Endpoints

The CLI tests these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/classes/search` | POST | Search for classes by type |
| `/classes/{classId}` | GET | Get a specific class details |
| `/classes/{classId}/book` | POST | Book a class with email |

## Expected Responses

### Search Classes
```json
{
  "classes": [
    {
      "id": "CLASS#2025-11-04#TUE#1830",
      "type": "salsa",
      "level": 1,
      "date": "2025-11-04",
      "startTime": "18:30",
      "maxSpots": 20,
      "spotsRemaining": 12
    }
  ]
}
```

### Get Class
```json
{
  "id": "CLASS#2025-11-04#TUE#1830",
  "type": "salsa",
  "level": 1,
  "date": "2025-11-04",
  "startTime": "18:30",
  "maxSpots": 20,
  "spotsRemaining": 12
}
```

### Book Class
```json
{
  "classId": "CLASS#2025-11-04#TUE#1830",
  "email": "test@example.com",
  "bookedAt": "2025-11-04T12:34:56.789Z"
}
```

## Error Handling Tests

The CLI includes tests for common error scenarios:

- **400 Bad Request**: Invalid input (malformed JSON, invalid email, etc.)
- **404 Not Found**: Non-existent class ID
- **409 Conflict**: Duplicate booking or fully booked class
- **500 Internal Server Error**: Unexpected errors

## Tips

- Use the "Custom" options in each category to test specific edge cases
- The CLI automatically generates unique test emails using timestamps
- Each request shows the full HTTP request and response for debugging
- Errors are displayed in red, successful responses in green

## Troubleshooting

### API not responding
Make sure the local API is running on port 3000:
```bash
curl http://localhost:3000/dev/classes/search -X POST -H "Content-Type: application/json" -d '{"type":"any"}'
```

### No classes found
The seed data should be automatically loaded. If not, run:
```bash
pnpm seed:generate
```

### Connection refused
Ensure both DynamoDB Local and Serverless Offline are running:
```bash
# Check DynamoDB
curl http://localhost:8000

# Check API
curl http://localhost:3000
```

## Advanced Usage

### Running Multiple Tests in Sequence

You can modify the CLI script to add batch testing:

1. Open `scripts/test-cli.ts`
2. Add custom test sequences in the main menu
3. Chain multiple API calls for complex scenarios

### Using with CI/CD

While this CLI is interactive, you can create non-interactive test scripts for CI/CD by:

1. Extracting the request functions
2. Creating automated test suites with assertions
3. Using vitest or jest for automated testing

## Related Scripts

- `pnpm dev` - Start local API server
- `pnpm dynamodb:admin` - Open DynamoDB Admin UI (port 8001)
- `pnpm seed:generate` - Regenerate seed data
- `pnpm test` - Run unit tests
