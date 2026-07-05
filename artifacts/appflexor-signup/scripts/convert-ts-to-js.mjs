import fs from 'fs/promises';
import path from 'path';
import { transform } from 'esbuild';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full);
    else if (/\.(ts|tsx)$/.test(ent.name)) await convert(full);
  }
}

async function convert(filePath) {
  const ext = path.extname(filePath);
  const loader = ext === '.tsx' ? 'tsx' : 'ts';
  const outExt = ext === '.tsx' ? '.jsx' : '.js';
  const source = await fs.readFile(filePath, 'utf8');
  const res = await transform(source, { loader, jsx: 'transform', sourcemap: false });
  const outPath = filePath.replace(/\.(ts|tsx)$/, outExt);

  // write transformed file to outPath
  await fs.writeFile(outPath, res.code, 'utf8');

  // backup original and remove it
  await fs.rename(filePath, filePath + '.bak');
  console.log(`Converted ${filePath} -> ${outPath}`);
}

(async function main(){
  const root = path.resolve(new URL(import.meta.url).pathname.replace(/^\/[A-Za-z]:\//, '/').replace(/^\//, ''));
  // locate project src directory
  const srcDir = path.join(process.cwd(), 'artifacts', 'appflexor-signup', 'src');
  try {
    await walk(srcDir);
    console.log('Conversion complete. Original files have .bak backups.');
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
})();
