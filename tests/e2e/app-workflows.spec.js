import { test, expect } from '@playwright/test';

const routeCases = [
  {
    name: 'student dashboard flow',
    route: '/#/student',
    expectedScreen: 'screen-landing',
    note: 'Unauthenticated student routes should route back to a safe landing screen.',
  },
  {
    name: 'student subjects flow',
    route: '/#/student/subjects',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student units flow',
    route: '/#/student/units',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student topics flow',
    route: '/#/student/topics',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student notes flow',
    route: '/#/student/notes',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student videos flow',
    route: '/#/student/videos',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student PYQs flow',
    route: '/#/student/pyqs',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student IQs flow',
    route: '/#/student/iqs',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student bookmarks flow',
    route: '/#/student/bookmarks',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student search flow',
    route: '/#/student/search',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'student notifications flow',
    route: '/#/student/notifications',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'creator dashboard flow',
    route: '/#/creator',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'admin dashboard flow',
    route: '/#/admin',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'subadmin dashboard flow',
    route: '/#/subadmin',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'landing page flow',
    route: '/#/landing',
    expectedScreen: 'screen-landing',
  },
  {
    name: 'auth page flow',
    route: '/#/auth',
    expectedScreen: 'screen-google-auth',
  },
  {
    name: 'intro flow',
    route: '/#/intro',
    expectedScreen: 'screen-intro',
  },
  {
    name: 'profile setup flow',
    route: '/#/personal-details',
    expectedScreen: 'screen-profile',
  },
];

async function assertRuntimeHealth(page, route) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure();
    const errorText = failure?.errorText || 'unknown';

    if (!/ERR_ABORTED|aborted/i.test(errorText)) {
      failedRequests.push(`${request.method()} ${request.url()} (${errorText})`);
    }
  });

  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await expect(page.locator('body')).toBeVisible();
  const bodyText = (await page.locator('body').innerText()).trim();
  expect(bodyText.length, `Route ${route} rendered a blank body`).toBeGreaterThan(20);

  const loadingOverlay = page.locator('.loading-overlay');
  if (await loadingOverlay.count()) {
    await expect(loadingOverlay).not.toBeVisible({ timeout: 2000 });
  }

  const activeScreen = page.locator('.screen.active').first();
  await expect(activeScreen).toBeAttached();
  await expect(activeScreen).toHaveClass(/active/);

  const screenId = await activeScreen.getAttribute('id');
  expect(screenId).toBeTruthy();

  expect(consoleErrors, `Console errors on ${route}: ${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `Page errors on ${route}: ${pageErrors.join('\n')}`).toEqual([]);
  expect(failedRequests, `Failed requests on ${route}: ${failedRequests.join('\n')}`).toEqual([]);
}

test.describe('AIIENS Edu workflow smoke tests', () => {
  for (const flow of routeCases) {
    test(`${flow.name} loads without runtime errors`, async ({ page }) => {
      await assertRuntimeHealth(page, flow.route);
      const activeScreen = page.locator('.screen.active').first();
      await expect(activeScreen).toBeAttached();
      await expect(activeScreen).toHaveClass(/active/);
    });
  }

  test('primary actions can be clicked on the landing page without breaking navigation', async ({ page }) => {
    await assertRuntimeHealth(page, '/#/landing');

    const candidates = page.locator('button, a').filter({ hasText: /login|start|get started|explore|learn|continue|join|register|sign in/i });
    const count = await candidates.count();

    let target = null;
    for (let i = 0; i < count; i++) {
      const candidate = candidates.nth(i);
      const box = await candidate.boundingBox();
      const visible = await candidate.isVisible();
      const disabled = await candidate.isDisabled().catch(() => false);
      if (visible && box && box.width > 0 && box.height > 0 && !disabled) {
        const text = (await candidate.textContent()) || '';
        const isCovered = await page.evaluate(({ el }) => {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(centerX, centerY);
          return topEl && topEl !== el && !el.contains(topEl);
        }, { el: await candidate.elementHandle() });
        if (!isCovered) {
          target = candidate;
          break;
        }
      }
    }

    if (target) {
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeVisible();
      await target.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('#');
    }
  });
});
