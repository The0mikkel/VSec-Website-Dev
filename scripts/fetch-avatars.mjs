/**
 * Downloads GitHub avatars for all members at build time so they're served
 * locally, avoiding any external image blocking on the live domain.
 */
import fs from 'fs';
import path from 'path';
import { readdir, readFile, mkdir } from 'fs/promises';

const MEMBERS_DIR = 'src/content/members';
const AVATARS_DIR = 'public/images/avatars';

await mkdir(AVATARS_DIR, { recursive: true });

const files = await readdir(MEMBERS_DIR);

const githubUsers = [];
for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const content = await readFile(path.join(MEMBERS_DIR, file), 'utf8');
  const match = content.match(/^github:\s*["']?([^\s"']+)["']?/m);
  if (match) githubUsers.push(match[1].trim());
}

console.log(`Fetching ${githubUsers.length} GitHub avatars...`);

for (const username of githubUsers) {
  const filePath = path.join(AVATARS_DIR, `${username}.png`);
  if (fs.existsSync(filePath)) {
    console.log(`  skip  ${username} (cached)`);
    continue;
  }
  try {
    const res = await fetch(`https://github.com/${username}.png?size=200`, {
      headers: { 'User-Agent': 'VSec-Website-Build' },
    });
    if (!res.ok) { console.log(`  fail  ${username} (${res.status})`); continue; }
    const buf = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buf));
    console.log(`  ok    ${username}`);
  } catch (e) {
    console.log(`  error ${username}: ${e.message}`);
  }
}

console.log('Avatar fetch complete.');
