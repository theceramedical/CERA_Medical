import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Unmounts every rendered tree between tests.
 *
 * Testing Library renders into a container attached to `document.body` and does not remove it
 * on its own when `globals` is off, so without this each test sees the DOM left by the ones
 * before it. The symptom is specific and confusing: `getByRole('heading')` starts throwing
 * "found multiple elements" in a test that renders exactly one heading, and which test fails
 * depends on the order they ran in.
 */
afterEach(() => {
  cleanup();
});
