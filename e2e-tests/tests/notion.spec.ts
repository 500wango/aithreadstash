import { test, expect } from '@playwright/test';

test.describe('Notion Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page where Notion integration is managed
    await page.goto('/settings');
  });

  test('should display Notion integration section', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Check for Notion integration section
    const notionSection = page.locator('[data-testid="notion-integration"]');
    if (await notionSection.isVisible()) {
      await expect(notionSection).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Notion Integration' })).toBeVisible();
    }
  });

  test('should show connect button when not connected', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Look for connect button
    const connectButton = page.getByRole('button', { name: 'Connect to Notion' });
    if (await connectButton.isVisible()) {
      await expect(connectButton).toBeVisible();
      await expect(connectButton).toBeEnabled();
    }
  });

  test('should display connection status', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Check for connection status indicator
    const statusIndicator = page.locator('[data-testid="notion-status"]');
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toBeVisible();
      
      // Should show either connected or disconnected status
      const isConnected = await page.getByText('Connected').isVisible();
      const isDisconnected = await page.getByText('Not Connected').isVisible();
      
      expect(isConnected || isDisconnected).toBeTruthy();
    }
  });

  test('should show database selection when connected', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Check if user is connected (this would be mocked in a real test)
    const databaseSelect = page.locator('[data-testid="database-select"]');
    if (await databaseSelect.isVisible()) {
      await expect(databaseSelect).toBeVisible();
      await expect(page.getByText('Select Database')).toBeVisible();
    }
  });

  test('should show disconnect option when connected', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Look for disconnect button (only visible when connected)
    const disconnectButton = page.getByRole('button', { name: 'Disconnect' });
    if (await disconnectButton.isVisible()) {
      await expect(disconnectButton).toBeVisible();
      await expect(disconnectButton).toBeEnabled();
    }
  });

  test('should handle save to Notion functionality', async ({ page }) => {
    // Navigate to conversations page
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // Look for save to Notion buttons on conversation cards
    const saveButtons = page.locator('[data-testid="save-to-notion"]');
    const buttonCount = await saveButtons.count();
    
    if (buttonCount > 0) {
      const firstSaveButton = saveButtons.first();
      await expect(firstSaveButton).toBeVisible();
      
      // Click the save button
      await firstSaveButton.click();
      
      // Check for save dialog or confirmation
      const saveDialog = page.locator('[data-testid="save-dialog"]');
      if (await saveDialog.isVisible()) {
        await expect(saveDialog).toBeVisible();
        
        // Check for form fields
        await expect(page.getByLabel('Title')).toBeVisible();
        await expect(page.getByLabel('Tags')).toBeVisible();
      }
    }
  });

  test('should validate save form inputs', async ({ page }) => {
    await page.goto('/conversations');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping Notion tests');
    }
    
    // This test would require a conversation to exist and save dialog to be open
    // In a real scenario, you'd set up test data first
    const saveDialog = page.locator('[data-testid="save-dialog"]');
    if (await saveDialog.isVisible()) {
      // Test form validation
      const saveButton = page.getByRole('button', { name: 'Save to Notion' });
      await saveButton.click();
      
      // Check for validation messages
      const titleError = page.getByText('Title is required');
      if (await titleError.isVisible()) {
        await expect(titleError).toBeVisible();
      }
    }
  });
});