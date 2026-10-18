import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { parseDocument } from 'yaml';

const workflowPath = resolve('.github/workflows/release.yml');

const dryRunWorkflowPath = resolve('.github/workflows/release-dry-run.yml');

async function readWorkflow(path: string) {
  const source = await readFile(path, 'utf8');
  const document = parseDocument(source, { uniqueKeys: true });
  assert.deepEqual(document.errors, [], `${path} must be valid YAML`);
  return document.toJS() as {
    on?: Record<string, unknown>;
    permissions?: Record<string, string>;
    jobs?: Record<string, { steps?: Array<{ run?: string }> }>;
  };
}

test('release workflows keep publishing limited to version-tag pushes', async () => {
  const release = await readWorkflow(workflowPath);
  const dryRun = await readWorkflow(dryRunWorkflowPath);

  assert.deepEqual(release.on?.push, { tags: ['v*.*.*'] });
  assert.equal(release.on?.workflow_dispatch, undefined);
  assert.equal(release.on?.pull_request, undefined);
  assert.ok(Object.hasOwn(dryRun.on ?? {}, 'workflow_dispatch'), 'dry-run must support manual validation');
  assert.ok(Object.hasOwn(dryRun.on ?? {}, 'pull_request'), 'dry-run must validate relevant pull requests');
  assert.equal(dryRun.on?.push, undefined, 'dry-run must not publish on pushes');
});

test('only the release workflow requests write and npm publish permissions', async () => {
  const release = await readWorkflow(workflowPath);
  const dryRun = await readWorkflow(dryRunWorkflowPath);

  assert.deepEqual(release.permissions, { contents: 'write', 'id-token': 'write' });
  assert.deepEqual(dryRun.permissions, { contents: 'read' });
  const releaseCommands = Object.values(release.jobs ?? {}).flatMap((job) => job.steps ?? [])
    .map((step) => step.run ?? '').join('\n');
  const dryRunCommands = Object.values(dryRun.jobs ?? {}).flatMap((job) => job.steps ?? [])
    .map((step) => step.run ?? '').join('\n');

  assert.match(releaseCommands, /npm publish\b/);
  assert.doesNotMatch(dryRunCommands, /\bnpm publish\b|\bgh release create\b/);
});

test('release workflow only publishes version tags', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const document = parseDocument(workflow, { uniqueKeys: true });
  assert.deepEqual(document.errors, [], 'release workflow must be valid YAML');
  const parsed = document.toJS() as {
    on: { push?: { tags?: string[] }; workflow_dispatch?: unknown; pull_request?: unknown };
  };

  assert.deepEqual(parsed.on?.push?.tags, ['v*.*.*']);
  assert.equal(parsed.on?.workflow_dispatch, undefined);
  assert.equal(parsed.on?.pull_request, undefined);
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

test('release workflow installs and verifies trusted-publishing npm before npm ci', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const installNpm = workflow.indexOf('npm install --global npm@11.5.1');
  const verifyNpm = workflow.indexOf('npm --version');
  const installDependencies = workflow.indexOf('npm ci');

  assert.ok(installNpm >= 0, 'expected a pinned trusted-publishing npm CLI install');
  assert.ok(verifyNpm > installNpm, 'npm version verification must follow npm installation');
  assert.ok(installDependencies > verifyNpm, 'trusted-publishing npm setup must precede npm ci');
});
