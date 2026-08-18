import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('public entrypoint exports the library API without CLI side effects', () => {
  const probe = `
    const stdout = [];
    const stderr = [];
    const originalStdout = process.stdout.write;
    const originalStderr = process.stderr.write;
    process.stdout.write = (chunk) => { stdout.push(String(chunk)); return true; };
    process.stderr.write = (chunk) => { stderr.push(String(chunk)); return true; };
    process.exitCode = undefined;
    const api = await import('./dist/src/index.js');
    const result = { stdout: stdout.join(''), stderr: stderr.join(''), exitCode: process.exitCode,
      scanRepo: typeof api.scanRepo, suggestTask: typeof api.suggestTask };
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
    console.log(JSON.stringify(result));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', probe], {
    cwd: process.cwd(), encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    stdout: '', stderr: '', scanRepo: 'function', suggestTask: 'function',
  });
});
