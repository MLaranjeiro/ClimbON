export const BETA_VIDEO_BUCKET = 'beta-videos';

const PUBLIC_PREFIX = `/storage/v1/object/public/${BETA_VIDEO_BUCKET}/`;

// Beta rows store the video's public URL; deleting the file from storage needs the
// object path inside the bucket ("<user id>/<file>.mp4"). Returns null for anything
// that isn't one of our uploaded beta videos (e.g. an external link), so callers
// never try to delete something outside the bucket.
export function betaVideoPathFromUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  let pathname: string;
  try {
    pathname = new URL(videoUrl).pathname;
  } catch {
    return null;
  }
  if (!pathname.startsWith(PUBLIC_PREFIX)) return null;
  const path = decodeURIComponent(pathname.slice(PUBLIC_PREFIX.length));
  if (!path || path.split('/').some((part) => part === '' || part === '..')) return null;
  return path;
}
