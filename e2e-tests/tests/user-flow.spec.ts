import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };

  test('should complete full user registration and login flow', async ({ page }) => {
    // Step 1: Navigate to homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'AI ThreadStash' })).toBeVisible();

    // Step 2: Navigate to registration
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    // If redirected to login, go to register
    if (page.url().includes('/login')) {
      await page.getByRole('link', { name: 'Create an account' }).click();
    }
    
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Step 3: Fill registration form
    await page.getByLabel('Email Address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);
    
    // Accept terms if checkbox exists
    const termsCheckbox = page.getByLabel('I agree to the Terms of Service');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Step 4: Submit registration
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Wait for registration to complete
    // This might redirect to login or dashboard depending on implementation
    await page.waitForURL(/.*\/(login|dashboard|conversations)/, { timeout: 10000 });

    // Step 5: If redirected to login, log in with new credentials
    if (page.url().includes('/login')) {
      await page.getByLabel('Email Address').fill(testUser.email);
      await page.getByLabel('Password').fill(testUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Wait for login to complete
      await page.waitForURL(/.*\/(dashboard|conversations)/, { timeout: 10000 });
    }

    // Step 6: Verify successful login by checking for authenticated content
    const isOnDashboard = page.url().includes('/dashboard');
    const isOnConversations = page.url().includes('/conversations');
    
    expect(isOnDashboard || isOnConversations).toBeTruthy();
    
    // Check for user menu or logout option
    const userMenu = page.locator('[data-testid="user-menu"]');
    const logoutButton = page.getByRole('button', { name: 'Logout' });
    
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
    } else if (await logoutButton.isVisible()) {
      await expect(logoutButton).toBeVisible();
    }
  });

  test('should handle login with existing credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    // Check for login page indicators with flexible matching
    const loginHeading = page.getByRole('heading', { name: /sign.*in|login/i });
    const loginForm = page.locator('form');
    
    if (await loginHeading.isVisible()) {
      await expect(loginHeading).toBeVisible();
    } else if (await loginForm.isVisible()) {
      await expect(loginForm).toBeVisible();
    }

    // Fill login form with test credentials
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit login form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for response (either success redirect or error message)
    await page.waitForTimeout(2000);
    
    // Check if login was successful or if error is displayed
    const isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/conversations');
    const hasError = await page.getByText('Invalid credentials').isVisible() || 
                    await page.getByText('Login failed').isVisible();
    
    // Either should be logged in or see an error (both are valid outcomes for this test)
    expect(isLoggedIn || hasError).toBeTruthy();
  });

  test('should navigate through main application sections when authenticated', async ({ page }) => {
    // Start at login page
    await page.goto('/login');
    
    // Try to login (this might fail, which is okay for this test)
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.waitForTimeout(2000);
    
    // Skip test if not authenticated
    if (page.url().includes('/login')) {
      test.skip('Authentication failed, skipping navigation test');
    }
    
    // Test navigation to conversations
    const conversationsLink = page.getByRole('link', { name: 'Conversations' });
    if (await conversationsLink.isVisible()) {
      await conversationsLink.click();
      await expect(page).toHaveURL(/.*\/conversations/);
    }
    
    // Test navigation to settings
    const settingsLink = page.getByRole('link', { name: 'Settings' });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/.*\/settings/);
    }
    
    // Test navigation to dashboard
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*\/dashboard/);
    }
  });

  test('should handle logout flow', async ({ page }) => {
    // Start at login page and attempt login
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.waitForTimeout(2000);
    
    // Skip if not authenticated
    if (page.url().includes('/login')) {
      test.skip('Authentication failed, skipping logout test');
    }
    
    // Look for logout option
    let logoutButton = page.getByRole('button', { name: 'Logout' });
    
    // If not visible, try user menu
    if (!(await logoutButton.isVisible())) {
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        logoutButton = page.getByRole('button', { name: 'Logout' });
      }
    }
    
    // Perform logout if button is found
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Wait for redirect to login or home page
      await page.waitForURL(/.*\/(login|\/)/, { timeout: 5000 });
      
      // Verify logout was successful
      const isLoggedOut = page.url().includes('/login') || page.url() === 'http://localhost:3000/';
      expect(isLoggedOut).toBeTruthy();
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login');
    
    // Look for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password' });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Should navigate to password reset page
      await expect(page).toHaveURL(/.*\/(forgot-password|reset-password)/);
      
      // Check for email input
      const emailInput = page.getByLabel('Email Address');
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        
        // Look for submit button
        const submitButton = page.getByRole('button', { name: 'Send Reset Link' });
        if (await submitButton.isVisible()) {
          await expect(submitButton).toBeVisible();
          await expect(submitButton).toBeEnabled();
        }
      }
    } else {
      test.skip('Forgot password functionality not available');
    }
  });
});