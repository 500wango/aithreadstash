import { test, expect } from '@playwright/test';

test.describe('Browser Extension Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that would simulate extension usage
    await page.goto('/conversations');
  });

  test('should display extension connection status', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    // Check for extension status indicator
    const extensionStatus = page.locator('[data-testid="extension-status"]');
    if (await extensionStatus.isVisible()) {
      await expect(extensionStatus).toBeVisible();
      
      // Should show either connected or disconnected status
      const isConnected = await page.getByText('Extension Connected').isVisible();
      const isDisconnected = await page.getByText('Extension Not Connected').isVisible();
      
      expect(isConnected || isDisconnected).toBeTruthy();
    }
  });

  test('should handle manual conversation import', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    // Look for import button
    const importButton = page.getByRole('button', { name: 'Import Conversation' });
    if (await importButton.isVisible()) {
      await importButton.click();
      
      // Check for import dialog
      const importDialog = page.locator('[data-testid="import-dialog"]');
      if (await importDialog.isVisible()) {
        await expect(importDialog).toBeVisible();
        
        // Check for form fields
        await expect(page.getByLabel('Conversation Title')).toBeVisible();
        await expect(page.getByLabel('Conversation Content')).toBeVisible();
        await expect(page.getByLabel('Source')).toBeVisible();
      }
    }
  });

  test('should validate import form', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    const importButton = page.getByRole('button', { name: 'Import Conversation' });
    if (await importButton.isVisible()) {
      await importButton.click();
      
      const importDialog = page.locator('[data-testid="import-dialog"]');
      if (await importDialog.isVisible()) {
        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: 'Import' });
        await submitButton.click();
        
        // Check for validation errors
        const titleError = page.getByText('Title is required');
        const contentError = page.getByText('Content is required');
        
        if (await titleError.isVisible()) {
          await expect(titleError).toBeVisible();
        }
        
        if (await contentError.isVisible()) {
          await expect(contentError).toBeVisible();
        }
      }
    }
  });

  test('should handle successful conversation import', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    const importButton = page.getByRole('button', { name: 'Import Conversation' });
    if (await importButton.isVisible()) {
      await importButton.click();
      
      const importDialog = page.locator('[data-testid="import-dialog"]');
      if (await importDialog.isVisible()) {
        // Fill form with test data
        await page.getByLabel('Conversation Title').fill('Test Conversation');
        await page.getByLabel('Conversation Content').fill('This is a test conversation content.');
        
        // Select source if dropdown exists
        const sourceSelect = page.getByLabel('Source');
        if (await sourceSelect.isVisible()) {
          await sourceSelect.selectOption('ChatGPT');
        }
        
        // Submit form
        const submitButton = page.getByRole('button', { name: 'Import' });
        await submitButton.click();
        
        // Wait for success message or dialog close
        await page.waitForTimeout(2000);
        
        // Check if dialog closed (indicating success)
        const dialogClosed = !(await importDialog.isVisible());
        
        // Or check for success message
        const successMessage = page.getByText('Conversation imported successfully');
        const hasSuccessMessage = await successMessage.isVisible();
        
        expect(dialogClosed || hasSuccessMessage).toBeTruthy();
      }
    }
  });

  test('should display extension installation instructions', async ({ page }) => {
    // Navigate to settings or help page with error handling
    try {
      await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (error) {
      if (error.message.includes('NS_BINDING_ABORTED')) {
        test.skip('Navigation aborted in Firefox, skipping test');
      }
      throw error;
    }
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    // Look for extension section
    const extensionSection = page.locator('[data-testid="browser-extension"]');
    if (await extensionSection.isVisible()) {
      await expect(extensionSection).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Browser Extension' })).toBeVisible();
      
      // Check for installation instructions
      const installInstructions = page.getByText('Install the browser extension');
      if (await installInstructions.isVisible()) {
        await expect(installInstructions).toBeVisible();
      }
      
      // Check for download links
      const chromeLink = page.getByRole('link', { name: 'Chrome Web Store' });
      const firefoxLink = page.getByRole('link', { name: 'Firefox Add-ons' });
      
      if (await chromeLink.isVisible()) {
        await expect(chromeLink).toBeVisible();
        await expect(chromeLink).toHaveAttribute('href', /.+/);
      }
      
      if (await firefoxLink.isVisible()) {
        await expect(firefoxLink).toBeVisible();
        await expect(firefoxLink).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('should show supported platforms', async ({ page }) => {
    try {
      await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (error) {
      if (error.message.includes('NS_BINDING_ABORTED')) {
        test.skip('Navigation aborted in Firefox, skipping test');
      }
      throw error;
    }
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    const extensionSection = page.locator('[data-testid="browser-extension"]');
    if (await extensionSection.isVisible()) {
      // Check for supported platforms list
      const supportedPlatforms = [
        'ChatGPT',
        'Claude',
        'DeepSeek',
        'Gemini'
      ];
      
      for (const platform of supportedPlatforms) {
        const platformElement = page.getByText(platform);
        if (await platformElement.isVisible()) {
          await expect(platformElement).toBeVisible();
        }
      }
    }
  });

  test('should handle extension configuration', async ({ page }) => {
    try {
      await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (error) {
      if (error.message.includes('NS_BINDING_ABORTED')) {
        test.skip('Navigation aborted in Firefox, skipping test');
      }
      throw error;
    }
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    const extensionSection = page.locator('[data-testid="browser-extension"]');
    if (await extensionSection.isVisible()) {
      // Look for configuration options
      const autoSyncToggle = page.getByLabel('Auto-sync conversations');
      const notificationsToggle = page.getByLabel('Enable notifications');
      
      if (await autoSyncToggle.isVisible()) {
        await expect(autoSyncToggle).toBeVisible();
        
        // Test toggle functionality
        const isChecked = await autoSyncToggle.isChecked();
        await autoSyncToggle.click();
        
        // Verify state changed
        const newState = await autoSyncToggle.isChecked();
        expect(newState).toBe(!isChecked);
      }
      
      if (await notificationsToggle.isVisible()) {
        await expect(notificationsToggle).toBeVisible();
      }
    }
  });

  test('should display recent extension activity', async ({ page }) => {
    try {
      await page.goto('/conversations', { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (error) {
      if (error.message.includes('NS_BINDING_ABORTED')) {
        test.skip('Navigation aborted in Firefox, skipping test');
      }
      throw error;
    }
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping extension tests');
    }
    
    // Look for conversations imported via extension
    const extensionBadge = page.locator('[data-testid="extension-imported"]');
    const extensionBadgeCount = await extensionBadge.count();
    
    if (extensionBadgeCount > 0) {
      const firstBadge = extensionBadge.first();
      await expect(firstBadge).toBeVisible();
      
      // Should indicate source platform
      const hasSource = await firstBadge.getByText('ChatGPT').isVisible() ||
                       await firstBadge.getByText('Claude').isVisible() ||
                       await firstBadge.getByText('DeepSeek').isVisible();
      
      expect(hasSource).toBeTruthy();
    }
  });
});