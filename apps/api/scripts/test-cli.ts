#!/usr/bin/env tsx

import inquirer from 'inquirer';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:3000';
const STAGE = process.env.STAGE || 'dev'; // Default to 'dev' to match serverless.yml

interface TestScenario {
  name: string;
  description: string;
  execute: () => Promise<void>;
}

// Utility function to make HTTP requests
async function makeRequest(
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: any; headers: any }> {
  const url = `${BASE_URL}/${STAGE}${path}`;

  console.log(chalk.blue(`\n→ ${method} ${url}`));
  if (body) {
    console.log(chalk.gray(JSON.stringify(body, null, 2)));
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    console.log(chalk.green(`\n✓ Status: ${response.status}`));
    console.log(chalk.gray(JSON.stringify(data, null, 2)));

    return {
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error) {
    console.error(chalk.red(`\n✗ Request failed: ${error}`));
    throw error;
  }
}

// Test Scenarios

// SEARCH CLASSES
const searchClassesScenarios: TestScenario[] = [
  {
    name: 'Search for all classes',
    description: 'Happy path: Search with type="any"',
    async execute() {
      await makeRequest('POST', '/classes/search', { type: 'any' });
    },
  },
  {
    name: 'Search for salsa classes',
    description: 'Happy path: Search with type="salsa"',
    async execute() {
      await makeRequest('POST', '/classes/search', { type: 'salsa' });
    },
  },
  {
    name: 'Search for bachata classes',
    description: 'Happy path: Search with type="bachata"',
    async execute() {
      await makeRequest('POST', '/classes/search', { type: 'bachata' });
    },
  },
  {
    name: 'Search for reggaeton classes',
    description: 'Happy path: Search with type="reggaeton"',
    async execute() {
      await makeRequest('POST', '/classes/search', { type: 'reggaeton' });
    },
  },
  {
    name: 'Search with invalid type',
    description: 'Unhappy path: Invalid type value',
    async execute() {
      await makeRequest('POST', '/classes/search', { type: 'invalid-type' });
    },
  },
  {
    name: 'Search with empty body',
    description: 'Unhappy path: Missing type field (should default to "any")',
    async execute() {
      await makeRequest('POST', '/classes/search', {});
    },
  },
  {
    name: 'Search with malformed JSON',
    description: 'Unhappy path: Invalid JSON in request body',
    async execute() {
      const url = `${BASE_URL}/${STAGE}/classes/search`;
      console.log(chalk.blue(`\n→ POST ${url}`));
      console.log(chalk.gray('Sending malformed JSON...'));

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{ invalid json }',
        });

        const data = await response.json();
        console.log(chalk.green(`\n✓ Status: ${response.status}`));
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      } catch (error) {
        console.error(chalk.red(`\n✗ Request failed: ${error}`));
      }
    },
  },
  {
    name: 'Custom search',
    description: 'Enter custom search parameters',
    async execute() {
      const { type } = await inquirer.prompt([
        {
          type: 'input',
          name: 'type',
          message: 'Enter class type (salsa/bachata/reggaeton/any):',
          default: 'any',
        },
      ]);

      await makeRequest('POST', '/classes/search', { type });
    },
  },
];

// GET CLASS
const getClassScenarios: TestScenario[] = [
  {
    name: 'Get class by valid ID',
    description: 'Happy path: Retrieve an existing class',
    async execute() {
      // First search for a class to get a valid ID
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const classId = searchResponse.data.classes[0].id;
        console.log(chalk.yellow(`\nUsing class ID: ${classId}`));
        await makeRequest('GET', `/classes/${encodeURIComponent(classId)}`, undefined);
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Get class with invalid ID',
    description: 'Unhappy path: Non-existent class ID',
    async execute() {
      const invalidId = 'CLASS#9999-99-99#XXX#9999';
      await makeRequest('GET', `/classes/${encodeURIComponent(invalidId)}`, undefined);
    },
  },
  {
    name: 'Get class with malformed ID',
    description: 'Unhappy path: Malformed class ID',
    async execute() {
      const malformedId = 'not-a-valid-id';
      await makeRequest('GET', `/classes/${encodeURIComponent(malformedId)}`, undefined);
    },
  },
  {
    name: 'Get class with special characters in ID',
    description: 'Happy path: Test URL encoding with special characters',
    async execute() {
      const specialId = 'CLASS#2025-11-04#TUE#1830';
      await makeRequest('GET', `/classes/${encodeURIComponent(specialId)}`, undefined);
    },
  },
  {
    name: 'Custom get class',
    description: 'Enter a custom class ID',
    async execute() {
      const { classId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'classId',
          message: 'Enter class ID (e.g., CLASS#2025-11-04#TUE#1830):',
        },
      ]);

      await makeRequest('GET', `/classes/${encodeURIComponent(classId)}`, undefined);
    },
  },
];

// BOOK CLASS
const bookClassScenarios: TestScenario[] = [
  {
    name: 'Book class with valid email',
    description: 'Happy path: Book a class with available spots',
    async execute() {
      // First search for a class with available spots
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const availableClass = searchResponse.data.classes.find(
          (c: any) => c.spotsRemaining > 0
        );

        if (availableClass) {
          const classId = availableClass.id;
          const testEmail = `test-${Date.now()}@example.com`;

          console.log(chalk.yellow(`\nBooking class: ${classId}`));
          console.log(chalk.yellow(`Available spots: ${availableClass.spotsRemaining}`));

          await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, {
            email: testEmail,
          });
        } else {
          console.log(chalk.red('No classes with available spots found'));
        }
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Book class with invalid email',
    description: 'Unhappy path: Invalid email format',
    async execute() {
      // Get any class ID
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const classId = searchResponse.data.classes[0].id;
        await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, {
          email: 'not-an-email',
        });
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Book class with missing email',
    description: 'Unhappy path: No email provided',
    async execute() {
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const classId = searchResponse.data.classes[0].id;
        await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, {});
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Book non-existent class',
    description: 'Unhappy path: Invalid class ID',
    async execute() {
      const invalidId = 'CLASS#9999-99-99#XXX#9999';
      await makeRequest('POST', `/classes/${encodeURIComponent(invalidId)}/book`, {
        email: 'test@example.com',
      });
    },
  },
  {
    name: 'Book class with duplicate email',
    description: 'Unhappy path: Book same class twice with same email',
    async execute() {
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const classId = searchResponse.data.classes[0].id;
        const email = 'duplicate-test@example.com';

        console.log(chalk.yellow('\nAttempting first booking...'));
        await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, { email });

        console.log(chalk.yellow('\nAttempting second booking with same email...'));
        await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, { email });
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Book fully booked class',
    description: 'Unhappy path: Try to book a class with no spots remaining',
    async execute() {
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const fullyBookedClass = searchResponse.data.classes.find(
          (c: any) => c.spotsRemaining === 0
        );

        if (fullyBookedClass) {
          const classId = fullyBookedClass.id;
          console.log(chalk.yellow(`\nTrying to book fully booked class: ${classId}`));

          await makeRequest('POST', `/classes/${encodeURIComponent(classId)}/book`, {
            email: `test-${Date.now()}@example.com`,
          });
        } else {
          console.log(chalk.yellow('No fully booked classes found. All classes have available spots.'));
        }
      } else {
        console.log(chalk.red('No classes found to test with'));
      }
    },
  },
  {
    name: 'Book class with malformed JSON',
    description: 'Unhappy path: Invalid JSON in request body',
    async execute() {
      const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });

      if (searchResponse.data?.classes?.length > 0) {
        const classId = searchResponse.data.classes[0].id;
        const url = `${BASE_URL}/${STAGE}/classes/${encodeURIComponent(classId)}/book`;

        console.log(chalk.blue(`\n→ POST ${url}`));
        console.log(chalk.gray('Sending malformed JSON...'));

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{ invalid json }',
          });

          const data = await response.json();
          console.log(chalk.green(`\n✓ Status: ${response.status}`));
          console.log(chalk.gray(JSON.stringify(data, null, 2)));
        } catch (error) {
          console.error(chalk.red(`\n✗ Request failed: ${error}`));
        }
      }
    },
  },
  {
    name: 'Custom book class',
    description: 'Enter custom booking details',
    async execute() {
      const { classId, email } = await inquirer.prompt([
        {
          type: 'input',
          name: 'classId',
          message: 'Enter class ID (leave empty to search for one):',
        },
        {
          type: 'input',
          name: 'email',
          message: 'Enter email address:',
          default: `test-${Date.now()}@example.com`,
        },
      ]);

      let finalClassId = classId;

      if (!finalClassId) {
        const searchResponse = await makeRequest('POST', '/classes/search', { type: 'any' });
        if (searchResponse.data?.classes?.length > 0) {
          finalClassId = searchResponse.data.classes[0].id;
          console.log(chalk.yellow(`\nUsing class ID: ${finalClassId}`));
        } else {
          console.log(chalk.red('No classes found'));
          return;
        }
      }

      await makeRequest('POST', `/classes/${encodeURIComponent(finalClassId)}/book`, {
        email,
      });
    },
  },
];

// Main menu
async function showMainMenu(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan('\n=== Dance School Booking API Test CLI ===\n'));
  console.log(chalk.gray(`Base URL: ${BASE_URL}/${STAGE}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to test?',
      choices: [
        { name: '🔍 Search Classes', value: 'search' },
        { name: '📖 Get Class', value: 'get' },
        { name: '✅ Book Class', value: 'book' },
        { name: '🚪 Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'search':
      await showScenarioMenu('Search Classes', searchClassesScenarios);
      break;
    case 'get':
      await showScenarioMenu('Get Class', getClassScenarios);
      break;
    case 'book':
      await showScenarioMenu('Book Class', bookClassScenarios);
      break;
    case 'exit':
      console.log(chalk.green('\nGoodbye!\n'));
      process.exit(0);
  }
}

async function showScenarioMenu(title: string, scenarios: TestScenario[]): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan(`\n=== ${title} ===\n`));

  const choices = scenarios.map((scenario, index) => ({
    name: `${scenario.name} ${chalk.gray(`(${scenario.description})`)}`,
    value: index,
  }));

  choices.push({ name: chalk.gray('← Back to main menu'), value: -1 });

  const { scenarioIndex } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scenarioIndex',
      message: 'Select a test scenario:',
      choices,
      pageSize: 15,
    },
  ]);

  if (scenarioIndex === -1) {
    await showMainMenu();
    return;
  }

  const scenario = scenarios[scenarioIndex];
  console.log(chalk.bold(`\n→ Running: ${scenario.name}\n`));
  console.log(chalk.gray(scenario.description));

  try {
    await scenario.execute();
  } catch (error) {
    console.error(chalk.red(`\nTest scenario failed with error:`));
    console.error(error);
  }

  const { again } = await inquirer.prompt([
    {
      type: 'list',
      name: 'again',
      message: '\nWhat next?',
      choices: [
        { name: 'Run another test in this category', value: 'again' },
        { name: 'Back to main menu', value: 'back' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  switch (again) {
    case 'again':
      await showScenarioMenu(title, scenarios);
      break;
    case 'back':
      await showMainMenu();
      break;
    case 'exit':
      console.log(chalk.green('\nGoodbye!\n'));
      process.exit(0);
  }
}

// Start the CLI
async function main() {
  console.log(chalk.yellow('\n⚠️  Make sure your local API is running!'));
  console.log(chalk.gray('Run: pnpm dev\n'));

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Is your local API running?',
      default: true,
    },
  ]);

  if (!ready) {
    console.log(chalk.yellow('\nStart your API with: pnpm dev'));
    console.log(chalk.yellow('Then run this script again.\n'));
    process.exit(0);
  }

  await showMainMenu();
}

main().catch((error) => {
  console.error(chalk.red('\nFatal error:'), error);
  process.exit(1);
});
