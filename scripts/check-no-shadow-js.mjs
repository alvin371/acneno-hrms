import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const shouldDelete = process.argv.includes('--delete');

const shadowFiles = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const basePath = entryPath.slice(0, -3);
    if (fs.existsSync(`${basePath}.ts`) || fs.existsSync(`${basePath}.tsx`)) {
      shadowFiles.push(path.relative(rootDir, entryPath));
    }
  }
};

if (fs.existsSync(srcDir)) {
  walk(srcDir);
}

if (shadowFiles.length > 0) {
  if (shouldDelete) {
    for (const file of shadowFiles) {
      fs.unlinkSync(path.join(rootDir, file));
    }

    console.log(`Deleted ${shadowFiles.length} shadow JS file(s) from src/.`);
    process.exit(0);
  }

  console.error('Shadow JS files found beside TS/TSX source:');
  for (const file of shadowFiles.sort()) {
    console.error(`- ${file}`);
  }
  console.error('');
  console.error('These files are generated artifacts, usually from running `tsc` with explicit file arguments');
  console.error('(for example `tsc src/App.tsx`). That mode ignores `tsconfig.json`, so `noEmit: true` is bypassed');
  console.error('and TypeScript writes `.js` next to the `.ts`/`.tsx` sources.');
  console.error('');
  console.error('Use `pnpm typecheck` for type-checking and `pnpm clean:shadow-js` to remove these files.');
  process.exit(1);
}

console.log('No shadow JS files found in src/.');
