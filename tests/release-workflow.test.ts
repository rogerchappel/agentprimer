import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const workflowPath = resolve('.github/workflows/release.yml');

test('release workflow only publishes version tags', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /push:\s*\n\s+tags:\s*\n\s+- 'v\*\.\*\.\*'/);
  assert.doesNotMatch(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
});

test('release workflow publishes before creating the GitHub release', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const publishIndex = workflow.indexOf('npm publish');
  const releaseIndex = workflow.indexOf('gh release create');

  assert.notEqual(publishIndex, -1, 'expected an npm publish command');
  assert.notEqual(releaseIndex, -1, 'expected a GitHub release command');
  assert.ok(publishIndex < releaseIndex, 'npm publish must precede the GitHub release');
});

test('release workflow reuses the single inspected npm pack filename', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /pack_json="\$\(npm pack --json\)"/);
  assert.match(workflow, /result\.length !== 1/);
  assert.match(workflow, /test -f "\$package_filename"/);
  assert.match(workflow, /printf 'filename=%s\\n' "\$package_filename" >> "\$GITHUB_OUTPUT"/);
  assert.match(
    workflow,
    /npm publish "\$\{\{ steps\.package\.outputs\.filename \}\}" --access public --provenance/,
  );
  assert.match(
    workflow,
    /gh release create[^\n]+"\$\{\{ steps\.package\.outputs\.filename \}\}"/,
  );
  assert.doesNotMatch(workflow, /\*\.tgz/);
});
