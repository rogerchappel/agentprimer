import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('primer packet demo', () => {
  it('uses the executable CLI entrypoint and writes the expected packet files', () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'agentprimer-demo-test-'));
    try {
      const script = readFileSync('demo/run-primer-packet.sh', 'utf8');
      const invocations = [...script.matchAll(/^node (\S+) (?:scan|suggest-task)\b/gm)];

      assert.equal(invocations.length, 3);
      for (const invocation of invocations) {
        assert.equal(invocation[1], 'dist/src/cli-entry.js');
      }

      execFileSync('bash', ['demo/run-primer-packet.sh'], {
        env: { ...process.env, TMPDIR: tempRoot },
        stdio: 'pipe'
      });

      const outputDir = path.join(tempRoot, 'agentprimer-demo');
      assert.match(readFileSync(path.join(outputDir, 'node-cli-primer.md'), 'utf8'), /Agent Primer: fixture-node-cli/);
      assert.match(readFileSync(path.join(outputDir, 'sparse-task.md'), 'utf8'), /Suggested First Task/);
      assert.equal(JSON.parse(readFileSync(path.join(outputDir, 'python-package.json'), 'utf8')).name, 'python-package');
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
