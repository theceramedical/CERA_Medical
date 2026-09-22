import { describe, expect, it } from 'vitest';

import {
  isSafeRequestId,
  outboxTraceContext,
  REQUEST_ID_HEADER,
  requestIdFromHeaders,
  resolveRequestId,
} from './request-id.ts';

describe('isSafeRequestId', () => {
  it.each([
    ['a UUID', '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f'],
    ['a W3C trace id', '4bf92f3577b34da6a3ce929d0e0e4736'],
    ['an underscore-separated id', 'req_abcdef123456'],
  ])('accepts %s', (_label, value) => {
    expect(isSafeRequestId(value)).toBe(true);
  });

  it.each([
    ['a newline, which would forge a second log entry', 'req-1234567890\n{"level":"info"}'],
    ['a carriage return', 'req-1234567890\r\nfake'],
    ['a JSON fragment', '{"requestId":"x"}'],
    ['an ANSI escape', 'req-123456789\u001b[31m'],
    ['a value too short to correlate', 'abc'],
    ['a value long enough to inflate every line', 'a'.repeat(200)],
    ['an empty string', ''],
    ['a space', 'req 1234567890'],
    ['a semicolon, for a header-splitting attempt', 'req-123456789;x=1'],
  ])('rejects %s', (_label, value) => {
    expect(isSafeRequestId(value)).toBe(false);
  });

  it.each([[undefined], [null], [42], [{}], [[]]])('rejects the non-string %s', (value) => {
    expect(isSafeRequestId(value)).toBe(false);
  });
});

describe('resolveRequestId', () => {
  it('keeps a safe inbound id, so correlation survives the proxy hop', () => {
    expect(resolveRequestId('0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f')).toBe(
      '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f',
    );
  });

  it('generates one when the inbound value is unsafe', () => {
    const generated = resolveRequestId('bad\nvalue');

    expect(isSafeRequestId(generated)).toBe(true);
    expect(generated).not.toContain('\n');
  });

  it('generates one when there is no inbound value', () => {
    expect(isSafeRequestId(resolveRequestId(undefined))).toBe(true);
  });

  it('generates a distinct id each time', () => {
    const ids = new Set(Array.from({ length: 100 }, () => resolveRequestId(undefined)));

    expect(ids.size).toBe(100);
  });
});

describe('requestIdFromHeaders', () => {
  it('reads the documented header', () => {
    expect(requestIdFromHeaders({ [REQUEST_ID_HEADER]: 'req-abcdef123456' })).toBe(
      'req-abcdef123456',
    );
  });

  it('takes the first value when a proxy chain duplicated the header', () => {
    // Preferring the last would let a client override what the proxy assigned.
    expect(
      requestIdFromHeaders({ [REQUEST_ID_HEADER]: ['req-from-proxy-1', 'req-from-client'] }),
    ).toBe('req-from-proxy-1');
  });

  it('generates one when the header is absent', () => {
    expect(isSafeRequestId(requestIdFromHeaders({}))).toBe(true);
  });

  it('generates one when the header is present but hostile', () => {
    const resolved = requestIdFromHeaders({ [REQUEST_ID_HEADER]: 'x\n{"level":"error"}' });

    expect(resolved).not.toContain('\n');
    expect(isSafeRequestId(resolved)).toBe(true);
  });
});

describe('outboxTraceContext', () => {
  it('carries only the request id into the worker', () => {
    // Deliberately minimal. The worker re-reads current state, so anything else
    // here would be a stale copy of personal data in a second table.
    expect(outboxTraceContext({ requestId: 'req-1', subjectId: 'subject-1', route: '/x' })).toEqual(
      {
        requestId: 'req-1',
      },
    );
  });
});
