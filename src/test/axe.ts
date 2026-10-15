import axe from 'axe-core';

/**
 * Runs axe-core against a rendered container (component tests, jsdom).
 * Color contrast is disabled here because jsdom does not compute styles;
 * contrast is verified in E2E against real rendering in both themes (TC-E2E-21).
 */
export async function getA11yViolations(container: Element): Promise<axe.Result[]> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations;
}
