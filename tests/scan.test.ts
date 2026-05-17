import assert from 'node:assert/strict';
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
});
