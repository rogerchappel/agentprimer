import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { scanRepo } from '../src/scan.js';

describe('scanRepo', () => {
  it('detects Node CLI scripts and package manager fallback', async () => {
    const primer = await scanRepo('fixtures/node-cli', { deterministicTime: true });

    assert.equal(primer.name, 'fixture-node-cli');
    assert.equal(primer.packageManager, 'npm');
    assert.ok(primer.languages.includes('TypeScript'));
    assert.ok(primer.frameworks.includes('Node CLI'));
    assert.ok(primer.commands.some((command) => command.name === 'test' && command.command === 'npm run test'));
    assert.equal(primer.handoff.checks.find((check) => check.id === 'readme-present')?.passed, true);
    assert.equal(primer.handoff.checks.find((check) => check.id === 'verification-command-detected')?.passed, true);
    assert.ok(primer.handoff.score > 50);
  });

  it('detects Python packages without inventing Node commands', async () => {
    const primer = await scanRepo('fixtures/python-package', { deterministicTime: true });

    assert.ok(primer.languages.includes('Python'));
    assert.ok(primer.frameworks.includes('Python package'));
    assert.ok(primer.commands.some((command) => command.command === 'python -m pytest'));
  });

  it('reports sparse onboarding gaps', async () => {
    const primer = await scanRepo('fixtures/sparse-repo', { deterministicTime: true });

    assert.ok(primer.gaps.some((gap) => gap.path === 'README.md'));
    assert.ok(primer.gaps.some((gap) => gap.path === 'AGENTS.md'));
    assert.ok(primer.gaps.some((gap) => gap.path === 'tests/'));
    assert.equal(primer.handoff.checks.find((check) => check.id === 'readme-present')?.passed, false);
    assert.ok(primer.handoff.score < 50);
  });

  it('detects Go module test commands', async () => {
    const primer = await scanRepo('fixtures/go-module', { deterministicTime: true });

    assert.ok(primer.languages.includes('Go'));
    assert.ok(primer.frameworks.includes('Go module'));
    assert.ok(primer.commands.some((command) => command.command === 'go test ./...'));
  });

  it('detects Rust crate test commands', async () => {
    const primer = await scanRepo('fixtures/rust-crate', { deterministicTime: true });

    assert.ok(primer.languages.includes('Rust'));
    assert.ok(primer.frameworks.includes('Rust crate'));
    assert.ok(primer.commands.some((command) => command.command === 'cargo test'));
  });

  it('supports repositories without a package manifest', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'agentprimer-no-package-'));
    try {
      await writeFile(path.join(root, 'README.md'), '# No package manifest\n');

      const primer = await scanRepo(root, { deterministicTime: true });

      assert.equal(primer.name, path.basename(root));
      assert.equal(primer.packageManager, undefined);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects malformed package manifests with their path', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'agentprimer-malformed-package-'));
    const manifestPath = path.join(root, 'package.json');
    try {
      await writeFile(manifestPath, '{ invalid json\n');

      await assert.rejects(
        scanRepo(root, { deterministicTime: true }),
        (error: Error) => error.message.startsWith(`invalid package manifest ${manifestPath}:`)
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects an unreadable package manifest path', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'agentprimer-unreadable-package-'));
    const manifestPath = path.join(root, 'package.json');
    try {
      await mkdir(manifestPath);

      await assert.rejects(
        scanRepo(root, { deterministicTime: true }),
        (error: Error) => error.message.startsWith(`cannot read package manifest ${manifestPath}:`)
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('preserves high-value signals and reports truncation above the file limit', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'agentprimer-large-'));
    try {
      await Promise.all(['docs', 'src', 'tests'].map((dir) => mkdir(path.join(root, dir))));
      await Promise.all([
        writeFile(path.join(root, 'README.md'), '# Large fixture\n'),
        writeFile(path.join(root, 'package.json'), JSON.stringify({
          name: 'large-fixture',
          scripts: { test: 'node --test' }
        })),
        writeFile(path.join(root, 'src/index.ts'), 'export const value = 1;\n'),
        writeFile(path.join(root, 'tests/app.test.ts'), 'export {};\n'),
        ...Array.from({ length: 805 }, (_, index) =>
          writeFile(path.join(root, 'docs', `${String(index).padStart(3, '0')}.txt`), 'fixture\n')
        )
      ]);

      const primer = await scanRepo(root, { deterministicTime: true });

      assert.deepEqual(primer.scan, {
        truncated: true,
        fileLimit: 800,
        filesDiscovered: 809,
        filesIncluded: 800
      });
      assert.ok(primer.languages.includes('TypeScript'));
      assert.ok(primer.entryPoints.some((entry) => entry.path === 'src/index.ts'));
      assert.ok(primer.conventions.some((entry) => entry.path === 'README.md'));
      assert.ok(primer.configs.some((entry) => entry.path === 'package.json'));
      assert.ok(!primer.gaps.some((gap) => gap.path === 'README.md'));
      assert.ok(!primer.gaps.some((gap) => gap.path === 'tests/'));
      assert.equal(primer.handoff.checks.find((check) => check.id === 'readme-present')?.passed, true);
      assert.equal(primer.handoff.checks.find((check) => check.id === 'entry-point-detected')?.passed, true);
      assert.equal(primer.handoff.checks.find((check) => check.id === 'test-surface-present')?.passed, true);
      assert.ok(primer.handoff.score > 17);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
