import { describe, expect, it } from 'vitest';
import { validatePassword } from '../../lib/validation';

describe('validatePassword', () => {
  it('accepts a password meeting all complexity rules', () => {
    const result = validatePassword('Password123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a password under 8 characters', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  it('rejects a password with no uppercase letter', () => {
    const result = validatePassword('password123!');
    expect(result.errors).toContain('One uppercase letter');
  });

  it('rejects a password with no lowercase letter', () => {
    const result = validatePassword('PASSWORD123!');
    expect(result.errors).toContain('One lowercase letter');
  });

  it('rejects a password with no number', () => {
    const result = validatePassword('Password!!!');
    expect(result.errors).toContain('One number');
  });

  it('rejects a password with no special character', () => {
    const result = validatePassword('Password123');
    expect(result.errors).toContain('One special character');
  });

  it('rejects a bare-minimum weak password with every rule violated', () => {
    const result = validatePassword('123');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });

  it('rejects an empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });
});
