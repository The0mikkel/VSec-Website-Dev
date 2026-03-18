/**
 * Downloads all external logos (communities, learning) at build time and
 * writes a URL→local-path manifest. Source files are never modified.
 */
import fs from 'fs';
import path from 'path';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';

const LOGOS_DIR = 'public/images/logos';
const MANIFEST_PATH = 'src/data/logo-manifest.json';

await mkdir(LOGOS_DIR, { recursive: true });

function urlToFilename(url) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname) || '.ico';
    const hostname = u.hostname.replace(/^www\./, '');
    return hostname + ext;
  } catch {
    return null;
  }
}

async function downloadLogo(url) {
  if (!url || url.startsWith('/')) return url; // already local
  const filename = urlToFilename(url);
  if (!filename) return null;

  const filePath = path.join(LOGOS_DIR, filename);
  const localPath = `/images/logos/${filename}`;

  if (fs.existsSync(filePath)) {
    return localPath; // cached
  }

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'VSec-Website-Build' } });
    if (!res.ok) { console.log(`  fail  ${url} (${res.status})`); return null; }
    const buf = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buf));
    console.log(`  ok    ${url}`);
    return localPath;
  } catch (e) {
    console.log(`  error ${url}: ${e.message}`);
    return null;
  }
}

// Reads all .md files in a directory and collects external logo URL→localPath mappings
async function collectLogosFromDir(dir, manifest) {
  let files;
  try { files = await readdir(dir); } catch { return; }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(path.join(dir, file), 'utf8');

    const match = content.match(/^logo:\s*["']?(https?:\/\/[^\s"'\r\n]+)["']?/m);
    if (!match) continue;

    const url = match[1];
    if (manifest[url]) continue; // already resolved

    const localPath = await downloadLogo(url);
    if (localPath && localPath !== url) {
      manifest[url] = localPath;
    }
  }
}

// Load existing manifest so cached entries are preserved across runs
let manifest = {};
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
} catch {
  // first run — start fresh
}

console.log('Fetching community logos...');
await collectLogosFromDir('src/content/communities', manifest);

console.log('Fetching learning logos...');
await collectLogosFromDir('src/content/learning', manifest);

await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Logo fetch complete. ${Object.keys(manifest).length} entries in manifest.`);
