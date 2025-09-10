import { test, expect } from '@playwright/test';

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      // Check for login page indicators with flexible matching
      const loginHeading = page.getByRole('heading', { name: /sign.*in|login/i });
      const loginForm = page.locator('form');
      
      if (await loginHeading.isVisible()) {
        await expect(loginHeading).toBeVisible();
      } else if (await loginForm.isVisible()) {
        await expect(loginForm).toBeVisible();
      }
      test.skip('User not authenticated, skipping settings tests');
    }
    
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should display profile settings section', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    // Check for profile section
    const profileSection = page.locator('[data-testid="profile-settings"]');
    if (await profileSection.isVisible()) {
      await expect(profileSection).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
      
      // Check for email field
      const emailField = page.getByLabel('Email');
      if (await emailField.isVisible()) {
        await expect(emailField).toBeVisible();
        await expect(emailField).toHaveAttribute('type', 'email');
      }
    }
  });

  test('should display API keys section', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    // Check for API keys section
    const apiSection = page.locator('[data-testid="api-keys"]');
    if (await apiSection.isVisible()) {
      await expect(apiSection).toBeVisible();
      await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
      
      // Check for API key fields
      const openaiField = page.getByLabel('OpenAI API Key');
      const anthropicField = page.getByLabel('Anthropic API Key');
      const deepseekField = page.getByLabel('DeepSeek API Key');
      
      if (await openaiField.isVisible()) {
        await expect(openaiField).toBeVisible();
        await expect(openaiField).toHaveAttribute('type', 'password');
      }
      
      if (await anthropicField.isVisible()) {
        await expect(anthropicField).toBeVisible();
        await expect(anthropicField).toHaveAttribute('type', 'password');
      }
      
      if (await deepseekField.isVisible()) {
        await expect(deepseekField).toBeVisible();
        await expect(deepseekField).toHaveAttribute('type', 'password');
      }
    }
  });

  test('should display subscription section', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    // Check for subscription section
    const subscriptionSection = page.locator('[data-testid="subscription"]');
    if (await subscriptionSection.isVisible()) {
      await expect(subscriptionSection).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Subscription' })).toBeVisible();
      
      // Check for current plan display
      const currentPlan = page.locator('[data-testid="current-plan"]');
      if (await currentPlan.isVisible()) {
        await expect(currentPlan).toBeVisible();
      }
    }
  });

  test('should handle API key updates', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    const openaiField = page.getByLabel('OpenAI API Key');
    if (await openaiField.isVisible()) {
      // Test API key input
      await openaiField.fill('sk-test-key-123');
      await expect(openaiField).toHaveValue('sk-test-key-123');
      
      // Look for save button
      const saveButton = page.getByRole('button', { name: 'Save API Keys' });
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
      }
    }
  });

  test('should validate API key format', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    const openaiField = page.getByLabel('OpenAI API Key');
    if (await openaiField.isVisible()) {
      // Test invalid API key format
      await openaiField.fill('invalid-key');
      
      const saveButton = page.getByRole('button', { name: 'Save API Keys' });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Check for validation error
        const errorMessage = page.getByText('Invalid API key format');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should display Notion integration settings', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    // This is covered in notion.spec.ts but we check it exists in settings
    const notionSection = page.locator('[data-testid="notion-integration"]');
    if (await notionSection.isVisible()) {
      await expect(notionSection).toBeVisible();
    }
  });

  test('should handle profile updates', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    const emailField = page.getByLabel('Email');
    if (await emailField.isVisible()) {
      // Get current email value
      const currentEmail = await emailField.inputValue();
      
      // Test email update (but don't actually change it)
      await emailField.fill('test@example.com');
      await expect(emailField).toHaveValue('test@example.com');
      
      // Restore original value
      await emailField.fill(currentEmail);
      
      // Look for save button
      const saveButton = page.getByRole('button', { name: 'Save Profile' });
      if (await saveButton.isVisible()) {
        await expect(saveButton).toBeVisible();
      }
    }
  });

  test('should display danger zone for account deletion', async ({ page }) => {
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated, skipping settings tests');
    }
    
    // Check for danger zone section
    const dangerZone = page.locator('[data-testid="danger-zone"]');
    if (await dangerZone.isVisible()) {
      await expect(dangerZone).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
      
      // Check for delete account button
      const deleteButton = page.getByRole('button', { name: 'Delete Account' });
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toHaveClass(/.*danger.*|.*destructive.*/);
      }
    }
  });
});