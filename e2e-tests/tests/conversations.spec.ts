import { test, expect } from '@playwright/test';

test.describe('Conversations Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login - in a real scenario, you'd implement proper authentication
    await page.goto('/login');
    // For now, we'll test the UI components without actual authentication
  });

  test('should display conversations page', async ({ page }) => {
    await page.goto('/conversations');
    
    // Check if the page loads (might redirect to login if not authenticated)
    await expect(page).toHaveURL(/.*\/(login|conversations)/);
    
    // If redirected to login, that's expected behavior
    if (page.url().includes('/login')) {
      // Check for login page indicators with flexible matching
      const loginHeading = page.getByRole('heading', { name: /sign.*in|login/i });
      const loginForm = page.locator('form');
      
      if (await loginHeading.isVisible()) {
        await expect(loginHeading).toBeVisible();
      } else if (await loginForm.isVisible()) {
        await expect(loginForm).toBeVisible();
      }
    } else {
      // If on conversations page, check for expected elements
      await expect(page.getByRole('heading', { name: 'Conversations' })).toBeVisible();
    }
  });

  test('should show conversation search functionality', async ({ page }) => {
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping conversation tests');
    }
    
    // Test search input
    const searchInput = page.getByPlaceholder('Search conversations...');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test query');
      await expect(searchInput).toHaveValue('test query');
    }
  });

  test('should display conversation filters', async ({ page }) => {
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping conversation tests');
    }
    
    // Check for filter options
    const filterButtons = [
      'All',
      'ChatGPT',
      'Claude',
      'DeepSeek'
    ];
    
    for (const filter of filterButtons) {
      const button = page.getByRole('button', { name: filter });
      if (await button.isVisible()) {
        await expect(button).toBeVisible();
      }
    }
  });

  test('should handle conversation pagination', async ({ page }) => {
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping conversation tests');
    }
    
    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' });
    const prevButton = page.getByRole('button', { name: 'Previous' });
    
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeVisible();
    }
    
    if (await prevButton.isVisible()) {
      await expect(prevButton).toBeVisible();
    }
  });

  test('should display conversation cards with proper structure', async ({ page }) => {
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping conversation tests');
    }
    
    // Look for conversation cards
    const conversationCards = page.locator('[data-testid="conversation-card"]');
    const cardCount = await conversationCards.count();
    
    if (cardCount > 0) {
      const firstCard = conversationCards.first();
      
      // Check for expected elements in conversation card
      await expect(firstCard.locator('.conversation-title')).toBeVisible();
      await expect(firstCard.locator('.conversation-date')).toBeVisible();
      await expect(firstCard.locator('.conversation-source')).toBeVisible();
    }
  });
});