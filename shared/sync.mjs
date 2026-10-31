// Copies the canonical files in /shared into admin/src and storefront/src at
// their real import paths, so neither app's build/tsc/vite setup needs to
// change at all — every existing `from './components/CasePreview'`-style
// import just keeps resolving to a real, now-generated, file. Run
// automatically via each app's `postinstall` script; safe to re-run anytime.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// [source in /shared, destination relative to an app's src/]
const FILES = [
  ['CameraSVG.tsx', 'components/CameraSVG.tsx'],
  ['supabase.ts', 'lib/supabase.ts'],
  ['frames.ts', 'lib/frames.ts'],
  ['catalog.ts', 'lib/_shared-catalog.ts'],
  ['CasePreview.tsx', 'components/CasePreview.tsx'],
];

const APPS = ['admin', 'storefront'];

function header(srcName) {
  return `// AUTO-GENERATED from /shared/${srcName} — do not edit this copy.\n// Edit the source file, then run \`node shared/sync.mjs\` (or just\n// \`npm install\` in admin/ or storefront/, which does it automatically).\n\n`;
}

for (const app of APPS) {
  for (const [srcName, destRel] of FILES) {
    const src = join(root, 'shared', srcName);
    const dest = join(root, app, 'src', destRel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, header(srcName) + readFileSync(src, 'utf8'));
    console.log(`synced ${app}/src/${destRel}`);
  }
}
