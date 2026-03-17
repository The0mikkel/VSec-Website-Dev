/**
 * Downloads all external logos (communities, learning, about page tech stack)
 * at build time and rewrites the source files to use local paths.
 */
import fs from 'fs';
import path from 'path';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';

const LOGOS_DIR = 'public/images/logos';
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

// Process markdown content files — rewrites logo: field in-place
async function processContentDir(dir) {
  let files;
  try { files = await readdir(dir); } catch { return; }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(dir, file);
    let content = await readFile(filePath, 'utf8');

    const match = content.match(/^logo:\s*["']?(https?:\/\/[^\s"'\r\n]+)["']?/m);
    if (!match) continue;

    const url = match[1];
    const localPath = await downloadLogo(url);
    if (localPath && localPath !== url) {
      content = content.replace(
        /^(logo:\s*)["']?(https?:\/\/[^\s"'\r\n]+)["']?/m,
        `$1${localPath}`
      );
      await writeFile(filePath, content, 'utf8');
    }
  }
}

// Process about.astro — rewrites logo: 'https://...' entries in-place
async function processAboutAstro() {
  const filePath = 'src/pages/about.astro';
  let content = await readFile(filePath, 'utf8');
  let changed = false;

  const logoPattern = /logo:\s*'(https?:\/\/[^']+)'/g;
  const matches = [...content.matchAll(logoPattern)];

  for (const match of matches) {
    const url = match[1];
    const localPath = await downloadLogo(url);
    if (localPath && localPath !== url) {
      content = content.replace(`logo: '${url}'`, `logo: '${localPath}'`);
      changed = true;
    }
  }

  if (changed) await writeFile(filePath, content, 'utf8');
}

console.log('Fetching community logos...');
await processContentDir('src/content/communities');

console.log('Fetching learning logos...');
await processContentDir('src/content/learning');

console.log('Fetching about page logos...');
await processAboutAstro();

console.log('Logo fetch complete.');
