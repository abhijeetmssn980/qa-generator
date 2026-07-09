// Resolve a product asset URL (image / leaflet) for use in the browser.
// The value from the API is either an absolute S3 URL (when S3 is configured) or a
// relative /api/... path (Postgres fallback). Absolute URLs are used as-is;
// relative ones get the API origin prefixed. `small` appends the server-side
// ?quality=50 downscale, which only applies to the relative (server-served) path.
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

export function assetUrl(url?: string | null, opts?: { small?: boolean }): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url; // absolute (S3 / external) — already sized
  const abs = `${API_ORIGIN}${url}`;
  return opts?.small ? `${abs}?quality=50` : abs;
}
