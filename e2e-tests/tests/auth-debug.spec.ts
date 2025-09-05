import { test, expect } from '@playwright/test';

test('debug authentication flow', async ({ page }) => {
  // Set auth token in localStorage to bypass authentication
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'test-auth-token');
  });

  // Mock user profile
  await page.route('**/api/users/profile', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        subscriptionStatus: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });
  });

  // Mock conversations for conversations page
  await page.route('**/api/conversations**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 1, title: 'Test Conversation', source: 'ChatGPT', content: 'Test content', created_at: new Date().toISOString() }
        ],
        count: 1
      })
    });
  });

  // Navigate to conversations page
  await page.goto('/conversations');
  
  // Wait and take screenshot
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-auth.png', fullPage: true });
  
  // Check current URL
  console.log('Current URL:', page.url());
  
  // Check if we're on the right page
  const title = await page.title();
  console.log('Page title:', title);
});