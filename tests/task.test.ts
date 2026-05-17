import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scanRepo } from '../src/scan.js';
import { suggestTask } from '../src/task.js';

describe('suggestTask', () => {
  it('prefers missing agent instructions for sparse repos', async () => {
    const primer = await scanRepo('fixtures/sparse-repo', { deterministicTime: true });
    const task = suggestTask(primer, 'low');

    assert.equal(task.risk, 'low');
    assert.equal(task.title, 'Add concise agent instructions');
  });
});
