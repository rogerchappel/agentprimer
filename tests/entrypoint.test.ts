import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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

test('checkout documentation uses the executable CLI entrypoint', () => {
  const documentedFiles = [
    'README.md',
    'docs/tutorials/create-agent-onboarding-packet.md',
    'docs/promo/video-brief.md',
  ];

  for (const file of documentedFiles) {
    const contents = readFileSync(file, 'utf8');
    assert.doesNotMatch(contents, /node dist\/src\/index\.js\s+(?:scan|suggest-task|validate)\b/, file);
  }
});

test('documented checkout scan and suggest-task commands create their outputs', () => {
  const outputDir = mkdtempSync(path.join(tmpdir(), 'agentprimer-documented-cli-'));
  const cases = [
    ['scan', 'fixtures/node-cli', '--deterministic', '--out', path.join(outputDir, 'primer.md')],
    ['suggest-task', 'fixtures/sparse-repo', '--max-risk', 'low', '--deterministic', '--out', path.join(outputDir, 'task.md')],
  ];

  try {
    for (const args of cases) {
      const result = spawnSync(process.execPath, ['dist/src/cli-entry.js', ...args], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(existsSync(args.at(-1)!), true, `missing documented output: ${args.at(-1)}`);
    }
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
