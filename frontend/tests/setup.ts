import '@testing-library/jest-dom/vitest';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

import '../src/i18n';

expect.extend(toHaveNoViolations);

afterEach(() => {
  cleanup();
});
