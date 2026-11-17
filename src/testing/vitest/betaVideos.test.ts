import { describe, expect, it } from 'vitest';
import { betaVideoPathFromUrl } from '../../lib/betaVideos';

const BASE = 'https://example.supabase.co/storage/v1/object/public/beta-videos';

describe('betaVideoPathFromUrl', () => {
  it('extracts the storage path from an uploaded beta video URL', () => {
    expect(betaVideoPathFromUrl(`${BASE}/user-123/clip.mp4`)).toBe('user-123/clip.mp4');
  });

  it('decodes URL-encoded characters in the file name', () => {
    expect(betaVideoPathFromUrl(`${BASE}/user-123/my%20clip.mp4`)).toBe('user-123/my clip.mp4');
  });

  it('returns null for a beta with no video', () => {
    expect(betaVideoPathFromUrl(null)).toBeNull();
    expect(betaVideoPathFromUrl('')).toBeNull();
  });

  it('returns null for a link outside the beta-videos bucket', () => {
    expect(betaVideoPathFromUrl('https://youtube.com/watch?v=abc')).toBeNull();
    expect(betaVideoPathFromUrl('https://example.supabase.co/storage/v1/object/public/gym-maps/map.png')).toBeNull();
  });

  it('returns null for a malformed URL', () => {
    expect(betaVideoPathFromUrl('not a url')).toBeNull();
  });

  it('rejects paths that try to climb out of the bucket', () => {
    // The URL parser resolves "../" itself, landing outside the bucket prefix.
    expect(betaVideoPathFromUrl(`${BASE}/../gym-maps/map.png`)).toBeNull();
    // Encoded slashes survive URL parsing and only become "../" after decoding.
    expect(betaVideoPathFromUrl(`${BASE}/user-123%2F..%2F..%2Fgym-maps%2Fmap.png`)).toBeNull();
    expect(betaVideoPathFromUrl(`${BASE}/`)).toBeNull();
  });
});
