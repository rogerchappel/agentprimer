import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const cli = ['dist/src/index.js'];

describe('CLI', () => {
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
});
