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
});
