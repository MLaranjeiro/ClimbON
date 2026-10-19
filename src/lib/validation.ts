export interface PasswordCheck {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');

  return { valid: errors.length === 0, errors };
}

// Builds one message for every empty field, e.g. "Email and password are required."
// Used instead of the browser's native "Please fill out this field" popups so all form
// errors show in the same on-page alert.
export function missingFieldsMessage(fields: Record<string, string>): string | null {
  const missing = Object.entries(fields)
    .filter(([, value]) => value.trim() === '')
    .map(([label]) => label);
  if (missing.length === 0) return null;

  const names = missing.map((label, i) => (i === 0 ? label : label.toLowerCase()));
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
  return `${list} ${missing.length === 1 ? 'is' : 'are'} required.`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
