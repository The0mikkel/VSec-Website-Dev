import manifest from '../data/logo-manifest.json';

const logoMap = manifest as Record<string, string>;

export function resolveLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return url; // already a local path
  return logoMap[url] ?? url;
}
