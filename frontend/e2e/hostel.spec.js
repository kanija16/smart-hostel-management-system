import { test, expect } from '@playwright/test';

test.describe('Smart Hostel Management System - E2E User Journey', () => {
  test('Login page loads and displays role tabs and demo accounts', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Smart Hostel Management System/i);
    await expect(page.locator('text=Smart Hostel Portal')).toBeVisible();
    await expect(page.locator('button:has-text("Student")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Warden")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Admin")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Instant 1-Click")')).toBeVisible();
  });

  test('Student can login via demo preset and view resident dashboard', async ({ page }) => {
    await page.goto('/');
    // Click Student tab or 1-click student login
    await page.click('button:has-text("Student"):visible');
    await page.click('button:has-text("Instant 1-Click Student Login")');

    // Verify student dashboard loaded
    await expect(page.locator('text=Welcome, Alex Johnson!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Allocated Room')).toBeVisible();
    await expect(page.locator('text=Total Complaints Submitted')).toBeVisible();
  });

  test('Warden can login directly via Warden tab and inspect complaints triage dashboard', async ({ page }) => {
    await page.goto('/');
    // Select Warden Tab
    await page.click('button:has-text("Warden"):visible');
    await expect(page.locator('text=Hostel Warden Portal')).toBeVisible();
    
    // Click Instant 1-Click Warden Login
    await page.click('button:has-text("Instant 1-Click Warden Login")');

    // Verify warden dashboard
    await expect(page.locator('text=Warden Complaints Triage Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Critical / Urgent Hazards')).toBeVisible();
    await expect(page.locator('text=Priority Sorted')).toBeVisible();
  });

  test('Admin can login and inspect administration console', async ({ page }) => {
    await page.goto('/');
    // Select Admin tab
    await page.click('button:has-text("Admin"):visible');
    await expect(page.locator('text=Administrator Console')).toBeVisible();

    // Click Instant 1-Click Admin Login
    await page.click('button:has-text("Instant 1-Click Admin Login")');

    // Verify admin console
    await expect(page.locator('text=Hostel Administration Console')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Manage Hostel Rooms')).toBeVisible();
    await expect(page.locator('text=Review Allocation Requests')).toBeVisible();
  });
});
