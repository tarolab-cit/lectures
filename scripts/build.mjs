import { readdir, readFile, mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const output = path.join(root, '_site');
const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = (s) => s.split('/').map(encodeURIComponent).join('/');
const page = (title, body) => `<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:54rem;margin:3rem auto;padding:0 1.5rem;line-height:1.8}a{color:#165cab}li{margin:.6rem 0}</style>
<body><h1>${escape(title)}</h1>${body}</body></html>\n`;

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const courses = [];
// A course is a top-level directory containing lectureNN.md files.
for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory() || entry.name.startsWith('.') || ['node_modules', '_site', 'scripts'].includes(entry.name)) continue;
  const files = await readdir(entry.name);
  const lectures = files.filter((f) => /^lecture\d+\.md$/.test(f)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  if (!lectures.length) continue;
  const courseOut = path.join(output, entry.name);
  await mkdir(courseOut, { recursive: true });
  // Course display name: first "# " heading of the course README, else the directory name.
  const readme = files.includes('README.md') ? await readFile(path.join(entry.name, 'README.md'), 'utf8') : '';
  const courseTitle = readme.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? entry.name;
  // Preserve relative paths such as figs/terminal.png.
  for (const assets of ['figs', 'images', 'theme']) {
    if (files.includes(assets)) await cp(path.join(entry.name, assets), path.join(courseOut, assets), {
      recursive: true,
      filter: (source) => !path.basename(source).startsWith('.'),
    });
  }
  const links = [];
  for (const filename of lectures) {
    const source = path.join(entry.name, filename);
    const markdown = await readFile(source, 'utf8');
    if (!/^marp:\s*true\s*$/m.test(markdown)) throw new Error(`Missing marp: true: ${source}`);
    const htmlName = filename.replace(/\.md$/, '.html');
    const result = spawnSync(process.execPath, ['node_modules/@marp-team/marp-cli/marp-cli.js', source, '--html', '--bespoke.osc=false', '-o', path.join(courseOut, htmlName)], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Marp failed: ${source}`);
    const title = markdown.match(/^##\s+(.+)$/m)?.[1] ?? filename;
    links.push(`<li><a href="${url(htmlName)}">${escape(title)}</a></li>`);
  }
  await writeFile(path.join(courseOut, 'index.html'), page(courseTitle, `<ul>${links.join('')}</ul><p><a href="../">講義一覧へ</a></p>`));
  courses.push(`<li><a href="${url(entry.name)}/">${escape(courseTitle)}</a></li>`);
}
if (!courses.length) throw new Error('No lectureNN.md files found');
await writeFile(path.join(output, 'index.html'), page('講義資料', `<ul>${courses.join('')}</ul>`));
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built ${courses.length} course(s) in _site/`);
