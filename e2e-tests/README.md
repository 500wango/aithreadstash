# End-to-End Tests

This directory contains comprehensive end-to-end tests for the AI ThreadStash application using Playwright.

## Test Coverage

The test suite covers the following areas:

### 1. Application Core (`app.spec.ts`)
- Homepage display and navigation
- Basic application functionality
- Footer links and general UI elements

### 2. Authentication (`auth.spec.ts`)
- Login page functionality
- Form validation
- Registration navigation
- Pricing page display

### 3. Conversations Management (`conversations.spec.ts`)
- Conversations page display
- Search functionality
- Filter options (All, ChatGPT, Claude, DeepSeek)
- Pagination controls
- Conversation card structure

### 4. Notion Integration (`notion.spec.ts`)
- Notion integration settings
- Connection status display
- Database selection
- Save to Notion functionality
- Form validation for saving

### 5. User Settings (`settings.spec.ts`)
- Profile settings
- API keys management
- Subscription information
- Notion integration settings
- Account deletion (danger zone)

### 6. Complete User Flow (`user-flow.spec.ts`)
- Full registration and login process
- Navigation between application sections
- Logout functionality
- Password reset flow

### 7. Browser Extension Integration (`browser-extension.spec.ts`)
- Extension connection status
- Manual conversation import
- Import form validation
- Extension configuration
- Recent activity display

## Prerequisites

Before running the tests, ensure you have:

1. **Node.js** installed (version 16 or higher)
2. **Frontend and Backend services** running:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`

## Installation

```bash
cd e2e-tests
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests on specific browsers
```bash
# Chrome only
npm run test:chromium

# Firefox only
npm run test:firefox

# Safari only
npm run test:webkit
```

### Run specific test files
```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only conversation tests
npx playwright test conversations.spec.ts

# Run only Notion integration tests
npx playwright test notion.spec.ts
```

### Run tests with specific tags or patterns
```bash
# Run tests matching a pattern
npx playwright test --grep "should display"

# Run tests in a specific file matching a pattern
npx playwright test conversations.spec.ts --grep "search"
```

## Test Configuration

The tests are configured in `playwright.config.ts` with the following settings:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari
- **Parallel execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Trace collection**: On first retry
- **Auto-start servers**: Frontend and Backend

## Test Structure

Each test file follows this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Authentication Handling

Most tests handle authentication gracefully:

- Tests check if the user is redirected to login
- If authentication is required but not available, tests are skipped
- This allows tests to run in both authenticated and non-authenticated states

## Best Practices

1. **Graceful Degradation**: Tests check for element visibility before interacting
2. **Skip When Appropriate**: Tests skip when prerequisites aren't met
3. **Clear Assertions**: Each test has clear, specific assertions
4. **Realistic User Flows**: Tests simulate real user interactions
5. **Cross-Browser Compatibility**: Tests run on multiple browsers

## Debugging

### View Test Results
After running tests, open the HTML report:
```bash
npx playwright show-report
```

### Debug Specific Test
```bash
npx playwright test --debug auth.spec.ts
```

### Record New Tests
```bash
npx playwright codegen http://localhost:3000
```

## CI/CD Integration

The tests are configured to run in CI environments with:
- Reduced parallelism
- Automatic retries
- Headless mode
- Artifact collection on failure

## Troubleshooting

### Common Issues

1. **Services not running**: Ensure frontend and backend are running on correct ports
2. **Authentication failures**: Check if test user credentials are valid
3. **Timeout errors**: Increase timeout in playwright.config.ts if needed
4. **Element not found**: Check if UI has changed and update selectors

### Environment Variables

You can set these environment variables to customize test behavior:

- `CI=true`: Enables CI mode with retries
- `HEADLESS=false`: Run tests in headed mode
- `SLOW_MO=1000`: Add delay between actions for debugging

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate `data-testid` attributes to UI elements
3. Handle authentication states gracefully
4. Include both positive and negative test cases
5. Update this README if adding new test categories

## Test Data

Tests use minimal test data and avoid dependencies on external services where possible. Mock data is preferred over real API calls for reliability and speed.