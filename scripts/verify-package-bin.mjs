import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const bins = Object.entries(pkg.bin ?? {});

if (bins.length === 0) {
  throw new Error('package.json does not declare any CLI bin entries');
}

const missing = [];
for (const [name, target] of bins) {
  try {
    await access(new URL(`../${target}`, import.meta.url));
  } catch {
    missing.push(`${name} -> ${target}`);
  }
}

if (missing.length > 0) {
  throw new Error(`package bin target(s) missing after build: ${missing.join(', ')}`);
}

const importProbe = spawnSync(process.execPath, ['--input-type=module', '--eval', `
  const stdout = [];
  const stderr = [];
  const out = process.stdout.write;
  const err = process.stderr.write;
  process.stdout.write = (chunk) => { stdout.push(String(chunk)); return true; };
  process.stderr.write = (chunk) => { stderr.push(String(chunk)); return true; };
  process.exitCode = undefined;
  const api = await import('./dist/src/index.js');
  const result = { stdout: stdout.join(''), stderr: stderr.join(''), exitCode: process.exitCode,
    scanRepo: typeof api.scanRepo, suggestTask: typeof api.suggestTask };
  process.stdout.write = out;
  process.stderr.write = err;
  console.log(JSON.stringify(result));
`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
assert.equal(importProbe.status, 0, importProbe.stderr);
assert.deepEqual(JSON.parse(importProbe.stdout), {
  stdout: '', stderr: '', scanRepo: 'function', suggestTask: 'function',
});

const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: new URL('..', import.meta.url), encoding: 'utf8',
});
assert.equal(pack.status, 0, pack.stderr);
const files = JSON.parse(pack.stdout)[0].files.map(({ path }) => path);
for (const required of ['dist/src/index.js', 'dist/src/index.d.ts', 'dist/src/cli-entry.js', 'README.md', 'LICENSE']) {
  assert.ok(files.includes(required), `packed artifact is missing ${required}`);
}
assert.ok(files.some((path) => path.startsWith('dist/src/') && path.endsWith('.d.ts')), 'packed artifact has no declarations');
assert.ok(!files.some((path) => path.startsWith('dist/tests/')), 'packed artifact contains compiled tests');

console.log(`Verified ${bins.length} package bin target(s), import safety, and ${files.length} packed files.`);
