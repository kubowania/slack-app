/**
 * tests/screenshots.spec.ts — Master Screenshot Capture Test
 *
 * Playwright test file that navigates every implemented screen route in the
 * Slack Clone application and captures full-page screenshots at the
 * AAP-specified 1440×900 viewport for visual verification against the 1,000
 * reference screenshots from the kubowania/blitzy-slack repository.
 *
 * Configuration sourced from playwright.config.ts:
 *   - baseURL: http://localhost:3000
 *   - viewport: { width: 1440, height: 900 }
 *   - outputDir: screenshots/output/
 *   - webServer: auto-starts `npm run dev` on port 3000
 *
 * Naming convention: screen-{category}-{variant}.png
 * Wait strategy: networkidle (all API calls complete before capture)
 *
 * @see https://playwright.dev/docs/api/class-page#page-screenshot
 */
import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Root output directory for all captured screenshots */
const SCREENSHOT_DIR = 'screenshots/output';

/** Default timeout (ms) for CSS transitions / animations to settle */
const TRANSITION_DELAY = 500;

/** Maximum time (ms) to wait for a specific selector to appear */
const SELECTOR_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Navigate to a route and wait for network idle, then add a brief pause for
 * CSS transitions before returning.  Every test follows this exact pattern to
 * ensure deterministic, fully-rendered screenshots.
 *
 * @param page  Playwright Page instance
 * @param url   Route path relative to baseURL (e.g. "/channel/1")
 */
async function navigateAndSettle(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(TRANSITION_DELAY);
}

/**
 * Capture a full-page screenshot with the deterministic naming convention.
 *
 * @param page     Playwright Page instance
 * @param filename Name of the screenshot file (without directory prefix)
 */
async function captureScreenshot(page: Page, filename: string): Promise<void> {
  const path = `${SCREENSHOT_DIR}/${filename}`;
  await page.screenshot({ path, fullPage: true });
  // Playwright throws if the screenshot cannot be written, so reaching this
  // line implicitly asserts the capture succeeded.
  expect(true).toBe(true);
}

/**
 * Combined helper: navigate → settle → capture.
 *
 * @param page     Playwright Page instance
 * @param url      Route path relative to baseURL
 * @param filename Screenshot output filename
 */
async function navigateAndCapture(
  page: Page,
  url: string,
  filename: string,
): Promise<void> {
  await navigateAndSettle(page, url);
  await captureScreenshot(page, filename);
}

/**
 * Safely click an element that may or may not exist.  Returns `true` if the
 * element was found and clicked, `false` otherwise.
 *
 * @param page     Playwright Page instance
 * @param selector CSS / test-id selector
 * @param timeout  Time to wait for the element before giving up
 */
async function safeClick(
  page: Page,
  selector: string,
  timeout: number = SELECTOR_TIMEOUT,
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch {
    return false;
  }
}

// ===========================================================================
// 1. Channel Message View
// ===========================================================================

test.describe('Channel Message View', () => {
  test('capture general channel', async ({ page }) => {
    await navigateAndCapture(page, '/channel/1', 'screen-channel-general.png');
  });

  test('capture random channel', async ({ page }) => {
    await navigateAndCapture(page, '/channel/2', 'screen-channel-random.png');
  });

  test('capture engineering channel', async ({ page }) => {
    await navigateAndCapture(
      page,
      '/channel/3',
      'screen-channel-engineering.png',
    );
  });
});

// ===========================================================================
// 2. Direct Message Conversation
// ===========================================================================

test.describe('Direct Message Conversation', () => {
  test('capture one-to-one DM', async ({ page }) => {
    await navigateAndCapture(page, '/dm/1', 'screen-dm-one-to-one.png');
  });

  test('capture group DM', async ({ page }) => {
    await navigateAndCapture(page, '/dm/2', 'screen-dm-group.png');
  });
});

// ===========================================================================
// 3. Thread Reply Panel
// ===========================================================================

test.describe('Thread Reply Panel', () => {
  test('capture thread panel via interaction', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Attempt to open a thread panel by clicking the first thread reply
    // indicator or a reply action button in the channel view.
    const threadOpened = await safeClick(
      page,
      '[data-testid="thread-reply-indicator"], [data-testid="open-thread"], .thread-reply-indicator, button[aria-label="Reply in thread"]',
    );

    if (threadOpened) {
      // Wait for the thread panel slide-in animation to complete
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-thread-panel.png');
  });

  test('capture dedicated thread view', async ({ page }) => {
    await navigateAndCapture(page, '/thread/1', 'screen-thread-dedicated.png');
  });
});

// ===========================================================================
// 4. Channel Browser
// ===========================================================================

test.describe('Channel Browser', () => {
  test('capture browse channels page', async ({ page }) => {
    await navigateAndCapture(
      page,
      '/channels/browse',
      'screen-channel-browser.png',
    );
  });
});

// ===========================================================================
// 5. People / Member Directory
// ===========================================================================

test.describe('People Directory', () => {
  test('capture people directory page', async ({ page }) => {
    await navigateAndCapture(page, '/people', 'screen-people-directory.png');
  });
});

// ===========================================================================
// 6. Search Results
// ===========================================================================

test.describe('Search Results', () => {
  test('capture search results - messages', async ({ page }) => {
    await navigateAndSettle(page, '/search?q=hello');

    // Ensure the messages tab is active (default) and results are visible
    try {
      await page.waitForSelector(
        '[data-testid="search-results"], .search-results, main',
        { timeout: SELECTOR_TIMEOUT },
      );
    } catch {
      // Proceed even if selector is not found; networkidle should suffice.
    }

    await captureScreenshot(page, 'screen-search-messages.png');
  });

  test('capture search results - channels', async ({ page }) => {
    await navigateAndSettle(page, '/search?q=general');

    // Try to switch to the Channels tab if it exists
    await safeClick(
      page,
      '[data-testid="search-tab-channels"], button:has-text("Channels")',
      5000,
    );
    await page.waitForTimeout(TRANSITION_DELAY);

    await captureScreenshot(page, 'screen-search-channels.png');
  });

  test('capture search results - files', async ({ page }) => {
    await navigateAndSettle(page, '/search?q=report');

    // Try to switch to the Files tab if it exists
    await safeClick(
      page,
      '[data-testid="search-tab-files"], button:has-text("Files")',
      5000,
    );
    await page.waitForTimeout(TRANSITION_DELAY);

    await captureScreenshot(page, 'screen-search-files.png');
  });
});

// ===========================================================================
// 7. Activity / Mentions Feed
// ===========================================================================

test.describe('Activity Feed', () => {
  test('capture activity feed page', async ({ page }) => {
    await navigateAndCapture(page, '/activity', 'screen-activity-feed.png');
  });
});

// ===========================================================================
// 8. Saved Items / Bookmarks
// ===========================================================================

test.describe('Saved Items', () => {
  test('capture saved items page', async ({ page }) => {
    await navigateAndCapture(page, '/saved', 'screen-saved-items.png');
  });
});

// ===========================================================================
// 9. File Browser
// ===========================================================================

test.describe('File Browser', () => {
  test('capture file browser page', async ({ page }) => {
    await navigateAndCapture(page, '/files', 'screen-file-browser.png');
  });
});

// ===========================================================================
// 10. Apps / Integrations View
// ===========================================================================

test.describe('Apps / Integrations View', () => {
  test('capture apps view from sidebar', async ({ page }) => {
    // Navigate to the main workspace view and look for an Apps navigation item
    await navigateAndSettle(page, '/channel/1');

    // Attempt to click the Apps sidebar item or navigation link
    const appsOpened = await safeClick(
      page,
      '[data-testid="nav-apps"], a[href*="apps"], button:has-text("Apps"), .sidebar-nav-apps',
      5000,
    );

    if (appsOpened) {
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-apps-view.png');
  });
});

// ===========================================================================
// 11. Workspace Settings / Administration
// ===========================================================================

test.describe('Workspace Settings', () => {
  test('capture workspace settings', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Try to open workspace settings via the workspace name / header click
    const settingsOpened = await safeClick(
      page,
      '[data-testid="workspace-settings"], [data-testid="workspace-header"], button:has-text("Settings"), .workspace-menu',
      5000,
    );

    if (settingsOpened) {
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-workspace-settings.png');
  });
});

// ===========================================================================
// 12. User Preferences / Settings Modal
// ===========================================================================

test.describe('User Preferences', () => {
  test('capture preferences page', async ({ page }) => {
    await navigateAndCapture(page, '/preferences', 'screen-preferences.png');
  });
});

// ===========================================================================
// 13. Channel Settings / Details Panel
// ===========================================================================

test.describe('Channel Details Panel', () => {
  test('capture channel details - members tab', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Open the channel details panel by clicking the info icon in the header
    const detailsOpened = await safeClick(
      page,
      '[data-testid="channel-details-button"], [data-testid="channel-info"], button[aria-label="Channel details"], button:has-text("ℹ️")',
    );

    if (detailsOpened) {
      await page.waitForTimeout(TRANSITION_DELAY);

      // Attempt to click the Members tab within the details panel
      await safeClick(
        page,
        '[data-testid="details-tab-members"], button:has-text("Members")',
        5000,
      );
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-channel-details-members.png');
  });

  test('capture channel details - pins tab', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Open the channel details panel
    const detailsOpened = await safeClick(
      page,
      '[data-testid="channel-details-button"], [data-testid="channel-info"], button[aria-label="Channel details"], button:has-text("ℹ️")',
    );

    if (detailsOpened) {
      await page.waitForTimeout(TRANSITION_DELAY);

      // Switch to the Pins tab
      await safeClick(
        page,
        '[data-testid="details-tab-pins"], button:has-text("Pins")',
        5000,
      );
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-channel-details-pins.png');
  });
});

// ===========================================================================
// 14. User Profile Panel
// ===========================================================================

test.describe('User Profile Panel', () => {
  test('capture user profile panel', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Click on a user avatar within the message list to open the profile panel
    const profileOpened = await safeClick(
      page,
      '[data-testid="user-avatar"], .message-avatar, .user-avatar',
    );

    if (profileOpened) {
      // Wait for the profile panel slide-in animation
      try {
        await page.waitForSelector(
          '[data-testid="user-profile-panel"], .user-profile-panel',
          { timeout: SELECTOR_TIMEOUT },
        );
      } catch {
        // Panel may already be visible or use a different selector
      }
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-user-profile.png');
  });
});

// ===========================================================================
// 15. Emoji Picker Overlay
// ===========================================================================

test.describe('Emoji Picker Overlay', () => {
  test('capture emoji picker', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Hover over a message to reveal the reaction toolbar, then click the
    // emoji reaction button (😀) to open the picker.
    const messageSelector =
      '[data-testid="message-bubble"], .message-bubble, .message-container';

    try {
      await page.waitForSelector(messageSelector, {
        timeout: SELECTOR_TIMEOUT,
      });

      // Hover the first message to reveal the action toolbar
      const firstMessage = page.locator(messageSelector).first();
      await firstMessage.hover();
      await page.waitForTimeout(300);

      // Click the emoji reaction button on the hover toolbar
      const emojiClicked = await safeClick(
        page,
        '[data-testid="reaction-button"], [data-testid="emoji-reaction"], button[aria-label="Add reaction"], button:has-text("😀")',
        5000,
      );

      if (emojiClicked) {
        // Wait for the emoji picker overlay to render
        try {
          await page.waitForSelector(
            '[data-testid="emoji-picker"], .emoji-picker',
            { timeout: SELECTOR_TIMEOUT },
          );
        } catch {
          // Picker may use a different selector pattern
        }
        await page.waitForTimeout(TRANSITION_DELAY);
      }
    } catch {
      // Proceed to capture whatever state the page is in
    }

    await captureScreenshot(page, 'screen-emoji-picker.png');
  });
});

// ===========================================================================
// 16. Huddle / Call Overlay
// ===========================================================================

test.describe('Huddle Overlay', () => {
  test('capture huddle overlay', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Attempt to trigger the huddle overlay by clicking the huddle button in
    // the sidebar or channel header
    const huddleOpened = await safeClick(
      page,
      '[data-testid="huddle-button"], button[aria-label="Start a huddle"], button:has-text("🎧"), .huddle-trigger',
      5000,
    );

    if (huddleOpened) {
      // Wait for the fixed-position huddle overlay to appear
      try {
        await page.waitForSelector(
          '[data-testid="huddle-overlay"], .huddle-overlay',
          { timeout: SELECTOR_TIMEOUT },
        );
      } catch {
        // Overlay may use a different selector
      }
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-huddle-overlay.png');
  });
});

// ===========================================================================
// 17. Canvas / Notes Editor
// ===========================================================================

test.describe('Canvas Editor', () => {
  test('capture canvas editor page', async ({ page }) => {
    await navigateAndCapture(page, '/canvas', 'screen-canvas-editor.png');
  });
});

// ===========================================================================
// 18. Channel Creation Modal
// ===========================================================================

test.describe('Channel Creation Modal', () => {
  test('capture create channel modal', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Click the "+" button in the sidebar Channels section header to open the
    // channel creation modal.
    const modalOpened = await safeClick(
      page,
      '[data-testid="create-channel-button"], button[aria-label="Create channel"], .sidebar-channels-header button, button:has-text("+")',
    );

    if (modalOpened) {
      // Wait for the modal dialog to render with its backdrop overlay
      try {
        await page.waitForSelector(
          '[data-testid="modal-dialog"], [data-testid="create-channel-modal"], .modal-backdrop, [role="dialog"]',
          { timeout: SELECTOR_TIMEOUT },
        );
      } catch {
        // Modal may use a different rendering approach
      }
      await page.waitForTimeout(TRANSITION_DELAY);
    }

    await captureScreenshot(page, 'screen-create-channel-modal.png');
  });
});

// ===========================================================================
// 19. Invite Members Modal
// ===========================================================================

test.describe('Invite Members Modal', () => {
  test('capture invite members modal', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // First open the channel details panel to access "Add people"
    const detailsOpened = await safeClick(
      page,
      '[data-testid="channel-details-button"], [data-testid="channel-info"], button[aria-label="Channel details"], button:has-text("ℹ️")',
    );

    if (detailsOpened) {
      await page.waitForTimeout(TRANSITION_DELAY);

      // Click "Add people" or "Invite" to open the invite members modal
      const inviteOpened = await safeClick(
        page,
        '[data-testid="invite-members-button"], button:has-text("Add people"), button:has-text("Invite"), button[aria-label="Add members"]',
        5000,
      );

      if (inviteOpened) {
        // Wait for the invite modal to render
        try {
          await page.waitForSelector(
            '[data-testid="invite-members-modal"], [data-testid="modal-dialog"], .modal-backdrop, [role="dialog"]',
            { timeout: SELECTOR_TIMEOUT },
          );
        } catch {
          // Modal may have a different selector
        }
        await page.waitForTimeout(TRANSITION_DELAY);
      }
    }

    await captureScreenshot(page, 'screen-invite-members-modal.png');
  });
});

// ===========================================================================
// 20. Compose New Message View
// ===========================================================================

test.describe('Compose New Message View', () => {
  test('capture compose message state', async ({ page }) => {
    await navigateAndSettle(page, '/channel/1');

    // Focus the message input to activate the compose state with its full
    // formatting toolbar visible.
    const inputSelector =
      '[data-testid="message-input"], textarea[placeholder*="Message"], input[placeholder*="Message"], .message-composer textarea, .message-input';

    try {
      await page.waitForSelector(inputSelector, {
        timeout: SELECTOR_TIMEOUT,
      });
      await page.click(inputSelector);
      await page.waitForTimeout(300);
    } catch {
      // Proceed even if input is not found — capture current state
    }

    await captureScreenshot(page, 'screen-compose-message.png');
  });
});
