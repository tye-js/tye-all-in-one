import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: 'TYE All-in-One' })).toBeVisible();
    
    // Check if the description is present
    await expect(page.getByText('Your comprehensive platform for information sharing')).toBeVisible();
    
    // Check if navigation links are present
    await expect(page.getByRole('link', { name: 'Browse Articles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try Text-to-Speech' })).toBeVisible();
  });

  test('should navigate to articles page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Browse Articles button
    await page.getByRole('link', { name: 'Browse Articles' }).click();
    
    // Should navigate to articles page
    await expect(page).toHaveURL('/articles');
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
  });

  test('should navigate to TTS page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Try Text-to-Speech button
    await page.getByRole('link', { name: 'Try Text-to-Speech' }).click();
    
    // Should navigate to TTS page
    await expect(page).toHaveURL('/tts');
    await expect(page.getByRole('heading', { name: 'Text-to-Speech' })).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    // Check if feature cards are present
    await expect(page.getByText('Information Sharing')).toBeVisible();
    await expect(page.getByText('Text-to-Speech')).toBeVisible();
    await expect(page.getByText('Content Management')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');
    
    // Check if stats are displayed
    await expect(page.getByText('Articles Published')).toBeVisible();
    await expect(page.getByText('TTS Conversions')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile navigation on smaller screens
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    await expect(mobileMenuButton).toBeVisible();
    
    // Click mobile menu
    await mobileMenuButton.click();
    
    // Navigation items should be visible in mobile menu
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Articles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Text-to-Speech' })).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer content
    await expect(page.getByText('TYE All-in-One')).toBeVisible();
    await expect(page.getByText('A comprehensive web application')).toBeVisible();
    await expect(page.getByText('Made with')).toBeVisible();
  });
});
