// Builds storefront + admin and merges admin's build into storefront's
// dist/client/admin so both are served from one Worker (admin at /admin).
// Run from repo root: `node deploy.mjs` (or `npm run deploy`).
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = import.meta.dirname;
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

console.log('› building storefront');
run('npm run build', join(root, 'storefront'));

console.log('› building admin');
run('npm run build', join(root, 'admin'));

const adminOut = join(root, 'admin', 'dist');
const mergedAdminDest = join(root, 'storefront', 'dist', 'client', 'admin');

console.log('› merging admin build into storefront/dist/client/admin');
if (existsSync(mergedAdminDest)) rmSync(mergedAdminDest, { recursive: true });
cpSync(adminOut, mergedAdminDest, { recursive: true });
rmSync(join(mergedAdminDest, 'wrangler.json'), { force: true });

console.log('› deploying merged worker');
run('npx wrangler deploy', join(root, 'storefront'));
