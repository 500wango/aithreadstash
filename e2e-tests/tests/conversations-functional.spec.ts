import { test, expect } from '@playwright/test';

test.describe('Conversations Management - Functional Tests', () => {
  const allConversations = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Conversation ${i + 1}`,
    summary: `Summary for conversation ${i + 1}`,
    messages: [
      { role: 'user' as const, content: 'Hello', timestamp: new Date().toISOString() },
      { role: 'assistant' as const, content: 'Hi there', timestamp: new Date().toISOString() }
    ],
    tokenCount: 100,
    status: 'active' as const,
    model: 'gpt-4',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage to bypass authentication
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'test-auth-token');
    });

    // Mock user profile
    await page.route('**/users/profile', route => {
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

    // Mock conversations API - match the actual endpoint used by ApiService
    await page.route('**/conversations**', route => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status') || 'all';

      let filteredConversations = allConversations;

      if (status && status !== 'all') {
        filteredConversations = filteredConversations.filter(c => 
          c.status === status || 
          (status === 'active' && c.status !== 'archived' && c.status !== 'deleted')
        );
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filteredConversations),
      });
    });

    // Navigate directly to conversations page with mocked auth
    await page.goto('/conversations');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load conversations page without redirecting to login', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we are on the conversations page
    await expect(page).toHaveURL(/.*conversations/);
    
    // Verify the page is not showing login form
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});