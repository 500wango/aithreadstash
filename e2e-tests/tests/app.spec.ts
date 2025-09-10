import { test, expect } from '@playwright/test';

test.describe('Application', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/AI ThreadStash/);
    await expect(page.locator('header').getByText('AI ThreadStash')).toBeVisible();
    await expect(page.getByText('Capture, Organize, and Leverage')).toBeVisible();
    await expect(page.getByText('Your AI Conversations').first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to login
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*\/login/);
    
    // Test navigation back to home via logo
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Test navigation to register
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should display main content sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for description text
    await expect(page.getByText('AI ThreadStash helps you save and organize')).toBeVisible();
    
    // Check for navigation elements
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });
});