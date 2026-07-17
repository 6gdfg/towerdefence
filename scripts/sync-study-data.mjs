import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'public', 'study-data');

await mkdir(outputDir, { recursive: true });
await Promise.all([
  copyFile(path.join(projectRoot, '2 高中-乱序.txt'), path.join(outputDir, 'words.txt')),
  copyFile(path.join(projectRoot, '2-高中-顺序.json'), path.join(outputDir, 'words.json')),
]);
