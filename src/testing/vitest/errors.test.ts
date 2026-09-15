import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../../lib/errors';

describe('getErrorMessage', () => {
  it('maps a known Postgres error code to its friendly message', () => {
    expect(getErrorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "profiles_username_key"' }))
      .toBe('That value is already in use.');
  });

  it('maps a permission-denied code to its friendly message', () => {
    expect(getErrorMessage({ code: '42501', message: 'permission denied for table profiles' }))
      .toBe('You don’t have permission to do that.');
  });

  it('passes through a short message when the code is unrecognized', () => {
    expect(getErrorMessage({ message: 'Invalid login credentials' })).toBe('Invalid login credentials');
  });

  it('falls back to the generic message for a long message (possible internal detail leak)', () => {
    const longMessage = 'x'.repeat(250);
    expect(getErrorMessage({ message: longMessage })).toBe('Something went wrong. Please try again.');
  });

  it('falls back to the generic message when there is no message or code', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.');
  });

  it('falls back to the generic message for a non-object error', () => {
    expect(getErrorMessage('raw string thrown')).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });

  it('honors a custom fallback message', () => {
    expect(getErrorMessage({}, 'Custom fallback')).toBe('Custom fallback');
  });
});
