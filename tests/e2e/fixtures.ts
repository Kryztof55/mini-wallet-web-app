import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

type Fixtures = {
  /** Restores seed data before every test (auto). */
  resetMocks: void;
  /** Adds `x-mock-outcome` only to requests matching `urlGlob` (test plan §3). */
  forceOutcome: (urlGlob: string, outcome: string) => Promise<void>;
  /** axe-core scan against WCAG 2.x A/AA tags, in the project's color scheme. */
  expectNoA11yViolations: (page?: Page) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  resetMocks: [
    async ({ request, baseURL }, use) => {
      // Available from TASK-06; until then the endpoint answers 404 and is ignored.
      await request.post('/api/mock/reset', {
        headers: {
          origin: baseURL ?? '',
          'content-type': 'application/json',
          'x-request-id': crypto.randomUUID(),
        },
        data: {},
        failOnStatusCode: false,
      });
      await use();
    },
    { auto: true },
  ],

  forceOutcome: async ({ page }, use) => {
    await use(async (urlGlob, outcome) => {
      await page.route(urlGlob, async (route) => {
        await route.continue({
          headers: { ...route.request().headers(), 'x-mock-outcome': outcome },
        });
      });
    });
  },

  expectNoA11yViolations: async ({ page }, use) => {
    await use(async (target = page) => {
      const results = await new AxeBuilder({ page: target })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  },
});

export { expect };
