import { describe, expect, it } from 'vitest';

import { jsonBodyForApiRequest } from './api-request-body.ts';

describe('jsonBodyForApiRequest', () => {
  it('sends {} for POST without an explicit body', () => {
    expect(jsonBodyForApiRequest('POST', undefined)).toBe('{}');
  });

  it('omits a body for GET', () => {
    expect(jsonBodyForApiRequest('GET', undefined)).toBeUndefined();
  });
});
