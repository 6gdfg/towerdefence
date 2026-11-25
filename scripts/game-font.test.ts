import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile('src/assets/fonts/manifest.json', 'utf8')) as {
  sourceSha256: string; sourceBytes: number; codepoints: number; totalBytes: number;
  subsets: { file: string; bytes: number; codepoints: number; unicodeRange: string }[];
};

test('WOFF2 subsets retain the original coverage without overlapping or changing the source font', async () => {
  const source = await readFile('cmdysj.ttf');
  assert.equal(source.length, manifest.sourceBytes);
  assert.equal(createHash('sha256').update(source).digest('hex'), manifest.sourceSha256);
  const points = new Set<number>();
  let total = 0;
  for (const subset of manifest.subsets) {
    const data = await readFile(`src/assets/fonts/${subset.file}`);
    assert.equal(data.subarray(0, 4).toString(), 'wOF2');
    assert.equal(data.length, subset.bytes);
    total += data.length;
    let count = 0;
    for (const range of subset.unicodeRange.split(',')) {
      const [start, end = start] = range.slice(2).split('-').map(point => parseInt(point, 16));
      for (let point = start; point <= end; point++) {
        assert.equal(points.has(point), false, `Overlapping code point: ${point.toString(16)}`);
        points.add(point);
        count++;
      }
    }
    assert.equal(count, subset.codepoints);
  }
  assert.equal(points.size, manifest.codepoints);
  assert.equal(total, manifest.totalBytes);
  assert.ok(total < source.length);
  const priorityBytes = manifest.subsets.filter(subset => /game-(latin|ui)\.woff2/.test(subset.file))
    .reduce((sum, subset) => sum + subset.bytes, 0);
  assert.ok(priorityBytes < 150_000);
});

test('global controls and intro share one font without blocking the website entry on font downloads', async () => {
  const css = await readFile('src/index.css', 'utf8');
  const fontCss = await readFile('src/styles/game-font.css', 'utf8');
  const introCss = await readFile('src/td/LevelIntro.css', 'utf8');
  const html = await readFile('index.html', 'utf8');
  const main = await readFile('src/main.tsx', 'utf8');
  assert.match(css, /font-family: 'Tower Defence'/);
  assert.match(css, /button, input, select, textarea, pre, code, kbd, samp/);
  assert.doesNotMatch(css + introCss, /Phigros Demo|SFMono-Regular|Consolas|cmdysj\.ttf/);
  assert.equal((fontCss.match(/font-display: swap/g) ?? []).length, manifest.subsets.length);
  assert.doesNotMatch(html, /as="font"/);
  assert.doesNotMatch(css, /@import.*game-font/);
  assert.match(main, /import\('\.\/styles\/game-font\.css'\)\.catch/);
  assert.match(fontCss, /game-latin\.woff2/);
  assert.match(fontCss, /game-ui\.woff2/);
});

test('build configurations keep even small font subsets external for on-demand loading', async () => {
  for (const path of ['vite.config.ts', 'demos/level-intro/vite.config.ts']) {
    assert.match(await readFile(path, 'utf8'), /assetsInlineLimit: filePath => \/\\\.woff2\$\/i\.test\(filePath\) \? false : undefined/);
  }
});
