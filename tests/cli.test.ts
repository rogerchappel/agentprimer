import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const cli = ['dist/src/index.js'];

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
});
