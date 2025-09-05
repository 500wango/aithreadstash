import { test, expect } from '@playwright/test';

test.describe('Debug Test', () => {
  test('should load conversations page', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true })
      });
    });

    // Mock conversations API
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

    // Navigate to conversations
    await page.goto('/conversations');
    
    // Take a screenshot to debug
    await page.screenshot({ path: 'debug-conversations.png', fullPage: true });
    
    // Log page content
    const content = await page.content();
    console.log('Page content:', content.substring(0, 500));
    
    // Check if any content is visible
    await expect(page.locator('body')).toBeVisible();
  });
});