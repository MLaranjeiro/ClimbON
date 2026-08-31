import { supabase } from './supabase';

// Postgres error codes that are safe (and useful) to translate for end users.
// Anything not listed here falls back to a generic message instead of leaking
// raw constraint names / SQL text.
const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'That value is already in use.',
  '23503': 'This action isn’t allowed because related data still depends on it.',
  '23502': 'A required field is missing.',
  '23514': 'That value isn’t allowed.',
  '42501': 'You don’t have permission to do that.',
};

interface ErrorLike {
  message?: string;
  code?: string;
}

function asErrorLike(error: unknown): ErrorLike | null {
  if (error && typeof error === 'object') return error as ErrorLike;
  return null;
}

// Postgrest/storage/auth errors already carry a reasonably safe, short message
// (that's what Supabase clients are designed to surface). Only Postgres error
// codes risk leaking internal detail, so those get mapped to friendly text;
// everything else passes through with a length cap as a sanity check.
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = asErrorLike(error);
  if (err?.code && KNOWN_ERROR_MESSAGES[err.code]) return KNOWN_ERROR_MESSAGES[err.code];
  if (typeof err?.message === 'string' && err.message.length > 0 && err.message.length < 200) return err.message;
  return fallback;
}

// Silently records that the system hit an error, for admins to review later.
// Never throws and never blocks the caller — logging failure shouldn't take
// down the feature that triggered it.
export function logError(context: string, error: unknown, details?: Record<string, unknown>) {
  const err = asErrorLike(error);
  console.error(`[${context}]`, error);

  void supabase
    .from('error_logs')
    .insert({
      context,
      message: err?.message ?? String(error),
      code: err?.code ?? null,
      details: details ?? null,
    })
    .then(({ error: insertError }) => {
      if (insertError) console.error('[logError] failed to persist error log', insertError);
    });
}
