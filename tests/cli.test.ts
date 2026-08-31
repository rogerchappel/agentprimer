import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

const cli = ['dist/src/cli-entry.js'];

describe('CLI', () => {
  function run(...args: string[]) {
    return spawnSync(process.execPath, [...cli, ...args], { encoding: 'utf8' });
  }

  it('prints help', () => {
    const result = spawnSync(process.execPath, [...cli, '--help'], { encoding: 'utf8' });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /agentprimer scan/);
  });

  it('prints deterministic JSON', () => {
    const result = spawnSync(process.execPath, [...cli, 'scan', 'fixtures/node-cli', '--format', 'json', '--deterministic'], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout) as { generatedAt: string };
    assert.equal(parsed.generatedAt, '1970-01-01T00:00:00.000Z');
  });

  it('validates handoff readiness with a nonzero exit on failure', () => {
    const result = spawnSync(process.execPath, [...cli, 'validate', 'fixtures/sparse-repo', '--min-score', '70'], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 2);
    assert.match(result.stdout, /Result: fail/);
    assert.match(result.stdout, /README is present/);
  });

  it('validates handoff readiness as JSON', () => {
    const result = spawnSync(process.execPath, [...cli, 'validate', 'fixtures/node-cli', '--min-score', '50', '--format', 'json'], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout) as { passed: boolean; score: number };
    assert.equal(parsed.passed, true);
    assert.ok(parsed.score >= 50);
  });

  it('uses the configured minimum score as the validation gate', () => {
    const passing = run('validate', 'fixtures/docs-only', '--min-score', '17', '--format', 'json');

    assert.equal(passing.status, 0);
    const parsed = JSON.parse(passing.stdout) as {
      passed: boolean;
      score: number;
      failedChecks: Array<{ label: string }>;
    };
    assert.equal(parsed.score, 17);
    assert.equal(parsed.passed, true);
    assert.ok(parsed.failedChecks.length > 0);

    const failing = run('validate', 'fixtures/docs-only', '--min-score', '18');

    assert.equal(failing.status, 2);
    assert.match(failing.stdout, /Score: 17\/100/);
    assert.match(failing.stdout, /Required score: 18\/100/);
    assert.match(failing.stdout, /Result: fail/);
    assert.match(failing.stdout, /Agent instructions are present/);
  });

  it('accepts options before the repo and equal-sign values', () => {
    const result = run('scan', '--format=json', '--deterministic', 'fixtures/node-cli');

    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout) as { generatedAt: string };
    assert.equal(parsed.generatedAt, '1970-01-01T00:00:00.000Z');
  });

  it('rejects unknown options for every command', () => {
    for (const command of ['scan', 'validate', 'suggest-task']) {
      const result = run(command, 'fixtures/node-cli', '--bogus');
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown option: --bogus/);
    }
  });

  it('rejects missing command-specific option values', () => {
    const cases = [
      ['scan', '--format'],
      ['validate', '--min-score'],
      ['suggest-task', '--max-risk']
    ];
    for (const args of cases) {
      const result = run(...args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Missing value for option/);
    }
  });

  it('rejects option tokens used as values', () => {
    const result = run('scan', '--format', '--deterministic', 'fixtures/node-cli');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing value for option: --format/);
  });

  it('reports malformed package manifests on stderr without emitting a packet', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'agentprimer-cli-malformed-'));
    try {
      const manifestPath = path.join(root, 'package.json');
      writeFileSync(manifestPath, '{ invalid json\n');

      const result = run('scan', root, '--format', 'json');

      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, new RegExp(`^agentprimer: invalid package manifest ${escapeRegex(manifestPath)}:`));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
