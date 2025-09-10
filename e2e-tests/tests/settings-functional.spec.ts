import { test, expect } from '@playwright/test';

test.describe('User Settings - Functional Tests', () => {
  const mockUserSettings = {
    email: 'test@example.com',
    apiKeys: {
      openai: 'sk-mock-openai-key',
      anthropic: '',
      deepseek: ''
    }
  };

  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    apiKeys: mockUserSettings.apiKeys
  };

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage to bypass authentication
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'test-auth-token');
    });

    // Mock user profile API
    await page.route('**/users/profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // Mock settings update API
    await page.route('**/users/profile', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser)
        });
      }
    });

    // Navigate directly to settings page with mocked auth
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should load settings page without redirecting to login', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we are on the settings page
    await expect(page).toHaveURL(/.*settings/);
    
    // Verify the page is not showing login form
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});